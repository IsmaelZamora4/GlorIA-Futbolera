"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { validateBankInput, validateBetInput, type BankCurrency } from "../../lib/bank/calculations";

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
  revalidatePath("/bank");
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
  revalidatePath("/bank");
  return { success: "Apuesta registrada." };
}
