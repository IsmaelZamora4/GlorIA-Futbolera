import { redirect } from "next/navigation";
import { AppSidebar } from "../../components/AppSidebar";
import { HomeUserProvider } from "../../components/HomeUserProvider";
import { SportiaPageHeader } from "../../components/SportiaPageHeader";
import { createClient } from "../../lib/supabase/server";
import { getHomeUserProfile } from "../../lib/auth/home-user-profile";
import { calculateBankSummary, type AdjustmentRecord, type BetRecord } from "../../lib/bank/calculations";
import { BankDashboard } from "../../components/BankDashboard";

export default async function BankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bank");
  const profile = getHomeUserProfile(user);

  const bankQuery = await supabase.from("banks").select("currency, initial_capital").eq("user_id", user.id).maybeSingle();
  const bank = bankQuery.data;
  const betsQuery = bank ? await supabase.from("bets").select("id, event, market, selection, stake, decimal_odds, status, placed_at").eq("user_id", user.id).order("placed_at", { ascending: false }) : { data: [], error: null };
  const adjustmentsQuery = bank ? await supabase.from("bank_adjustments").select("amount, kind, note, occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }) : { data: [], error: null };
  const summaryBets: BetRecord[] = (betsQuery.data ?? []).map((bet) => ({ stake: Number(bet.stake), decimalOdds: Number(bet.decimal_odds), status: bet.status as BetRecord["status"] }));
  const summaryAdjustments: AdjustmentRecord[] = (adjustmentsQuery.data ?? []).map((adjustment) => ({ amount: Number(adjustment.amount), kind: adjustment.kind as AdjustmentRecord["kind"] }));
  const summary = bank ? calculateBankSummary({ initialCapital: Number(bank.initial_capital), currency: bank.currency }, summaryBets, summaryAdjustments) : null;
  const dataError = bankQuery.error?.code === "42P01" ? "Falta aplicar la migración de Supabase antes de usar el Bank." : bankQuery.error || betsQuery.error || adjustmentsQuery.error ? "No se pudieron cargar los datos del Bank." : undefined;
  return <HomeUserProvider profile={profile}><div className="app-shell"><AppSidebar active="Mi Bank" /><main className="main-area"><SportiaPageHeader title="Mi Bank" description="Registra tus apuestas externas y entiende tu saldo, beneficio y rendimiento." /><div className="bank-page"><span className="eyebrow">Bank personal</span><h1>Tu control empieza aquí.</h1><BankDashboard bank={bank} bets={betsQuery.data ?? []} adjustments={adjustmentsQuery.data ?? []} summary={summary} error={dataError} /></div></main></div></HomeUserProvider>;
}
