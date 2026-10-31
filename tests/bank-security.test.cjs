/* eslint @typescript-eslint/no-require-imports: off */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");

const schema = readFileSync("supabase/migrations/20261029000100_create_bank_schema.sql", "utf8");
const access = readFileSync("supabase/migrations/20261031153043_bank_limit_table_access.sql", "utf8");
const summary = readFileSync("supabase/migrations/20261031153622_bank_summary_rpc.sql", "utf8");

test("Bank tables enforce row-level ownership and bind child rows to their owner", () => {
  for (const table of ["banks", "bets", "bank_adjustments"]) {
    assert.match(schema, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, "i"));
  }
  assert.match(schema, /using\s*\(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(schema, /with check\s*\(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(schema, /foreign key \(bank_id, user_id\)\s+references public\.banks\(id, user_id\)/i);
  assert.match(schema, /unique \(user_id\)/i);
});

test("Bank data tables revoke public, anonymous, and authenticated blanket grants", () => {
  assert.match(access, /revoke\s+all(?:\s+privileges)?\s+on\s+table\s+public\.banks\s*,\s*public\.bets\s*,\s*public\.bank_adjustments\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*;/i);
});

test("authenticated users receive only the Bank operations the application uses", () => {
  assert.match(access, /grant\s+select\s*,\s*insert\s+on\s+table\s+public\.banks\s+to\s+authenticated\s*;/i);
  assert.match(access, /grant\s+select\s*,\s*insert\s*,\s*update\s+on\s+table\s+public\.bets\s+to\s+authenticated\s*;/i);
  assert.match(access, /grant\s+select\s*,\s*insert\s+on\s+table\s+public\.bank_adjustments\s+to\s+authenticated\s*;/i);
  assert.doesNotMatch(access, /grant\s+[^;]+\s+to\s+anon\s*;/i);
  assert.match(access, /drop policy if exists "users can delete their own bets"/i);
  assert.match(access, /drop policy if exists "users can update their own adjustments"/i);
  assert.match(access, /drop policy if exists "users can delete their own adjustments"/i);
});

test("el resumen SQL es invoker, no acepta propietario arbitrario y restringe EXECUTE", () => {
  assert.match(summary, /create or replace function public\.get_bank_summary\(\)/i);
  assert.match(summary, /security invoker/i);
  assert.match(summary, /set search_path\s*=\s*''/i);
  assert.match(summary, /where\s+\w+\.user_id\s*=\s*\(select auth\.uid\(\)\)/i);
  assert.match(summary, /revoke all on function public\.get_bank_summary\(\) from public, anon, authenticated/i);
  assert.match(summary, /grant execute on function public\.get_bank_summary\(\) to authenticated/i);
  assert.doesNotMatch(summary, /security definer/i);
});
