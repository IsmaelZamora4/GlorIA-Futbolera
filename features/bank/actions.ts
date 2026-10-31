"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateAdjustmentInput, validateBankInput, validateBetDetails, validateBetInput, type BankCurrency, type BetStatus } from "@/features/bank/services/calculations";
import { resolveBankFootballEvent } from "@/features/bank/services/football-options";

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
  const resolvedEvent = await resolveBankFootballEvent(
    getText(formData, "competition"),
    getText(formData, "homeTeam"),
    getText(formData, "awayTeam"),
  );
  if (resolvedEvent.error) return { error: resolvedEvent.error };
  const values = {
    bank_id: bank.id,
    user_id: user.id,
    sport: "Fútbol",
    event: resolvedEvent.event!,
    market: getText(formData, "market"),
    selection: getText(formData, "selection"),
    stake: getNumber(formData, "stake"),
    decimal_odds: getNumber(formData, "decimalOdds"),
  };
  const detailErrors = validateBetDetails(values);
  if (detailErrors.length) return { error: detailErrors[0] };
  const numericErrors = validateBetInput({ stake: values.stake, decimalOdds: values.decimal_odds });
  if (numericErrors.length) return { error: numericErrors[0] };
  const { error } = await supabase.from("bets").insert(values);
  if (error) return { error: "No se pudo registrar la apuesta. Comprueba que la migración esté aplicada." };
  revalidatePath("/home/bank");
  return { success: "Apuesta registrada." };
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
  const { error } = await supabase.from("bank_adjustments").insert({ bank_id: bank.id, user_id: user.id, amount, kind, note: note || null });
  if (error) return { error: "No se pudo guardar el ajuste." };
  revalidatePath("/home/bank");
  return { success: kind === "deposit" ? "Aporte registrado." : "Retiro registrado." };
}

export async function settleBet(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const betId = getText(formData, "betId");
  const statusValue = getText(formData, "status");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(betId)) return { error: "Apuesta no válida." };
  if (statusValue !== "won" && statusValue !== "lost" && statusValue !== "void") return { error: "Resultado de liquidación no válido." };
  const status = statusValue as BetStatus;
  const { data, error } = await supabase.from("bets").update({ status, settled_at: new Date().toISOString() }).eq("id", betId).eq("user_id", user.id).eq("status", "pending").select("id").maybeSingle();
  if (error) return { error: "No se pudo liquidar la apuesta." };
  if (!data) return { error: "La apuesta ya fue liquidada o no existe." };
  revalidatePath("/home/bank");
  return { success: "Apuesta liquidada." };
}
