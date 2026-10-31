type FixtureStateProps = {
  state: "loading" | "empty" | "stale" | "error";
  onRetry?: () => void;
  contextLabel?: string;
  hasOtherFixtures?: boolean;
  dateLabel?: string;
};

export function FixtureState({ state, onRetry, contextLabel, hasOtherFixtures = false, dateLabel }: FixtureStateProps) {
  if (state === "loading") {
    return (
      <section className="fixture-state fixture-state-loading" role="status" aria-busy="true" aria-label="Cargando partidos">
        {[0, 1, 2].map((item) => (
          <div className="fixture-skeleton" key={item}>
            <span className="skeleton skeleton-time" />
            <span className="skeleton skeleton-crest" />
            <span className="skeleton skeleton-team" />
            <span className="skeleton skeleton-crest" />
            <span className="skeleton skeleton-team" />
          </div>
        ))}
      </section>
    );
  }

  if (state === "empty") {
    const hasSpecificContext = contextLabel && contextLabel !== "Todas";
    return (
      <section className="fixture-state" role="status">
        <span className="fixture-state-kicker">Agenda local</span>
        <h2>{hasSpecificContext ? `No hay partidos de ${contextLabel} para esta fecha` : dateLabel ? `No hay partidos para el ${dateLabel}` : "Hoy no hay partidos en esta cobertura"}</h2>
        <p>{hasOtherFixtures ? "Sí hay encuentros guardados en otras competiciones; cambia el filtro para verlos." : "Elige otra fecha o revisa el próximo encuentro disponible."}</p>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="fixture-state fixture-state-error" role="alert">
        <span className="fixture-state-kicker">Agenda temporalmente fuera de ritmo</span>
        <h2>No pudimos actualizar la agenda</h2>
        <p>Conservamos los datos guardados para evitar perder tu última consulta.</p>
        {onRetry && <button type="button" onClick={onRetry}>Intentar otra vez</button>}
      </section>
    );
  }

  return (
    <p className="fixture-cache-note" role="status">
      Mostrando datos guardados en caché.
    </p>
  );
}
