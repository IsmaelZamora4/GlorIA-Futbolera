"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import type { BankTicketOddsMode } from "@/features/bank/services/calculations";
import type { BankFootballCompetition } from "@/features/bank/services/football-options";

type Option = { id: string; name: string; crest: string };
type PickDraft = { key: number; market: string; selection: string; decimalOdds: string };
type LegDraft = { key: number; competitionId: string; homeTeam: string; awayTeam: string; picks: PickDraft[] };
type ActionResult = { error?: string; success?: string };

const createPick = (key: number): PickDraft => ({ key, market: "", selection: "", decimalOdds: "" });
const createLeg = (key: number): LegDraft => ({ key, competitionId: "", homeTeam: "", awayTeam: "", picks: [createPick(key * 100)] });

export function BankTicketForm({
  competitions,
  pending,
  feedback,
  onSave,
}: {
  competitions: BankFootballCompetition[];
  pending: boolean;
  feedback?: ActionResult;
  onSave: (formData: FormData) => Promise<ActionResult>;
}) {
  const nextKey = useRef(1);
  const [legs, setLegs] = useState<LegDraft[]>([createLeg(0)]);
  const [oddsMode, setOddsMode] = useState<BankTicketOddsMode>("per_pick");
  const [totalOdds, setTotalOdds] = useState("");
  const [stake, setStake] = useState("");
  const allPicks = legs.flatMap((leg) => leg.picks);
  const totalPickCount = allPicks.length;
  const pickOdds = allPicks.map((pick) => Number(pick.decimalOdds));
  const canCalculateOdds = pickOdds.length > 0 && pickOdds.every((odds) => Number.isFinite(odds) && odds >= 1.001 && odds <= 99999.999);
  const calculatedOdds = oddsMode === "per_pick" && canCalculateOdds
    ? Math.round(pickOdds.reduce((product, odds) => product * odds, 1) * 1000) / 1000
    : oddsMode === "combined" ? Number(totalOdds) : Number.NaN;
  const ticket = {
    oddsMode,
    stake: Number(stake),
    totalOdds: oddsMode === "combined" ? Number(totalOdds) : null,
    legs: legs.map((leg) => ({
      competition: leg.competitionId,
      homeTeam: leg.homeTeam,
      awayTeam: leg.awayTeam,
      picks: leg.picks.map((pick) => ({
        market: pick.market,
        selection: pick.selection,
        decimalOdds: oddsMode === "per_pick" ? Number(pick.decimalOdds) : null,
      })),
    })),
  };

  function updateLeg(key: number, update: (leg: LegDraft) => LegDraft) {
    setLegs((current) => current.map((leg) => leg.key === key ? update(leg) : leg));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = await onSave(formData);
    if (result.success) {
      setLegs([createLeg(nextKey.current++)]);
      setStake("");
      setTotalOdds("");
      setOddsMode("per_pick");
    }
  }

  return (
    <form className="bank-form bank-ticket-form" onSubmit={submit}>
      <input type="hidden" name="ticket" value={JSON.stringify(ticket)} />
      <div className="bank-ticket-legs">
        {legs.map((leg, legIndex) => {
          const selectedCompetition = competitions.find((item) => item.id === leg.competitionId);
          const teams = selectedCompetition?.teams ?? [];
          const compOptions = competitions.map((item) => ({ id: item.id, name: item.name, crest: item.logo }));
          const homeOptions = teams.filter((team) => team.name !== leg.awayTeam).map((team) => ({ id: team.name, name: team.name, crest: team.crest }));
          const awayOptions = teams.filter((team) => team.name !== leg.homeTeam).map((team) => ({ id: team.name, name: team.name, crest: team.crest }));
          return (
            <section className="bank-ticket-leg" key={leg.key} aria-label={`Partido ${legIndex + 1}`}>
              <div className="bank-ticket-leg-header"><strong>Partido {legIndex + 1}</strong>{legs.length > 1 && <button type="button" onClick={() => setLegs((current) => current.filter((item) => item.key !== leg.key))}>Quitar partido</button>}</div>
              <TicketPicker label="Liga" placeholder="Elige una liga" value={compOptions.find((option) => option.id === leg.competitionId) ?? null} options={compOptions} onChange={(option) => updateLeg(leg.key, (current) => ({ ...current, competitionId: option?.id ?? "", homeTeam: "", awayTeam: "" }))} />
              <div className="bank-form-grid">
                <TicketPicker label="Local" placeholder={selectedCompetition ? "Elige equipo local" : "Primero elige una liga"} value={homeOptions.find((option) => option.id === leg.homeTeam) ?? null} options={homeOptions} disabled={!selectedCompetition} onChange={(option) => updateLeg(leg.key, (current) => ({ ...current, homeTeam: option?.id ?? "" }))} />
                <TicketPicker label="Visitante" placeholder={selectedCompetition ? "Elige equipo visitante" : "Primero elige una liga"} value={awayOptions.find((option) => option.id === leg.awayTeam) ?? null} options={awayOptions} disabled={!selectedCompetition} onChange={(option) => updateLeg(leg.key, (current) => ({ ...current, awayTeam: option?.id ?? "" }))} />
              </div>
              <div className="bank-ticket-picks">
                <div className="bank-ticket-picks-header"><strong>Pronósticos</strong><span>{leg.picks.length}</span></div>
                {leg.picks.map((pick, pickIndex) => (
                  <div className="bank-ticket-pick" key={pick.key}>
                    <div className="bank-ticket-pick-header"><span>Pronóstico {pickIndex + 1}</span>{leg.picks.length > 1 && <button type="button" onClick={() => updateLeg(leg.key, (current) => ({ ...current, picks: current.picks.filter((item) => item.key !== pick.key) }))}>Quitar</button>}</div>
                    <div className={`bank-ticket-pick-grid ${oddsMode === "per_pick" ? "has-odds" : ""}`}>
                      <label>Mercado<input maxLength={120} required value={pick.market} onChange={(event) => updateLeg(leg.key, (current) => ({ ...current, picks: current.picks.map((item) => item.key === pick.key ? { ...item, market: event.target.value } : item) }))} placeholder="Más de 1.5 goles" /></label>
                      <label>Selección<input maxLength={160} required value={pick.selection} onChange={(event) => updateLeg(leg.key, (current) => ({ ...current, picks: current.picks.map((item) => item.key === pick.key ? { ...item, selection: event.target.value } : item) }))} placeholder="Más de 1.5" /></label>
                      {oddsMode === "per_pick" && <label>Cuota<input type="number" min="1.001" max="99999.999" step="0.001" inputMode="decimal" required value={pick.decimalOdds} onChange={(event) => updateLeg(leg.key, (current) => ({ ...current, picks: current.picks.map((item) => item.key === pick.key ? { ...item, decimalOdds: event.target.value } : item) }))} placeholder="1.85" /></label>}
                    </div>
                  </div>
                ))}
                <button className="bank-ticket-add-pick" type="button" disabled={totalPickCount >= 100 || leg.picks.length >= 20} onClick={() => updateLeg(leg.key, (current) => ({ ...current, picks: [...current.picks, createPick(nextKey.current++)] }))}>+ Añadir pronóstico a este partido</button>
              </div>
            </section>
          );
        })}
      </div>
      <button className="bank-ticket-add-leg" type="button" disabled={legs.length >= 20 || totalPickCount >= 100} onClick={() => setLegs((current) => [...current, createLeg(nextKey.current++)])}>+ Añadir otro partido al ticket</button>
      <fieldset className="bank-ticket-odds-mode">
        <legend>Cómo registrar las cuotas</legend>
        <label><input type="radio" name="oddsModeChoice" checked={oddsMode === "per_pick"} onChange={() => setOddsMode("per_pick")} /> Cuota de cada pronóstico</label>
        <label><input type="radio" name="oddsModeChoice" checked={oddsMode === "combined"} onChange={() => setOddsMode("combined")} /> Cuota total de la combinada</label>
      </fieldset>
      {oddsMode === "combined" ? (
        <label>Cuota total<input type="number" min="1.001" max="99999.999" step="0.001" inputMode="decimal" required value={totalOdds} onChange={(event) => setTotalOdds(event.target.value)} placeholder="8.50" /></label>
      ) : <p className="bank-ticket-calculated-odds">Cuota combinada estimada: <strong>{Number.isFinite(calculatedOdds) ? calculatedOdds.toFixed(3) : "—"}</strong><small>Se redondea a tres decimales.</small></p>}
      <label>Importe del ticket<input type="number" min="0.01" max="9999999999.99" step="0.01" inputMode="decimal" required value={stake} onChange={(event) => setStake(event.target.value)} placeholder="0.00" /></label>
      {feedback?.error && <p className="auth-error bank-feedback" role="alert">{feedback.error}</p>}
      {feedback?.success && <p className="auth-message bank-feedback" role="status">{feedback.success}</p>}
      <button className="auth-submit" type="submit" disabled={pending || legs.some((leg) => !leg.competitionId || !leg.homeTeam || !leg.awayTeam) || (oddsMode === "combined" ? !totalOdds : legs.some((leg) => leg.picks.some((pick) => !pick.decimalOdds)))}>{pending ? "Guardando ticket…" : "Guardar ticket"}</button>
    </form>
  );
}

function TicketPicker({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  placeholder: string;
  value: Option | null;
  options: Option[];
  onChange: (option: Option | null) => void;
  disabled?: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => { if (detailsRef.current) detailsRef.current.open = false; };
  return (
    <div className="bank-football-picker">
      <span className="bank-football-picker-label">{label}</span>
      <details ref={detailsRef} className="bank-football-picker-menu">
        <summary aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault(); }}>
          {value ? <><Image src={value.crest} alt="" width={22} height={22} unoptimized /><span>{value.name}</span></> : <span className="bank-football-picker-placeholder">{placeholder}</span>}
          <svg aria-hidden="true" viewBox="0 0 16 16" fill="none"><path d="m4 6 4 4 4-4" /></svg>
        </summary>
        <div className="bank-football-picker-options" role="listbox" aria-label={label}>
          {options.length ? options.map((option) => <button type="button" role="option" aria-selected={value?.id === option.id} key={option.id} onClick={() => { onChange(option); close(); }}><Image src={option.crest} alt="" width={24} height={24} unoptimized /><span>{option.name}</span></button>) : <p>No hay opciones disponibles.</p>}
        </div>
      </details>
    </div>
  );
}
