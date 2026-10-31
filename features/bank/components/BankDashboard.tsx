"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { BankFootballCompetition } from "@/features/bank/services/football-options";
import { createAdjustment, createBank, createBet, settleBet } from "@/features/bank/actions";
import type { BankSummary } from "@/features/bank/services/calculations";

export type BankBet = {
  id: string;
  event: string;
  market: string;
  selection: string;
  stake: number;
  decimal_odds: number;
  status: string;
  placed_at: string;
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
  const [competitionId, setCompetitionId] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const selectedCompetition = footballOptions.find((item) => item.id === competitionId);
  const availableTeams = selectedCompetition?.teams ?? [];

  const submit = async (key: string, action: BankAction, formData: FormData) => {
    setFeedback((current) => ({ ...current, [key]: {} }));
    setPendingActions((current) => new Set(current).add(key));
    try {
      const result = await action(formData);
      setFeedback((current) => ({ ...current, [key]: result }));
    } catch {
      setFeedback((current) => ({ ...current, [key]: { error: "No se pudo completar la operación. Comprueba tu conexión e inténtalo de nuevo." } }));
    } finally {
      setPendingActions((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
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
            <div className="eyebrow">Nueva apuesta</div>
            <h2>Registrar apuesta</h2>
            <p>Los datos se guardan en tu Bank privado. Las cuotas admiten hasta tres decimales.</p>
            <form action={async (formData) => { await submit("bet", createBet, formData); }} className="bank-form">
              <input type="hidden" name="competition" value={competitionId} />
              <input type="hidden" name="homeTeam" value={homeTeam} />
              <input type="hidden" name="awayTeam" value={awayTeam} />
              <FootballPicker label="Liga o competición" placeholder="Elige una competición" value={selectedCompetition ? { id: selectedCompetition.id, name: selectedCompetition.name, crest: selectedCompetition.logo } : null} options={footballOptions.map((item) => ({ id: item.id, name: item.name, crest: item.logo }))} onChange={(value) => { setCompetitionId(value?.id ?? ""); setHomeTeam(""); setAwayTeam(""); }} />
              <div className="bank-form-grid">
                <FootballPicker label="Local" placeholder={selectedCompetition ? "Elige el equipo local" : "Primero elige una liga"} value={availableTeams.find((team) => team.name === homeTeam) ? { id: homeTeam, ...availableTeams.find((team) => team.name === homeTeam)! } : null} options={availableTeams.filter((team) => team.name !== awayTeam).map((team) => ({ id: team.name, name: team.name, crest: team.crest }))} disabled={!selectedCompetition} onChange={(value) => setHomeTeam(value?.id ?? "")} />
                <FootballPicker label="Visitante" placeholder={selectedCompetition ? "Elige el equipo visitante" : "Primero elige una liga"} value={availableTeams.find((team) => team.name === awayTeam) ? { id: awayTeam, ...availableTeams.find((team) => team.name === awayTeam)! } : null} options={availableTeams.filter((team) => team.name !== homeTeam).map((team) => ({ id: team.name, name: team.name, crest: team.crest }))} disabled={!selectedCompetition} onChange={(value) => setAwayTeam(value?.id ?? "")} />
              </div>
              <label htmlFor="market">Mercado<input id="market" name="market" maxLength={120} required placeholder="Más de 2.5 goles" /></label>
              <label htmlFor="selection">Selección<input id="selection" name="selection" maxLength={160} required placeholder="Sí / Más de 2.5" /></label>
              <div className="bank-form-grid">
                <label htmlFor="stake">Importe
                  <input id="stake" name="stake" type="number" min="0.01" max="9999999999.99" step="0.01" inputMode="decimal" required />
                </label>
                <label htmlFor="decimalOdds">Cuota decimal
                  <input id="decimalOdds" name="decimalOdds" type="number" min="1.001" max="99999.999" step="0.001" inputMode="decimal" required />
                </label>
              </div>
              <button className="auth-submit" type="submit" disabled={pendingActions.has("bet") || !competitionId || !homeTeam || !awayTeam || homeTeam === awayTeam}>{pendingActions.has("bet") ? "Guardando…" : "Guardar apuesta"}</button>
            </form>
            <Feedback state={feedback.bet} />
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
                  return (
                    <li key={bet.id}>
                      <div className="bank-bet-copy">
                        <strong>{bet.event}</strong>
                        <small>{bet.market} · {bet.selection}</small>
                        <small>{formatDate(bet.placed_at)} · Cuota {Number(bet.decimal_odds).toFixed(3)}</small>
                        {bet.status === "pending" && <small>Retorno potencial si gana: {money(Number(bet.stake) * Number(bet.decimal_odds), currency)}</small>}
                      </div>
                      <div className="bank-bet-actions">
                        <b>{money(Number(bet.stake), currency)}</b>
                        <span className={`bank-status bank-status-${bet.status}`}>{statusLabel(bet.status)}</span>
                        {bet.status === "pending" && (
                          <form action={async (formData) => { await submit(key, settleBet, formData); }} className="bank-settle-form">
                            <input type="hidden" name="betId" value={bet.id} />
                            <label className="sr-only" htmlFor={`settle-${bet.id}`}>Resultado de {bet.event}</label>
                            <select id={`settle-${bet.id}`} name="status" defaultValue="won"><option value="won">Ganada</option><option value="lost">Perdida</option><option value="void">Anulada</option></select>
                            <button type="submit" disabled={pendingActions.has(key)}>{pendingActions.has(key) ? "Guardando…" : "Liquidar"}</button>
                          </form>
                        )}
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

type FootballOption = { id: string; name: string; crest: string };

function FootballPicker({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  value: FootballOption | null;
  options: FootballOption[];
  onChange: (option: FootballOption | null) => void;
  disabled?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <div className="bank-football-picker">
      <span className="bank-football-picker-label">{label}</span>
      <details ref={detailsRef} className="bank-football-picker-menu">
        <summary aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault(); }}>
          {value ? <><Image src={value.crest} alt="" width={22} height={22} unoptimized /><span>{value.name}</span></> : <span className="bank-football-picker-placeholder">{placeholder}</span>}
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
        </summary>
        <div className="bank-football-picker-options" role="listbox" aria-label={label}>
          {options.length ? options.map((option) => (
            <button type="button" role="option" aria-selected={value?.id === option.id} key={option.id} onClick={() => { onChange(option); close(); }}>
              <Image src={option.crest} alt="" width={24} height={24} unoptimized />
              <span>{option.name}</span>
            </button>
          )) : <p>No hay equipos disponibles.</p>}
        </div>
      </details>
    </div>
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
