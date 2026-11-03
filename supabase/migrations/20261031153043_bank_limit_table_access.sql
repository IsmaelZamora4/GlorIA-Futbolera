-- RLS controls rows but does not protect TRUNCATE. Remove default/public
-- table privileges, then grant only the operations used by the Bank UI.
revoke all privileges on table
  public.banks,
  public.bets,
  public.bank_adjustments
from public, anon, authenticated;

grant select, insert on table public.banks to authenticated;
grant select, insert, update on table public.bets to authenticated;
grant select, insert on table public.bank_adjustments to authenticated;

-- These operations are not part of the interface. Keep the policies aligned
-- with the granted privileges in case table grants are widened later.
drop policy if exists "Users can delete their own bets" on public.bets;
drop policy if exists "Users can update their own adjustments" on public.bank_adjustments;
drop policy if exists "Users can delete their own adjustments" on public.bank_adjustments;
