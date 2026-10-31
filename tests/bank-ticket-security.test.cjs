/* eslint @typescript-eslint/no-require-imports: off */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const migration = readFileSync("supabase/migrations/20261031180000_expand_bank_to_multi_pick_tickets.sql", "utf8");
const limitsMigration = readFileSync("supabase/migrations/20261031191026_bank_per_user_action_limits.sql", "utf8");

test("ticket legs and picks enforce owner-bound foreign keys and RLS", () => {
  assert.match(migration, /create table public\.bank_bet_legs/i);
  assert.match(migration, /create table public\.bank_bet_picks/i);
  assert.match(migration, /foreign key \(bet_id, user_id\)\s+references public\.bets\(id, user_id\)/i);
  assert.match(migration, /foreign key \(leg_id, bet_id, user_id\)\s+references public\.bank_bet_legs\(id, bet_id, user_id\)/i);
  assert.match(migration, /alter table public\.bank_bet_legs enable row level security/i);
  assert.match(migration, /alter table public\.bank_bet_picks enable row level security/i);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.doesNotMatch(migration, /grant update[^;]*bank_bet_picks to authenticated/i);
  assert.match(migration, /grant select on table public\.bank_bet_legs, public\.bank_bet_picks to authenticated/i);
});

test("ticket creation is transactional, validates the authenticated Bank owner, and bounds payload size", () => {
  assert.match(migration, /create or replace function public\.create_bank_ticket/i);
  assert.match(migration, /security definer\s+set search_path = ''/i);
  assert.match(migration, /v_user_id uuid := \(select auth\.uid\(\)\)/i);
  assert.match(migration, /where id = p_bank_id and user_id = v_user_id/i);
  assert.match(migration, /v_leg_count < 1 or v_leg_count > 20/i);
  assert.match(migration, /v_total_picks > 100/i);
  assert.match(migration, /revoke all on function public\.create_bank_ticket\([^;]+from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.create_bank_ticket\([^;]+to authenticated/i);
});

test("ticket status follows pick outcomes under a ticket lock and only authorized RPC settles", () => {
  assert.match(migration, /create or replace function public\.sync_bank_ticket_result/i);
  assert.match(migration, /from public\.bets as bet where bet\.id = new\.bet_id and bet\.user_id = new\.user_id for update/i);
  assert.match(migration, /pick\.result = 'lost'[\s\S]*?v_status := 'lost'/i);
  assert.match(migration, /p_odds_mode = 'combined'[\s\S]*?pick\.result = 'void'[\s\S]*?v_status := 'void'/i);
  assert.match(migration, /create or replace function public\.settle_bank_ticket_pick/i);
  assert.match(migration, /where pick\.id = p_pick_id and pick\.user_id = v_user_id and pick\.result = 'pending'/i);
  assert.match(migration, /where bet\.id = v_bet_id and bet\.user_id = v_user_id\s+for update/i);
});

test("migration preserves legacy bets as one leg and one pick", () => {
  assert.match(migration, /insert into public\.bank_bet_legs[\s\S]*?select id, user_id, 0, event, true from public\.bets/i);
  assert.match(migration, /insert into public\.bank_bet_picks[\s\S]*?bet\.market, bet\.selection, bet\.status/i);
});

test("rate limits are shared, serialized per owner/action, private, and enforced by write RPCs", () => {
  assert.match(limitsMigration, /create schema if not exists private/i);
  assert.match(limitsMigration, /create table private\.bank_action_events/i);
  assert.match(limitsMigration, /pg_advisory_xact_lock/i);
  assert.match(limitsMigration, /private\.consume_bank_action\(v_user_id, 'ticket', 10, 60\)/i);
  assert.match(limitsMigration, /private\.consume_bank_action\(v_user_id, 'adjustment', 5, 3600\)/i);
  assert.match(limitsMigration, /revoke insert, update on table public\.bank_adjustments from authenticated/i);
  assert.match(limitsMigration, /grant execute on function public\.create_bank_adjustment\([^;]+to authenticated/i);
  assert.match(limitsMigration, /where id = p_bank_id and user_id = v_user_id/i);
  assert.match(limitsMigration, /revoke all on function private\.consume_bank_action\([^;]+from public, anon, authenticated/i);
});
