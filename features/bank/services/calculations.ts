export type BankCurrency = "PEN" | "USD" | "EUR";
export type BetStatus = "pending" | "won" | "lost" | "void";
export type AdjustmentKind = "deposit" | "withdrawal";

export interface BankRecord { initialCapital: number; currency: BankCurrency; }
export interface BetRecord { stake: number; decimalOdds: number; status: BetStatus; }

export type BankTicketOddsMode = "combined" | "per_pick";
export type BankTicketPickResult = "pending" | "won" | "lost" | "void";

export function deriveBankTicketStatus(oddsMode: BankTicketOddsMode, results: BankTicketPickResult[]): BetStatus {
  if (results.includes("lost")) return "lost";
  if (results.includes("pending")) return "pending";
  if (oddsMode === "combined" && results.includes("void")) return "void";
  return results.includes("won") ? "won" : "void";
}

export function getEffectiveBankTicketOdds(odds: number[], results: BankTicketPickResult[], oddsMode: BankTicketOddsMode) {
  if (oddsMode === "combined") return null;
  const effectiveOdds = odds.reduce((product, value, index) => results[index] === "void" ? product : product * value, 1);
  return results.some((result) => result !== "void")
    ? Math.round(effectiveOdds * 1000) / 1000
    : null;
}
export type BankTicketDraft = {
  oddsMode: BankTicketOddsMode;
  stake: number;
  totalOdds: number;
  legs: Array<{
    competition: string;
    homeTeam: string;
    awayTeam: string;
    picks: Array<{ market: string; selection: string; decimalOdds: number | null }>;
  }>;
};

export type RawBankTicketDraft = {
  oddsMode?: unknown;
  stake?: unknown;
  totalOdds?: unknown;
  legs?: unknown;
};
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

export function parseBankTicketDraft(value: unknown): { draft: BankTicketDraft | null; errors: string[] } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { draft: null, errors: ["El ticket no tiene un formato válido."] };
  const raw = value as RawBankTicketDraft;
  const oddsMode = raw.oddsMode;
  if (oddsMode !== "combined" && oddsMode !== "per_pick") return { draft: null, errors: ["Selecciona cómo registrar las cuotas."] };
  const stake = typeof raw.stake === "number" ? raw.stake : Number.NaN;
  const totalOdds = typeof raw.totalOdds === "number" ? raw.totalOdds : Number.NaN;
  if (!Array.isArray(raw.legs) || raw.legs.length < 1 || raw.legs.length > 20) return { draft: null, errors: ["El ticket debe tener entre 1 y 20 partidos."] };

  const legs: BankTicketDraft["legs"] = [];
  let totalPicks = 0;
  for (const rawLeg of raw.legs) {
    if (!rawLeg || typeof rawLeg !== "object" || Array.isArray(rawLeg)) return { draft: null, errors: ["Hay un partido con datos no válidos."] };
    const leg = rawLeg as Record<string, unknown>;
    if (typeof leg.competition !== "string" || typeof leg.homeTeam !== "string" || typeof leg.awayTeam !== "string" || !Array.isArray(leg.picks) || leg.picks.length < 1 || leg.picks.length > 20) {
      return { draft: null, errors: ["Cada partido debe tener competición, equipos y al menos un pronóstico."] };
    }
    const picks: BankTicketDraft["legs"][number]["picks"] = [];
    for (const rawPick of leg.picks) {
      if (!rawPick || typeof rawPick !== "object" || Array.isArray(rawPick)) return { draft: null, errors: ["Hay un pronóstico con datos no válidos."] };
      const pick = rawPick as Record<string, unknown>;
      if (typeof pick.market !== "string" || typeof pick.selection !== "string") return { draft: null, errors: ["Completa el mercado y el pronóstico de cada selección."] };
      const rawOdds = pick.decimalOdds;
      const decimalOdds = rawOdds === null || rawOdds === "" ? null : typeof rawOdds === "number" ? rawOdds : typeof rawOdds === "string" ? Number(rawOdds) : Number.NaN;
      if (decimalOdds !== null && !Number.isFinite(decimalOdds)) return { draft: null, errors: ["Una de las cuotas por pronóstico no es válida."] };
      picks.push({ market: pick.market, selection: pick.selection, decimalOdds });
    }
    totalPicks += picks.length;
    legs.push({ competition: leg.competition, homeTeam: leg.homeTeam, awayTeam: leg.awayTeam, picks });
  }
  if (totalPicks > 100) return { draft: null, errors: ["El ticket no puede superar 100 pronósticos."] };
  const draft: BankTicketDraft = { oddsMode, stake, totalOdds, legs };
  const detailErrors = legs.flatMap((leg) => [
    ...validateBetDetails({ sport: "Fútbol", event: `${leg.competition} · ${leg.homeTeam} vs ${leg.awayTeam}`, market: "Combinada", selection: "Ticket" }),
    ...leg.picks.flatMap((pick) => validateBetDetails({ sport: "Fútbol", event: "Partido", market: pick.market, selection: pick.selection })),
  ]);
  if (detailErrors.length) return { draft: null, errors: detailErrors };
  const stakeErrors = validateBetInput({ stake, decimalOdds: oddsMode === "combined" ? totalOdds : 1.001 });
  if (stakeErrors.length) return { draft: null, errors: stakeErrors };
  if (oddsMode === "combined") {
    if (legs.some((leg) => leg.picks.some((pick) => pick.decimalOdds !== null))) return { draft: null, errors: ["En modo cuota total, deja vacías las cuotas individuales."] };
  } else {
    if (Number.isFinite(totalOdds)) return { draft: null, errors: ["En modo cuota por pronóstico, no envíes una cuota total manual."] };
    if (legs.some((leg) => leg.picks.some((pick) => pick.decimalOdds === null))) return { draft: null, errors: ["Introduce la cuota decimal de cada pronóstico."] };
    const odds = legs.flatMap((leg) => leg.picks.map((pick) => pick.decimalOdds!));
    const oddsErrors = odds.flatMap((decimalOdds) => validateBetInput({ stake: 1, decimalOdds }));
    if (oddsErrors.length) return { draft: null, errors: oddsErrors };
    const combinedOdds = Math.round(odds.reduce((product, decimalOdds) => product * decimalOdds, 1) * 1000) / 1000;
    if (!Number.isFinite(combinedOdds) || combinedOdds < 1.001 || combinedOdds > 99999.999) return { draft: null, errors: ["La cuota combinada calculada supera el rango permitido."] };
  }
  return { draft, errors: [] };
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
