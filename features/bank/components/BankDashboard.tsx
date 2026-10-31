"use client";

import Link from "next/link";
import { useState } from "react";
import type { BankFootballCompetition } from "@/features/bank/services/football-options";
import { createAdjustment, createBank, createBet, settleBet, settleTicketPick } from "@/features/bank/actions";
import { BankTicketForm } from "@/features/bank/components/BankTicketForm";
import type { BankSummary } from "@/features/bank/services/calculations";

export type BankBetPick = {
  id: string;
  market: string;
  selection: string;
  decimal_odds: number | null;
  result: string;
  position: number;
};

export type BankBetLeg = {
  id: string;
  competition: string | null;
  home_team: string | null;
  away_team: string | null;
  legacy_event: string | null;
  is_legacy: boolean;
  position: number;
  picks: BankBetPick[];
};

export type BankBet = {
  id: string;
  event: string;
  market: string;
  selection: string;
  stake: number;
  decimal_odds: number;
  odds_mode: "combined" | "per_pick";
  status: string;
  placed_at: string;
  legs: BankBetLeg[];
};

export type BankAdjustment = {
  id: string;
  amount: number;
  kind: string;
  note: string | null;
  occurred_at: string;
};

type Bank = { currency: string; initial_capital: number };
type ActionResult = { error?: string; success?: string };
type BankAction = (formData: FormData) => Promise<ActionResult>;
type PageKey = "betsPage" | "adjustmentsPage";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha no disponible" : new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(date);
}

export function BankDashboard({
  bank,
  bets,
  adjustments,
  summary,
  footballOptions = [],
  loadError,
  betsPage = 1,
  betsPages = 1,
  betsTotal = 0,
  adjustmentsPage = 1,
  adjustmentsPages = 1,
  adjustmentsTotal = 0,
}: {
  bank: Bank | null;
  bets: BankBet[];
  adjustments: BankAdjustment[];
  summary: BankSummary | null;
  footballOptions?: BankFootballCompetition[];
  loadError?: string;
  betsPage?: number;
  betsPages?: number;
  betsTotal?: number;
  adjustmentsPage?: number;
  adjustmentsPages?: number;
  adjustmentsTotal?: number;
}) {
  const [feedback, setFeedback] = useState<Record<string, ActionResult>>({});
  const [pendingActions, setPendingActions] = useState<Set<string>>(() => new Set());

  const submit = async (key: string, action: BankAction, formData: FormData): Promise<ActionResult> => {
    setFeedback((current) => ({ ...current, [key]: {} }));
    setPendingActions((current) => new Set(current).add(key));
    let result: ActionResult;
    try {
      result = await action(formData);
    } catch {
      result = { error: "No se pudo completar la operación. Comprueba tu conexión e inténtalo de nuevo." };
    } finally {
      setPendingActions((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
    setFeedback((current) => ({ ...current, [key]: result }));
    return result;
  };

  if (loadError) {
    return (
      <section className="bank-panel bank-load-error" role="alert">
        <div className="eyebrow">Datos no disponibles</div>
        <h2>No mostramos un saldo incompleto</h2>
        <p>{loadError}</p>
        <Link className="bank-retry-link" href="/home/bank">Volver a intentar</Link>
      </section>
    );
  }

  if (!bank) {
    return (
      <section className="bank-panel bank-setup-panel">
        <div className="eyebrow">Primer paso</div>
        <h2>Configura tu Bank</h2>
        <p>Elige una moneda y registra el capital con el que empiezas. La moneda quedará fija para este Bank.</p>
        <form action={async (formData) => { await submit("bank", createBank, formData); }} className="bank-form">
          <label htmlFor="initialCapital">Capital inicial
            <input id="initialCapital" name="initialCapital" type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" required />
          </label>
          <label htmlFor="currency">Moneda
            <select id="currency" name="currency" defaultValue="PEN">
              <option value="PEN">Soles (PEN)</option>
              <option value="USD">Dólares (USD)</option>
              <option value="EUR">Euros (EUR)</option>
            </select>
          </label>
          <button className="auth-submit" type="submit" disabled={pendingActions.has("bank")}>{pendingActions.has("bank") ? "Guardando…" : "Crear Bank"}</button>
        </form>
        <Feedback state={feedback.bank} />
      </section>
    );
  }

  if (!summary) {
    return <section className="bank-panel bank-load-error" role="alert"><h2>No se pudo calcular tu Bank</h2><p>Actualiza los datos e inténtalo de nuevo.</p><Link className="bank-retry-link" href="/home/bank">Volver a intentar</Link></section>;
  }

  const currency = bank.currency;

  return (
    <>
      <section className="bank-metrics" aria-label="Resumen del Bank">
        <Metric label="Capital total" value={money(summary.capitalTotal, currency)} hint="Capital inicial, movimientos y resultados liquidados." />
        <Metric label="Disponible" value={money(summary.availableBalance, currency)} hint="Saldo después de reservar las apuestas pendientes." tone={summary.availableBalance < 0 ? "negative" : undefined} />
        <Metric label="En juego" value={money(summary.pendingAmount, currency)} hint="Importe comprometido en apuestas pendientes." />
        <Metric label="Beneficio neto" value={money(summary.netProfit, currency)} hint="Resultado de apuestas ganadas y perdidas." tone={summary.netProfit < 0 ? "negative" : "positive"} />
        <Metric label="Yield" value={summary.yieldPercent == null ? "Sin datos" : `${summary.yieldPercent.toFixed(2)}%`} hint="Beneficio neto sobre el importe resuelto." />
        <Metric label="Acierto" value={summary.winRatePercent == null ? "Sin datos" : `${summary.winRatePercent.toFixed(2)}%`} hint={`${summary.wonBets} ganadas de ${summary.wonBets + summary.lostBets} resueltas.`} />
      </section>
      <p className="bank-summary-note">Las apuestas anuladas no cuentan como ganancia ni pérdida. El Bank es un registro personal y no se sincroniza con casas de apuestas.</p>

      <div className="bank-layout">
        <div className="bank-entry-column">
          <section className="bank-panel">
            <div className="eyebrow">Nuevo ticket</div>
            <h2>Registrar apuesta o combinada</h2>
            <p>Añade varios pronósticos y partidos; el importe se aplica una sola vez al ticket.</p>
            <BankTicketForm
              competitions={footballOptions}
              pending={pendingActions.has("bet")}
              feedback={feedback.bet}
              onSave={(formData) => submit("bet", createBet, formData)}
            />
          </section>

          <section className="bank-panel">
            <div className="eyebrow">Movimientos de capital</div>
            <h2>Aporte o retiro</h2>
            <p>Registra movimientos externos para mantener actualizado el saldo disponible.</p>
            <form action={async (formData) => { await submit("adjustment", createAdjustment, formData); }} className="bank-form">
              <div className="bank-form-grid">
                <label htmlFor="kind">Tipo de movimiento
                  <select id="kind" name="kind" defaultValue="deposit"><option value="deposit">Aporte</option><option value="withdrawal">Retiro</option></select>
                </label>
                <label htmlFor="amount">Importe
                  <input id="amount" name="amount" type="number" min="0.01" max="9999999999.99" step="0.01" inputMode="decimal" required />
                </label>
              </div>
              <label htmlFor="note">Nota opcional<input id="note" name="note" maxLength={240} placeholder="Descripción del movimiento" /></label>
              <button className="auth-submit" type="submit" disabled={pendingActions.has("adjustment")}>{pendingActions.has("adjustment") ? "Guardando…" : "Guardar movimiento"}</button>
            </form>
            <Feedback state={feedback.adjustment} />
          </section>
        </div>

        <div className="bank-history-column">
          <section className="bank-panel">
            <div className="bank-history-heading">
              <div><div className="eyebrow">Historial</div><h2>Apuestas</h2></div>
              <span className="bank-history-count">{summary.totalBets} registradas</span>
            </div>
            <div className="bank-outcome-summary" aria-label="Resultados de apuestas">
              <span><b>{summary.wonBets}</b> ganadas</span><span><b>{summary.lostBets}</b> perdidas</span><span><b>{summary.voidBets}</b> anuladas</span>
            </div>
            {bets.length === 0 ? <p className="bank-empty">Todavía no tienes apuestas registradas.</p> : (
              <ul className="bank-bets">
                {bets.map((bet) => {
                  const key = `settle-${bet.id}`;
                  const legacyPick = bet.legs.flatMap((leg) => leg.picks.map((pick) => ({ leg, pick }))).find(({ leg }) => leg.is_legacy);
                  return (
                    <li key={bet.id}>
                      <div className="bank-bet-copy">
                        <strong>{legacyPick?.leg.legacy_event ?? bet.event}</strong>
                        {legacyPick ? <small>{legacyPick.pick.market} · {legacyPick.pick.selection}</small> : bet.legs.map((leg) => <div className="bank-ticket-history-leg" key={leg.id}>
                          <strong>{leg.competition} · {leg.home_team} vs {leg.away_team}</strong>
                          {leg.picks.map((pick) => <div className="bank-ticket-history-pick" key={pick.id}>
                            <span>{pick.market}: {pick.selection}{pick.decimal_odds != null ? ` · ${Number(pick.decimal_odds).toFixed(3)}` : ""}</span>
                            <span className={`bank-status bank-status-${pick.result === "pending" && bet.status !== "pending" ? "void" : pick.result}`}>{pick.result === "pending" && bet.status !== "pending" ? "No necesario" : statusLabel(pick.result)}</span>
                            {bet.status === "pending" && pick.result === "pending" && <form action={async (formData) => { await submit(`pick-${pick.id}`, settleTicketPick, formData); }} className="bank-settle-form">
                              <input type="hidden" name="pickId" value={pick.id} />
                              <label className="sr-only" htmlFor={`pick-result-${pick.id}`}>Resultado de {pick.market}: {pick.selection}</label>
                              <select id={`pick-result-${pick.id}`} name="result" defaultValue="won"><option value="won">Ganado</option><option value="lost">Perdido</option><option value="void">Anulado</option></select>
                              <button type="submit" disabled={pendingActions.has(`pick-${pick.id}`)}>{pendingActions.has(`pick-${pick.id}`) ? "Guardando…" : "Liquidar"}</button>
                            </form>}
                            <Feedback state={feedback[`pick-${pick.id}`]} />
                          </div>)}
                        </div>)}
                        <small>{formatDate(bet.placed_at)} · Cuota combinada {Number(bet.decimal_odds).toFixed(3)}{bet.odds_mode === "per_pick" ? " · calculada por pronóstico" : ""}</small>
                        {bet.status === "pending" && <small>Retorno potencial si gana: {money(Number(bet.stake) * Number(bet.decimal_odds), currency)}</small>}
                      </div>
                      <div className="bank-bet-actions">
                        <b>{money(Number(bet.stake), currency)}</b>
                        <span className={`bank-status bank-status-${bet.status}`}>{statusLabel(bet.status)}</span>
                        {legacyPick && bet.status === "pending" && <form action={async (formData) => { await submit(key, settleBet, formData); }} className="bank-settle-form">
                          <input type="hidden" name="betId" value={bet.id} />
                          <label className="sr-only" htmlFor={`settle-${bet.id}`}>Resultado de {bet.event}</label>
                          <select id={`settle-${bet.id}`} name="status" defaultValue="won"><option value="won">Ganada</option><option value="lost">Perdida</option><option value="void">Anulada</option></select>
                          <button type="submit" disabled={pendingActions.has(key)}>{pendingActions.has(key) ? "Guardando…" : "Liquidar"}</button>
                        </form>}
                        <Feedback state={feedback[key]} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <Pagination label="Apuestas" page={betsPage} pages={betsPages} total={betsTotal} pageKey="betsPage" betsPage={betsPage} adjustmentsPage={adjustmentsPage} />
          </section>

          <section className="bank-panel">
            <div className="bank-history-heading">
              <div><div className="eyebrow">Capital</div><h2>Historial de movimientos</h2></div>
              <span className="bank-history-count">{adjustmentsTotal} movimientos</span>
            </div>
            {adjustments.length === 0 ? <p className="bank-empty">Todavía no tienes aportes o retiros.</p> : (
              <ul className="bank-bets bank-adjustments">
                {adjustments.map((adjustment) => (
                  <li key={adjustment.id}>
                    <div className="bank-bet-copy">
                      <strong>{adjustment.kind === "deposit" ? "Aporte" : "Retiro"}</strong>
                      <small>{adjustment.note || formatDate(adjustment.occurred_at)}</small>
                      {adjustment.note && <small>{formatDate(adjustment.occurred_at)}</small>}
                    </div>
                    <b className={adjustment.kind === "deposit" ? "bank-positive" : "bank-negative"}>{adjustment.kind === "deposit" ? "+" : "−"}{money(Number(adjustment.amount), currency)}</b>
                  </li>
                ))}
              </ul>
            )}
            <Pagination label="Movimientos" page={adjustmentsPage} pages={adjustmentsPages} total={adjustmentsTotal} pageKey="adjustmentsPage" betsPage={betsPage} adjustmentsPage={adjustmentsPage} />
          </section>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "positive" | "negative" }) {
  return <div className={tone ? `bank-metric-${tone}` : undefined}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>;
}

function Feedback({ state }: { state?: ActionResult }) {
  if (state?.error) return <p className="auth-error bank-feedback" role="alert">{state.error}</p>;
  if (state?.success) return <p className="auth-message bank-feedback" role="status">{state.success}</p>;
  return null;
}

function Pagination({ label, page, pages, total, pageKey, betsPage, adjustmentsPage }: {
  label: string;
  page: number;
  pages: number;
  total: number;
  pageKey: PageKey;
  betsPage: number;
  adjustmentsPage: number;
}) {
  if (total <= 25) return null;
  const start = (page - 1) * 25 + 1;
  const end = Math.min(page * 25, total);
  const previous = page > 1 ? pageHref(pageKey, page - 1, betsPage, adjustmentsPage) : null;
  const next = page < pages ? pageHref(pageKey, page + 1, betsPage, adjustmentsPage) : null;
  return (
    <nav className="bank-pagination" aria-label={`Paginación de ${label}`}>
      <span>{start}–{end} de {total}</span>
      <div>
        {previous ? <Link href={previous} aria-label={`${label}: página anterior`}>Anterior</Link> : <span aria-disabled="true">Anterior</span>}
        {next ? <Link href={next} aria-label={`${label}: página siguiente`}>Siguiente</Link> : <span aria-disabled="true">Siguiente</span>}
      </div>
    </nav>
  );
}

function pageHref(pageKey: PageKey, page: number, betsPage: number, adjustmentsPage: number) {
  const params = new URLSearchParams();
  const nextBetsPage = pageKey === "betsPage" ? page : betsPage;
  const nextAdjustmentsPage = pageKey === "adjustmentsPage" ? page : adjustmentsPage;
  if (nextBetsPage > 1) params.set("betsPage", String(nextBetsPage));
  if (nextAdjustmentsPage > 1) params.set("adjustmentsPage", String(nextAdjustmentsPage));
  return `/home/bank${params.size ? `?${params.toString()}` : ""}`;
}

function statusLabel(status: string) {
  return ({ pending: "Pendiente", won: "Ganada", lost: "Perdida", void: "Anulada" } as Record<string, string>)[status] ?? "Estado desconocido";
}
