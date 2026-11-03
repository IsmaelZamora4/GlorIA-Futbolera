-- Expand the legacy single-selection bet into a ticket with ordered fixtures and picks.
-- Existing rows are backfilled into one legacy leg and one pick without changing their financial values.

alter table public.bets
  add column odds_mode text not null default 'combined'
    check (odds_mode in ('combined', 'per_pick'));

alter table public.bets
  add constraint bets_id_user_id_key unique (id, user_id);

create table public.bank_bet_legs (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null check (position between 0 and 19),
  competition text,
  home_team text,
  away_team text,
  legacy_event text,
  is_legacy boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  constraint bank_bet_legs_bet_owner_fkey foreign key (bet_id, user_id)
    references public.bets(id, user_id) on delete cascade,
  constraint bank_bet_legs_position_key unique (bet_id, position),
  constraint bank_bet_legs_id_bet_owner_key unique (id, bet_id, user_id),
  constraint bank_bet_legs_ticket_shape check (
    (is_legacy and legacy_event is not null and competition is null and home_team is null and away_team is null)
    or
    (not is_legacy and legacy_event is null
      and competition is not null and home_team is not null and away_team is not null
      and char_length(btrim(competition)) between 1 and 80
      and char_length(btrim(home_team)) between 1 and 80
      and char_length(btrim(away_team)) between 1 and 80
      and home_team <> away_team)
  )
);

create table public.bank_bet_picks (
  id uuid primary key default gen_random_uuid(),
  bet_id uuid not null,
  leg_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  position smallint not null check (position between 0 and 19),
  market text not null check (char_length(btrim(market)) between 1 and 120),
  selection text not null check (char_length(btrim(selection)) between 1 and 160),
  decimal_odds numeric(8, 3),
  result text not null default 'pending' check (result in ('pending', 'won', 'lost', 'void')),
  settled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint bank_bet_picks_odds_check check (decimal_odds is null or decimal_odds between 1.001 and 99999.999),
  constraint bank_bet_picks_settlement_check check (
    (result = 'pending' and settled_at is null) or (result <> 'pending' and settled_at is not null)
  ),
  constraint bank_bet_picks_bet_owner_fkey foreign key (bet_id, user_id)
    references public.bets(id, user_id) on delete cascade,
  constraint bank_bet_picks_leg_owner_fkey foreign key (leg_id, bet_id, user_id)
    references public.bank_bet_legs(id, bet_id, user_id) on delete cascade,
  constraint bank_bet_picks_position_key unique (leg_id, position)
);

create index bank_bet_legs_bet_position_idx on public.bank_bet_legs(bet_id, position);
create index bank_bet_picks_bet_owner_idx on public.bank_bet_picks(bet_id, user_id);
create index bank_bet_picks_leg_position_idx on public.bank_bet_picks(leg_id, position);

alter table public.bank_bet_legs enable row level security;
alter table public.bank_bet_picks enable row level security;

create policy "Users can view their own ticket legs"
  on public.bank_bet_legs for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own ticket picks"
  on public.bank_bet_picks for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all privileges on table public.bank_bet_legs, public.bank_bet_picks from public, anon, authenticated;
grant select on table public.bank_bet_legs, public.bank_bet_picks to authenticated;
revoke insert, update on table public.bets from authenticated;

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

revoke all on function public.create_bank_ticket(uuid, text, numeric, numeric, jsonb) from public, anon, authenticated;
grant execute on function public.create_bank_ticket(uuid, text, numeric, numeric, jsonb) to authenticated;

-- Backfill existing single-pick records as a legacy leg, keeping their original ticket fields.
insert into public.bank_bet_legs (bet_id, user_id, position, legacy_event, is_legacy)
select id, user_id, 0, event, true from public.bets;

insert into public.bank_bet_picks (bet_id, leg_id, user_id, position, market, selection, result, settled_at)
select bet.id, leg.id, bet.user_id, 0, bet.market, bet.selection, bet.status,
  case when bet.status = 'pending' then null else bet.settled_at end
from public.bets as bet
join public.bank_bet_legs as leg on leg.bet_id = bet.id and leg.user_id = bet.user_id and leg.is_legacy;

create or replace function public.sync_bank_ticket_result()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_odds_mode text;
  v_status text;
  v_has_void boolean;
  v_has_won boolean;
  v_effective_odds numeric;
  v_pick_odds numeric;
begin
  if old.result is distinct from new.result then
    perform 1 from public.bets as bet where bet.id = new.bet_id and bet.user_id = new.user_id for update;
    select bet.odds_mode into v_odds_mode from public.bets as bet where bet.id = new.bet_id and bet.user_id = new.user_id;
    select
      coalesce(bool_or(pick.result = 'void'), false),
      coalesce(bool_or(pick.result = 'won'), false)
    into v_has_void, v_has_won
    from public.bank_bet_picks as pick
    where pick.bet_id = new.bet_id and pick.user_id = new.user_id;

    v_effective_odds := 1;
    for v_pick_odds in
      select pick.decimal_odds
      from public.bank_bet_picks as pick
      where pick.bet_id = new.bet_id and pick.user_id = new.user_id
        and pick.result <> 'void' and pick.decimal_odds is not null
    loop
      v_effective_odds := v_effective_odds * v_pick_odds;
    end loop;

    if exists (select 1 from public.bank_bet_picks as pick where pick.bet_id = new.bet_id and pick.user_id = new.user_id and pick.result = 'lost') then
      v_status := 'lost';
    elsif exists (select 1 from public.bank_bet_picks as pick where pick.bet_id = new.bet_id and pick.user_id = new.user_id and pick.result = 'pending') then
      v_status := 'pending';
    elsif v_odds_mode = 'combined' and exists (select 1 from public.bank_bet_picks as pick where pick.bet_id = new.bet_id and pick.user_id = new.user_id and pick.result = 'void') then
      v_status := 'void';
    elsif exists (select 1 from public.bank_bet_picks as pick where pick.bet_id = new.bet_id and pick.user_id = new.user_id and pick.result = 'won') then
      v_status := 'won';
    else
      v_status := 'void';
    end if;

    update public.bets as bet
    set status = v_status,
        settled_at = case when v_status = 'pending' then null else timezone('utc', now()) end,
        decimal_odds = case when v_odds_mode = 'per_pick' and v_status = 'won' then round(v_effective_odds, 3) else bet.decimal_odds end
    where bet.id = new.bet_id and bet.user_id = new.user_id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_bank_ticket_result() from public, anon, authenticated;
create trigger bank_bet_picks_sync_ticket_result
  after update of result on public.bank_bet_picks
  for each row execute function public.sync_bank_ticket_result();

create or replace function public.settle_bank_ticket_pick(p_pick_id uuid, p_result text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_bet_id uuid;
  v_ticket_status text;
begin
  if v_user_id is null then raise exception 'unauthorized'; end if;
  if p_result not in ('won', 'lost', 'void') then raise exception 'invalid_pick_result'; end if;
  select pick.bet_id into v_bet_id
  from public.bank_bet_picks as pick
  where pick.id = p_pick_id and pick.user_id = v_user_id and pick.result = 'pending';
  if v_bet_id is null then return false; end if;

  select bet.status into v_ticket_status
  from public.bets as bet
  where bet.id = v_bet_id and bet.user_id = v_user_id
  for update;
  if v_ticket_status is distinct from 'pending' then return false; end if;

  update public.bank_bet_picks
  set result = p_result, settled_at = timezone('utc', now())
  where id = p_pick_id and user_id = v_user_id and result = 'pending';
  return found;
end;
$$;

revoke all on function public.settle_bank_ticket_pick(uuid, text) from public, anon, authenticated;
grant execute on function public.settle_bank_ticket_pick(uuid, text) to authenticated;
