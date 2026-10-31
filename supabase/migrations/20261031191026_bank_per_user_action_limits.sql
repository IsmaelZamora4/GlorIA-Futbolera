-- Shared, transactional limits. Only trusted SECURITY DEFINER RPCs can consume them.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.bank_action_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('ticket', 'adjustment')),
  occurred_at timestamptz not null default clock_timestamp()
);

create index bank_action_events_owner_action_time_idx
  on private.bank_action_events (user_id, action, occurred_at desc);

revoke all on table private.bank_action_events from public, anon, authenticated;

create or replace function private.consume_bank_action(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz;
  v_count integer;
begin
  if p_user_id is null or p_action is null or p_action not in ('ticket', 'adjustment')
    or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':' || p_action, 0)
  );
  v_now := pg_catalog.clock_timestamp();

  delete from private.bank_action_events as event
  where event.user_id = p_user_id and event.action = p_action
    and event.occurred_at <= v_now - pg_catalog.make_interval(secs => p_window_seconds);

  select pg_catalog.count(*)::integer into v_count
  from private.bank_action_events as event
  where event.user_id = p_user_id and event.action = p_action
    and event.occurred_at > v_now - pg_catalog.make_interval(secs => p_window_seconds);

  if v_count >= p_limit then return false; end if;

  insert into private.bank_action_events (user_id, action, occurred_at)
  values (p_user_id, p_action, v_now);
  return true;
end;
$$;

revoke all on function private.consume_bank_action(uuid, text, integer, integer)
  from public, anon, authenticated;

-- Up to 10 tickets per minute, shared across app instances and direct RPC calls.
create or replace function public.create_bank_ticket(
  p_bank_id uuid,
  p_odds_mode text,
  p_stake numeric,
  p_total_odds numeric,
  p_legs jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_bet_id uuid;
  v_leg_id uuid;
  v_leg jsonb;
  v_pick jsonb;
  v_position integer := 0;
  v_pick_position integer;
  v_leg_count integer;
  v_total_picks integer := 0;
  v_event text;
  v_market text;
  v_selection text;
  v_odds numeric;
  v_combined_odds numeric := 1;
  v_pick_odds numeric;
begin
  if v_user_id is null then raise exception 'unauthorized'; end if;
  if not exists (select 1 from public.banks where id = p_bank_id and user_id = v_user_id) then
    raise exception 'bank_not_found';
  end if;
  if p_odds_mode is null or p_odds_mode not in ('combined', 'per_pick') then raise exception 'invalid_odds_mode'; end if;
  if p_stake is null or p_stake <= 0 or p_stake > 9999999999.99 or p_stake <> round(p_stake, 2) then
    raise exception 'invalid_stake';
  end if;
  if p_legs is null or jsonb_typeof(p_legs) <> 'array' then raise exception 'invalid_legs'; end if;
  v_leg_count := jsonb_array_length(p_legs);
  if v_leg_count < 1 or v_leg_count > 20 then raise exception 'invalid_leg_count'; end if;
  if p_odds_mode = 'combined' and (p_total_odds is null or p_total_odds < 1.001 or p_total_odds > 99999.999 or p_total_odds <> round(p_total_odds, 3)) then
    raise exception 'invalid_total_odds';
  end if;

  if p_odds_mode = 'per_pick' and p_total_odds is not null then raise exception 'unexpected_total_odds'; end if;
  for v_leg in select value from jsonb_array_elements(p_legs) loop
    if jsonb_typeof(v_leg) is distinct from 'object' then raise exception 'invalid_leg'; end if;
    if coalesce(char_length(btrim(v_leg->>'competition')), 0) not between 1 and 80
      or coalesce(char_length(btrim(v_leg->>'homeTeam')), 0) not between 1 and 80
      or coalesce(char_length(btrim(v_leg->>'awayTeam')), 0) not between 1 and 80
      or btrim(v_leg->>'homeTeam') = btrim(v_leg->>'awayTeam') then
      raise exception 'invalid_leg';
    end if;
    if coalesce(jsonb_typeof(v_leg->'picks'), 'null') <> 'array' then raise exception 'invalid_leg_picks'; end if;
    v_pick_position := jsonb_array_length(v_leg->'picks');
    if v_pick_position < 1 or v_pick_position > 20 then raise exception 'invalid_leg_pick_count'; end if;
    v_total_picks := v_total_picks + v_pick_position;
    if v_total_picks > 100 then raise exception 'too_many_picks'; end if;
    for v_pick in select value from jsonb_array_elements(v_leg->'picks') loop
      if jsonb_typeof(v_pick) is distinct from 'object' then raise exception 'invalid_pick'; end if;
      if coalesce(char_length(btrim(v_pick->>'market')), 0) not between 1 and 120
        or coalesce(char_length(btrim(v_pick->>'selection')), 0) not between 1 and 160 then
        raise exception 'invalid_pick';
      end if;
      if p_odds_mode = 'per_pick' then
        begin
          v_pick_odds := (v_pick->>'decimalOdds')::numeric;
        exception when others then raise exception 'invalid_pick_odds';
        end;
        if v_pick_odds is null or v_pick_odds < 1.001 or v_pick_odds > 99999.999 or v_pick_odds <> round(v_pick_odds, 3) then
          raise exception 'invalid_pick_odds';
        end if;
        v_combined_odds := v_combined_odds * v_pick_odds;
      elsif nullif(v_pick->>'decimalOdds', '') is not null then
        raise exception 'unexpected_pick_odds';
      end if;
    end loop;
  end loop;

  if p_odds_mode = 'per_pick' then
    v_combined_odds := round(v_combined_odds, 3);
    if v_combined_odds < 1.001 or v_combined_odds > 99999.999 then
      raise exception 'combined_odds_out_of_range';
    end if;
    v_odds := v_combined_odds;
  else
    v_odds := p_total_odds;
  end if;

  if not private.consume_bank_action(v_user_id, 'ticket', 10, 60) then
    raise exception using errcode = 'P0001', message = 'rate_limit_exceeded';
  end if;

  v_event := left(case when v_leg_count = 1
    then btrim(p_legs->0->>'competition') || ' · ' || btrim(p_legs->0->>'homeTeam') || ' vs ' || btrim(p_legs->0->>'awayTeam')
    else 'Combinada · ' || v_leg_count::text || ' partidos'
  end, 160);
  v_market := v_total_picks::text || case when v_total_picks = 1 then ' pronóstico' else ' pronósticos' end;
  v_selection := case when p_odds_mode = 'per_pick' then 'Cuotas por pronóstico' else 'Cuota total' end;

  insert into public.bets (bank_id, user_id, sport, event, market, selection, stake, decimal_odds, odds_mode)
  values (p_bank_id, v_user_id, 'Fútbol', v_event, v_market, v_selection, p_stake, v_odds, p_odds_mode)
  returning id into v_bet_id;

  for v_leg in select value from jsonb_array_elements(p_legs) loop
    insert into public.bank_bet_legs (bet_id, user_id, position, competition, home_team, away_team)
    values (v_bet_id, v_user_id, v_position, btrim(v_leg->>'competition'), btrim(v_leg->>'homeTeam'), btrim(v_leg->>'awayTeam'))
    returning id into v_leg_id;
    v_pick_position := 0;
    for v_pick in select value from jsonb_array_elements(v_leg->'picks') loop
      if p_odds_mode = 'per_pick' then v_pick_odds := (v_pick->>'decimalOdds')::numeric; else v_pick_odds := null; end if;
      insert into public.bank_bet_picks (bet_id, leg_id, user_id, position, market, selection, decimal_odds)
      values (v_bet_id, v_leg_id, v_user_id, v_pick_position, btrim(v_pick->>'market'), btrim(v_pick->>'selection'), v_pick_odds);
      v_pick_position := v_pick_position + 1;
    end loop;
    v_position := v_position + 1;
  end loop;

  return v_bet_id;
end;
$$;

revoke all on function public.create_bank_ticket(uuid, text, numeric, numeric, jsonb)
  from public, anon, authenticated;
grant execute on function public.create_bank_ticket(uuid, text, numeric, numeric, jsonb)
  to authenticated;

-- Up to 5 adjustments per hour; direct table writes removed to enforce the same limit.
revoke insert, update on table public.bank_adjustments from authenticated;

create or replace function public.create_bank_adjustment(
  p_bank_id uuid,
  p_amount numeric,
  p_kind text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_adjustment_id uuid;
begin
  if v_user_id is null then raise exception 'unauthorized'; end if;
  if not exists (select 1 from public.banks where id = p_bank_id and user_id = v_user_id) then
    raise exception 'bank_not_found';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 9999999999.99 or p_amount <> round(p_amount, 2) then
    raise exception 'invalid_adjustment_amount';
  end if;
  if p_kind not in ('deposit', 'withdrawal') then raise exception 'invalid_adjustment_kind'; end if;
  if p_note is not null and char_length(p_note) > 240 then raise exception 'invalid_adjustment_note'; end if;

  if not private.consume_bank_action(v_user_id, 'adjustment', 5, 3600) then
    raise exception using errcode = 'P0001', message = 'rate_limit_exceeded';
  end if;

  insert into public.bank_adjustments (bank_id, user_id, amount, kind, note)
  values (p_bank_id, v_user_id, p_amount, p_kind, nullif(btrim(p_note), ''))
  returning id into v_adjustment_id;
  return v_adjustment_id;
end;
$$;

revoke all on function public.create_bank_adjustment(uuid, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.create_bank_adjustment(uuid, numeric, text, text)
  to authenticated;
