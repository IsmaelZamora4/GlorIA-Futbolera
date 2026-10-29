-- GlorIA Futbolera: private betting bank schema.
-- All rows are owned by the authenticated Supabase user and protected by RLS.

create table public.banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null check (currency in ('PEN', 'USD', 'EUR')),
  initial_capital numeric(12, 2) not null check (initial_capital >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint banks_one_per_user unique (user_id),
  constraint banks_id_user_id_key unique (id, user_id)
);

create table public.bets (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.banks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  placed_at timestamptz not null default timezone('utc', now()),
  sport text not null check (char_length(btrim(sport)) between 1 and 80),
  event text not null check (char_length(btrim(event)) between 1 and 160),
  market text not null check (char_length(btrim(market)) between 1 and 120),
  selection text not null check (char_length(btrim(selection)) between 1 and 160),
  stake numeric(12, 2) not null check (stake > 0),
  decimal_odds numeric(8, 3) not null check (decimal_odds >= 1.001),
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  settled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  constraint bets_settlement_consistent check (
    (status = 'pending' and settled_at is null)
    or (status <> 'pending' and settled_at is not null)
  ),
  constraint bets_bank_owner_matches_user foreign key (bank_id, user_id)
    references public.banks(id, user_id) on delete cascade
);

create table public.bank_adjustments (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.banks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('deposit', 'withdrawal')),
  amount numeric(12, 2) not null check (amount > 0),
  note text check (note is null or char_length(note) <= 240),
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint adjustments_bank_owner_matches_user foreign key (bank_id, user_id)
    references public.banks(id, user_id) on delete cascade
);

create index bets_user_id_status_idx on public.bets(user_id, status);
create index bets_bank_id_placed_at_idx on public.bets(bank_id, placed_at desc);
create index bank_adjustments_user_id_occurred_at_idx on public.bank_adjustments(user_id, occurred_at desc);
create index bank_adjustments_bank_id_occurred_at_idx on public.bank_adjustments(bank_id, occurred_at desc);

alter table public.banks enable row level security;
alter table public.bets enable row level security;
alter table public.bank_adjustments enable row level security;

create policy "Users can view their own bank"
  on public.banks for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own bank"
  on public.banks for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can view their own bets"
  on public.bets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own bets"
  on public.bets for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own bets"
  on public.bets for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own bets"
  on public.bets for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own adjustments"
  on public.bank_adjustments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own adjustments"
  on public.bank_adjustments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own adjustments"
  on public.bank_adjustments for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own adjustments"
  on public.bank_adjustments for delete to authenticated
  using ((select auth.uid()) = user_id);
