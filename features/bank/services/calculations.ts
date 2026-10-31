export type BankCurrency = "PEN" | "USD" | "EUR";
export type BetStatus = "pending" | "won" | "lost" | "void";
export type AdjustmentKind = "deposit" | "withdrawal";

export interface BankRecord { initialCapital: number; currency: BankCurrency; }
export interface BetRecord { stake: number; decimalOdds: number; status: BetStatus; }
export interface AdjustmentRecord { amount: number; kind: AdjustmentKind; }
export interface BankSummary {
  capitalTotal: number;
  pendingAmount: number;
  availableBalance: number;
  netProfit: number;
  yieldPercent: number | null;
  resolvedStake: number;
  totalBets: number;
  wonBets: number;
  lostBets: number;
  voidBets: number;
  winRatePercent: number | null;
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const maxMoney = 9_999_999_999.99;
const maxOdds = 99_999.999;

function hasAtMostDecimalPlaces(value: number, places: number): boolean {
  return Number(value.toFixed(places)) === value;
}

export function validateBankInput(input: { initialCapital: number; currency: string }): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.initialCapital) || input.initialCapital < 0) errors.push("El capital inicial debe ser un número mayor o igual a cero.");
  else if (input.initialCapital > maxMoney) errors.push("El capital inicial supera el máximo permitido.");
  else if (!hasAtMostDecimalPlaces(input.initialCapital, 2)) errors.push("El capital inicial admite como máximo dos decimales.");
  if (!["PEN", "USD", "EUR"].includes(input.currency)) errors.push("La moneda debe ser PEN, USD o EUR.");
  return errors;
}

export function validateBetInput(input: { stake: number; decimalOdds: number }): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.stake) || input.stake <= 0) errors.push("El importe debe ser mayor que cero.");
  else if (input.stake > maxMoney) errors.push("El importe supera el máximo permitido.");
  else if (!hasAtMostDecimalPlaces(input.stake, 2)) errors.push("El importe admite como máximo dos decimales.");
  if (!Number.isFinite(input.decimalOdds) || input.decimalOdds < 1.001) errors.push("La cuota decimal debe ser igual o mayor que 1.001.");
  else if (input.decimalOdds > maxOdds) errors.push("La cuota supera el máximo permitido.");
  else if (!hasAtMostDecimalPlaces(input.decimalOdds, 3)) errors.push("La cuota admite como máximo tres decimales.");
  return errors;
}

export function validateBetDetails(input: { sport: string; event: string; market: string; selection: string }): string[] {
  const fields = [
    [input.sport, "El deporte", 80],
    [input.event, "El evento", 160],
    [input.market, "El mercado", 120],
    [input.selection, "La selección", 160],
  ] as const;
  return fields.flatMap(([value, label, maxLength]) => {
    if (typeof value !== "string" || value.trim().length === 0) return [`${label} es obligatorio.`];
    return value.trim().length > maxLength ? [`${label} supera el máximo de ${maxLength} caracteres.`] : [];
  });
}

export function validateAdjustmentInput(input: { amount: number; kind: string; note: string }): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.amount) || input.amount <= 0) errors.push("El importe del ajuste debe ser mayor que cero.");
  else if (input.amount > maxMoney) errors.push("El importe supera el máximo permitido.");
  else if (!hasAtMostDecimalPlaces(input.amount, 2)) errors.push("El importe admite como máximo dos decimales.");
  if (input.kind !== "deposit" && input.kind !== "withdrawal") errors.push("Selecciona aporte o retiro.");
  if (input.note.trim().length > 240) errors.push("La nota no puede superar 240 caracteres.");
  return errors;
}

export function calculateBetProfit(bet: BetRecord): number {
  if (bet.status === "won") return roundMoney(bet.stake * (bet.decimalOdds - 1));
  if (bet.status === "lost") return roundMoney(-bet.stake);
  return 0;
}

export function calculateBankSummary(bank: BankRecord, bets: BetRecord[], adjustments: AdjustmentRecord[]): BankSummary {
  const pendingAmount = bets.filter((bet) => bet.status === "pending").reduce((sum, bet) => sum + bet.stake, 0);
  const netProfit = bets.reduce((sum, bet) => sum + calculateBetProfit(bet), 0);
  const adjustmentsTotal = adjustments.reduce((sum, adjustment) => sum + (adjustment.kind === "deposit" ? adjustment.amount : -adjustment.amount), 0);
  const resolvedStake = bets.filter((bet) => bet.status === "won" || bet.status === "lost").reduce((sum, bet) => sum + bet.stake, 0);
  const wonBets = bets.filter((bet) => bet.status === "won").length;
  const lostBets = bets.filter((bet) => bet.status === "lost").length;
  const voidBets = bets.filter((bet) => bet.status === "void").length;
  const resolvedBets = wonBets + lostBets;
  return {
    capitalTotal: roundMoney(bank.initialCapital + adjustmentsTotal + netProfit),
    pendingAmount: roundMoney(pendingAmount),
    availableBalance: roundMoney(bank.initialCapital + adjustmentsTotal + netProfit - pendingAmount),
    netProfit: roundMoney(netProfit),
    yieldPercent: resolvedStake > 0 ? roundMoney((netProfit / resolvedStake) * 100) : null,
    resolvedStake: roundMoney(resolvedStake),
    totalBets: bets.length,
    wonBets,
    lostBets,
    voidBets,
    winRatePercent: resolvedBets > 0 ? roundMoney((wonBets / resolvedBets) * 100) : null,
  };
}
