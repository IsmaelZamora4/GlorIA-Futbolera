"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateBankInput, validateBetInput, type BankCurrency, type BetStatus } from "@/features/bank/services/calculations";

type ActionResult = { error?: string; success?: string };

export async function createBank(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const currency = String(formData.get("currency") ?? "");
  const initialCapital = Number(formData.get("initialCapital"));
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
  const bankResult = await supabase.from("banks").select("id").eq("user_id", user.id).single();
  if (bankResult.error || !bankResult.data) return { error: "Crea tu Bank antes de registrar una apuesta." };
  const stake = Number(formData.get("stake"));
  const decimalOdds = Number(formData.get("decimalOdds"));
  const errors = validateBetInput({ stake, decimalOdds });
  if (errors.length) return { error: errors[0] };
  const values = { bank_id: bankResult.data.id, user_id: user.id, sport: String(formData.get("sport") ?? "Fútbol"), event: String(formData.get("event") ?? ""), market: String(formData.get("market") ?? ""), selection: String(formData.get("selection") ?? ""), stake, decimal_odds: decimalOdds };
  if ([values.event, values.market, values.selection].some((value) => !value.trim())) return { error: "Completa evento, mercado y selección." };
  const { error } = await supabase.from("bets").insert(values);
  if (error) return { error: "No se pudo registrar la apuesta. Comprueba que la migración esté aplicada." };
  revalidatePath("/home/bank");
  return { success: "Apuesta registrada." };
}

export async function createAdjustment(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión ha caducado. Vuelve a iniciar sesión." };
  const amount = Number(formData.get("amount"));
  const kind = String(formData.get("kind") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isFinite(amount) || amount <= 0) return { error: "El importe del ajuste debe ser mayor que cero." };
  if (kind !== "deposit" && kind !== "withdrawal") return { error: "Selecciona aporte o retiro." };
  if (note.length > 240) return { error: "La nota no puede superar 240 caracteres." };
  const { data: bank, error: bankError } = await supabase.from("banks").select("id").eq("user_id", user.id).single();
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
  const betId = String(formData.get("betId") ?? "");
  const status = String(formData.get("status") ?? "") as BetStatus;
  if (!/^[0-9a-f-]{36}$/i.test(betId)) return { error: "Apuesta no válida." };
  if (status !== "won" && status !== "lost" && status !== "void") return { error: "Resultado de liquidación no válido." };
  const { data, error } = await supabase.from("bets").update({ status, settled_at: new Date().toISOString() }).eq("id", betId).eq("user_id", user.id).eq("status", "pending").select("id").maybeSingle();
  if (error) return { error: "No se pudo liquidar la apuesta." };
  if (!data) return { error: "La apuesta ya fue liquidada o no existe." };
  revalidatePath("/home/bank");
  return { success: "Apuesta liquidada." };
}
