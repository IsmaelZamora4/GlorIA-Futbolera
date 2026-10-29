import Link from "next/link";
import { redirect } from "next/navigation";
import { AppSidebar } from "../../components/AppSidebar";
import { createClient } from "../../lib/supabase/server";
import { calculateBankSummary, type AdjustmentRecord, type BetRecord } from "../../lib/bank/calculations";
import { BankDashboard } from "../../components/BankDashboard";

export default async function BankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bank");

  const bankQuery = await supabase.from("banks").select("currency, initial_capital").eq("user_id", user.id).maybeSingle();
  const bank = bankQuery.data;
  const betsQuery = bank ? await supabase.from("bets").select("id, event, market, selection, stake, decimal_odds, status, placed_at").eq("user_id", user.id).order("placed_at", { ascending: false }) : { data: [], error: null };
  const adjustmentsQuery = bank ? await supabase.from("bank_adjustments").select("amount, kind, note, occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }) : { data: [], error: null };
  const summaryBets: BetRecord[] = (betsQuery.data ?? []).map((bet) => ({ stake: Number(bet.stake), decimalOdds: Number(bet.decimal_odds), status: bet.status as BetRecord["status"] }));
  const summaryAdjustments: AdjustmentRecord[] = (adjustmentsQuery.data ?? []).map((adjustment) => ({ amount: Number(adjustment.amount), kind: adjustment.kind as AdjustmentRecord["kind"] }));
  const summary = bank ? calculateBankSummary({ initialCapital: Number(bank.initial_capital), currency: bank.currency }, summaryBets, summaryAdjustments) : null;
  const dataError = bankQuery.error?.code === "42P01" ? "Falta aplicar la migración de Supabase antes de usar el Bank." : bankQuery.error || betsQuery.error || adjustmentsQuery.error ? "No se pudieron cargar los datos del Bank." : undefined;
  return <div className="app-shell"><AppSidebar active="Mi Bank" /><main className="main-area"><header className="topbar"><div className="methodology-topbar-title"><span className="eyebrow">Espacio privado</span><strong>Mi Bank</strong></div><div className="top-actions"><Link className="methodology-topbar-link" href="/">Volver al análisis <span aria-hidden="true">→</span></Link></div></header><div className="bank-page"><span className="eyebrow">Bank personal</span><h1>Tu control empieza aquí.</h1><p>Registra tus apuestas externas y entiende tu saldo, beneficio y rendimiento.</p><BankDashboard bank={bank} bets={betsQuery.data ?? []} adjustments={adjustmentsQuery.data ?? []} summary={summary} error={dataError} /></div></main></div>;
}
