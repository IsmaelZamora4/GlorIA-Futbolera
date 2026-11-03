"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseBankTicketDraft, validateAdjustmentInput, validateBankInput, type BankCurrency } from "@/features/bank/services/calculations";
import { resolveBankFootballLeg } from "@/features/bank/services/football-options";

type ActionResult = { error?: string; success?: string };

function getText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, field: string): number {
  const value = formData.get(field);
  return typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
}

export async function createBank(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const currency = getText(formData, "currency");
  const initialCapital = getNumber(formData, "initialCapital");
  const errors = validateBankInput({ initialCapital, currency });
  if (errors.length) return { error: errors[0] };
  const { error } = await supabase.from("banks").insert({ user_id: user.id, currency: currency as BankCurrency, initial_capital: initialCapital });
  if (error) return { error: error.code === "23505" ? "Ya tienes un Bank creado." : "No se pudo crear el Bank. Comprueba que la migración esté aplicada." };
  revalidatePath("/home/bank");
  return { success: "Bank creado correctamente." };
}

export async function createBet(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const { data: bank, error: bankError } = await supabase.from("banks").select("id").eq("user_id", user.id).maybeSingle();
  if (bankError || !bank) return { error: "No se encontró tu Bank. Configúralo antes de registrar una apuesta." };

  let payload: unknown;
  try {
    const serialized = getText(formData, "ticket");
    if (!serialized || serialized.length > 100_000) return { error: "El ticket está vacío o supera el tamaño permitido." };
    payload = JSON.parse(serialized) as unknown;
  } catch {
    return { error: "El ticket no tiene un formato válido." };
  }
  const parsed = parseBankTicketDraft(payload);
  if (parsed.errors.length || !parsed.draft) return { error: parsed.errors[0] ?? "Revisa los datos del ticket." };

  const resolvedLegs = [];
  for (const leg of parsed.draft.legs) {
    const resolved = await resolveBankFootballLeg(leg.competition, leg.homeTeam, leg.awayTeam);
    if (resolved.error) return { error: resolved.error };
    resolvedLegs.push({
      competition: resolved.competition,
      homeTeam: resolved.homeTeam,
      awayTeam: resolved.awayTeam,
      picks: leg.picks.map((pick) => ({
        market: pick.market.trim(),
        selection: pick.selection.trim(),
        ...(parsed.draft!.oddsMode === "per_pick" ? { decimalOdds: pick.decimalOdds } : {}),
      })),
    });
  }

  const { error } = await supabase.rpc("create_bank_ticket", {
    p_bank_id: bank.id,
    p_odds_mode: parsed.draft.oddsMode,
    p_stake: parsed.draft.stake,
    p_total_odds: parsed.draft.oddsMode === "combined" ? parsed.draft.totalOdds : null,
    p_legs: resolvedLegs,
  });
  if (error) return { error: error.message === "rate_limit_exceeded" ? "Alcanzaste el límite de apuestas. Inténtalo más tarde." : "No se pudo registrar el ticket. Comprueba que la migración para combinadas esté aplicada e inténtalo de nuevo." };
  revalidatePath("/home/bank");
  return { success: "Ticket registrado." };
}

export async function createAdjustment(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const amount = getNumber(formData, "amount");
  const kind = getText(formData, "kind");
  const note = getText(formData, "note");
  const errors = validateAdjustmentInput({ amount, kind, note });
  if (errors.length) return { error: errors[0] };
  const { data: bank, error: bankError } = await supabase.from("banks").select("id").eq("user_id", user.id).maybeSingle();
  if (bankError || !bank) return { error: "No se encontró tu Bank." };
  const { error } = await supabase.rpc("create_bank_adjustment", {
    p_bank_id: bank.id,
    p_amount: amount,
    p_kind: kind,
    p_note: note || null,
  });
  if (error) return { error: error.message === "rate_limit_exceeded" ? "Alcanzaste el límite de ajustes. Inténtalo más tarde." : "No se pudo guardar el ajuste." };
  revalidatePath("/home/bank");
  return { success: kind === "deposit" ? "Aporte registrado." : "Retiro registrado." };
}

export async function settleTicketPick(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const pickId = getText(formData, "pickId");
  const result = getText(formData, "result");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pickId)) return { error: "Pronóstico no válido." };
  if (result !== "won" && result !== "lost" && result !== "void") return { error: "Resultado de liquidación no válido." };
  const { data, error } = await supabase.rpc("settle_bank_ticket_pick", { p_pick_id: pickId, p_result: result });
  if (error) return { error: "No se pudo liquidar el pronóstico. Comprueba que la migración para combinadas esté aplicada." };
  if (!data) return { error: "El ticket ya fue liquidado o el pronóstico ya no está pendiente." };
  revalidatePath("/home/bank");
  return { success: "Pronóstico liquidado; se actualizó el estado del ticket." };
}

export async function settleBet(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const betId = getText(formData, "betId");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(betId)) return { error: "Apuesta no válida." };
  const result = getText(formData, "status");
  if (result !== "won" && result !== "lost" && result !== "void") return { error: "Resultado de liquidación no válido." };
  const { data: leg, error: legError } = await supabase.from("bank_bet_legs").select("id").eq("bet_id", betId).eq("user_id", user.id).eq("is_legacy", true).maybeSingle();
  if (legError || !leg) return { error: "Este ticket se liquida desde sus pronósticos individuales." };
  const { data: pick, error: pickError } = await supabase.from("bank_bet_picks").select("id").eq("leg_id", leg.id).eq("user_id", user.id).eq("result", "pending").maybeSingle();
  if (pickError || !pick) return { error: "La apuesta ya fue liquidada o no existe." };
  const { data, error } = await supabase.rpc("settle_bank_ticket_pick", { p_pick_id: pick.id, p_result: result });
  if (error) return { error: "No se pudo liquidar la apuesta." };
  if (!data) return { error: "La apuesta ya fue liquidada o no existe." };
  revalidatePath("/home/bank");
  return { success: "Apuesta liquidada." };
}
