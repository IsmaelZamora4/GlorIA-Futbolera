-- Aggregate the complete user ledger in Postgres. This avoids silently
-- truncating dashboard totals at PostgREST's per-request row limit.
create or replace function public.get_bank_summary()
returns table (
  currency text,
  initial_capital numeric,
  capital_total numeric,
  pending_amount numeric,
  available_balance numeric,
  net_profit numeric,
  yield_percent numeric,
  resolved_stake numeric,
  total_bets bigint,
  won_bets bigint,
  lost_bets bigint,
  void_bets bigint,
  win_rate_percent numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with user_bets as (
    select bet.stake, bet.decimal_odds, bet.status
    from public.bets as bet
    where bet.user_id = (select auth.uid())
  ),
  bet_totals as (
    select
      count(*) as total_bets,
      count(*) filter (where status = 'won') as won_bets,
      count(*) filter (where status = 'lost') as lost_bets,
      count(*) filter (where status = 'void') as void_bets,
      coalesce(sum(stake) filter (where status = 'pending'), 0) as pending_amount,
      coalesce(sum(case
        when status = 'won' then round(stake * (decimal_odds - 1), 2)
        when status = 'lost' then -stake
        else 0
      end), 0) as net_profit,
      coalesce(sum(stake) filter (where status in ('won', 'lost')), 0) as resolved_stake
    from user_bets
  ),
  adjustment_totals as (
    select coalesce(sum(case when adjustment.kind = 'deposit' then adjustment.amount else -adjustment.amount end), 0) as amount
    from public.bank_adjustments as adjustment
    where adjustment.user_id = (select auth.uid())
  )
  select
    bank.currency,
    bank.initial_capital,
    round(bank.initial_capital + adjustment_totals.amount + bet_totals.net_profit, 2) as capital_total,
    round(bet_totals.pending_amount, 2) as pending_amount,
    round(bank.initial_capital + adjustment_totals.amount + bet_totals.net_profit - bet_totals.pending_amount, 2) as available_balance,
    round(bet_totals.net_profit, 2) as net_profit,
    case when bet_totals.resolved_stake > 0
      then round((bet_totals.net_profit / bet_totals.resolved_stake) * 100, 2)
      else null
    end as yield_percent,
    round(bet_totals.resolved_stake, 2) as resolved_stake,
    bet_totals.total_bets,
    bet_totals.won_bets,
    bet_totals.lost_bets,
    bet_totals.void_bets,
    case when bet_totals.won_bets + bet_totals.lost_bets > 0
      then round((bet_totals.won_bets::numeric / (bet_totals.won_bets + bet_totals.lost_bets)) * 100, 2)
      else null
    end as win_rate_percent
  from public.banks as bank
  cross join bet_totals
  cross join adjustment_totals
  where bank.user_id = (select auth.uid());
$$;

-- Functions in public are executable by PUBLIC by default; only authenticated
-- callers may request their own RLS-filtered aggregate.
revoke all on function public.get_bank_summary() from public, anon, authenticated;
grant execute on function public.get_bank_summary() to authenticated;
