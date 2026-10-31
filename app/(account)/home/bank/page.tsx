import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SportiaPageHeader } from "@/components/layout/SportiaPageHeader";
import { createClient } from "@/lib/supabase/server";
import type { BankSummary } from "@/features/bank/services/calculations";
import { BankDashboard, type BankAdjustment, type BankBet } from "@/features/bank/components/BankDashboard";

const historyPageSize = 25;

type BankSearchParams = Promise<{
  betsPage?: string | string[];
  adjustmentsPage?: string | string[];
}>;

type BankSummaryRow = {
  currency: string;
  initial_capital: number | string;
  capital_total: number | string;
  pending_amount: number | string;
  available_balance: number | string;
  net_profit: number | string;
  yield_percent: number | string | null;
  resolved_stake: number | string;
  total_bets: number;
  won_bets: number;
  lost_bets: number;
  void_bets: number;
  win_rate_percent: number | string | null;
};

function parsePage(value: string | string[] | undefined): number {
  const candidate = Number(Array.isArray(value) ? value[0] : value);
  return Number.isSafeInteger(candidate) && candidate > 0 ? Math.min(candidate, 100_000) : 1;
}

function numeric(value: number | string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBankSummary(row: BankSummaryRow): BankSummary | null {
  const capitalTotal = numeric(row.capital_total);
  const pendingAmount = numeric(row.pending_amount);
  const availableBalance = numeric(row.available_balance);
  const netProfit = numeric(row.net_profit);
  const resolvedStake = numeric(row.resolved_stake);
  const yieldPercent = numeric(row.yield_percent);
  const winRatePercent = numeric(row.win_rate_percent);
  const initialCapital = numeric(row.initial_capital);
  if ([capitalTotal, pendingAmount, availableBalance, netProfit, resolvedStake, initialCapital].some((value) => value === null)) return null;

  return {
    capitalTotal: capitalTotal!,
    pendingAmount: pendingAmount!,
    availableBalance: availableBalance!,
    netProfit: netProfit!,
    yieldPercent,
    resolvedStake: resolvedStake!,
    totalBets: row.total_bets,
    wonBets: row.won_bets,
    lostBets: row.lost_bets,
    voidBets: row.void_bets,
    winRatePercent,
  };
}

function getLoadError(error: { code?: string } | null | undefined): string {
  if (error?.code === "42P01" || error?.code === "42883") {
    return "Falta actualizar el esquema de Mi Bank en Supabase. Aplica las migraciones pendientes y vuelve a intentarlo.";
  }
  return "No pudimos cargar el Bank completo. Tus cifras no se muestran para evitar presentar un saldo parcial.";
}

export default async function BankPage({ searchParams }: { searchParams: BankSearchParams }) {
  const params = await searchParams;
  const requestedBetsPage = parsePage(params.betsPage);
  const requestedAdjustmentsPage = parsePage(params.adjustmentsPage);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/home/bank");

  const { data: bank, error: bankError } = await supabase
    .from("banks")
    .select("currency, initial_capital")
    .eq("user_id", user.id)
    .maybeSingle();

  if (bankError) {
    return <BankPageShell><BankDashboard bank={null} bets={[]} adjustments={[]} summary={null} loadError={getLoadError(bankError)} /></BankPageShell>;
  }

  if (!bank) {
    return <BankPageShell><BankDashboard bank={null} bets={[]} adjustments={[]} summary={null} /></BankPageShell>;
  }

  const [summaryResult, betCountResult, adjustmentCountResult] = await Promise.all([
    supabase.rpc("get_bank_summary"),
    supabase.from("bets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("bank_adjustments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const summaryRow = (Array.isArray(summaryResult.data) ? summaryResult.data[0] : summaryResult.data) as BankSummaryRow | null;
  const summary = summaryRow ? toBankSummary(summaryRow) : null;
  const loadError = summaryResult.error
    ? getLoadError(summaryResult.error)
    : betCountResult.error
      ? getLoadError(betCountResult.error)
      : adjustmentCountResult.error
        ? getLoadError(adjustmentCountResult.error)
        : !summary
          ? "No se pudo calcular el resumen de tu Bank. Tus cifras no se muestran para evitar presentar un saldo parcial."
          : undefined;

  if (loadError) {
    return <BankPageShell><BankDashboard bank={bank} bets={[]} adjustments={[]} summary={null} loadError={loadError} /></BankPageShell>;
  }

  const betsTotal = betCountResult.count ?? 0;
  const adjustmentsTotal = adjustmentCountResult.count ?? 0;
  const betsPages = Math.max(1, Math.ceil(betsTotal / historyPageSize));
  const adjustmentsPages = Math.max(1, Math.ceil(adjustmentsTotal / historyPageSize));
  const betsPage = Math.min(requestedBetsPage, betsPages);
  const adjustmentsPage = Math.min(requestedAdjustmentsPage, adjustmentsPages);

  const [betsResult, adjustmentsResult] = await Promise.all([
    supabase
      .from("bets")
      .select("id, event, market, selection, stake, decimal_odds, status, placed_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("placed_at", { ascending: false })
      .order("id", { ascending: false })
      .range((betsPage - 1) * historyPageSize, betsPage * historyPageSize - 1),
    supabase
      .from("bank_adjustments")
      .select("id, amount, kind, note, occurred_at", { count: "exact" })
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .range((adjustmentsPage - 1) * historyPageSize, adjustmentsPage * historyPageSize - 1),
  ]);

  const historyError = betsResult.error ?? adjustmentsResult.error;
  if (historyError) {
    return <BankPageShell><BankDashboard bank={bank} bets={[]} adjustments={[]} summary={null} loadError={getLoadError(historyError)} /></BankPageShell>;
  }

  return (
    <BankPageShell>
      <BankDashboard
        bank={bank}
        bets={(betsResult.data ?? []) as BankBet[]}
        adjustments={(adjustmentsResult.data ?? []) as BankAdjustment[]}
        summary={summary}
        betsPage={betsPage}
        betsPages={betsPages}
        betsTotal={betsTotal}
        adjustmentsPage={adjustmentsPage}
        adjustmentsPages={adjustmentsPages}
        adjustmentsTotal={adjustmentsTotal}
      />
    </BankPageShell>
  );
}

function BankPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell bank-shell">
      <AppSidebar active="Mi Bank" />
      <main className="main-area">
        <SportiaPageHeader title="Mi Bank" description="Registra tus apuestas externas y entiende tu saldo, beneficio y rendimiento." />
        <div className="bank-page">
          <span className="eyebrow">Bank personal</span>
          <h1>Tu control empieza aquí.</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
