export type BankCurrency = "PEN" | "USD" | "EUR";
export type BetStatus = "pending" | "won" | "lost" | "void";
export type AdjustmentKind = "deposit" | "withdrawal";

export interface BankRecord { initialCapital: number; currency: BankCurrency; }
export interface BetRecord { stake: number; decimalOdds: number; status: BetStatus; }
export interface AdjustmentRecord { amount: number; kind: AdjustmentKind; }
export interface BankSummary { capitalTotal: number; pendingAmount: number; availableBalance: number; netProfit: number; yieldPercent: number | null; resolvedStake: number; }

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function validateBankInput(input: { initialCapital: number; currency: string }): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.initialCapital) || input.initialCapital < 0) errors.push("El capital inicial debe ser un número mayor o igual a cero.");
  if (!["PEN", "USD", "EUR"].includes(input.currency)) errors.push("La moneda debe ser PEN, USD o EUR.");
  return errors;
}

export function validateBetInput(input: { stake: number; decimalOdds: number }): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(input.stake) || input.stake <= 0) errors.push("El importe debe ser mayor que cero.");
  if (!Number.isFinite(input.decimalOdds) || input.decimalOdds < 1.001) errors.push("La cuota decimal debe ser igual o mayor que 1.001.");
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
  return {
    capitalTotal: roundMoney(bank.initialCapital + adjustmentsTotal + netProfit),
    pendingAmount: roundMoney(pendingAmount),
    availableBalance: roundMoney(bank.initialCapital + adjustmentsTotal + netProfit - pendingAmount),
    netProfit: roundMoney(netProfit),
    yieldPercent: resolvedStake > 0 ? roundMoney((netProfit / resolvedStake) * 100) : null,
    resolvedStake: roundMoney(resolvedStake),
  };
}
