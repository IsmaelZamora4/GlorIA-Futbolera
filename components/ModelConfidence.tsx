type ConfidenceLevel = "solid" | "moderate" | "limited" | "new-team";

type ModelConfidenceProps = {
  homeHistorical: number;
  awayHistorical: number;
  homeCurrent: number;
  awayCurrent: number;
};

function getConfidenceLevel(
  homeHistorical: number,
  awayHistorical: number,
  homeCurrent: number,
  awayCurrent: number,
): ConfidenceLevel {
  if (homeHistorical < 10 || awayHistorical < 10) return "new-team";

  const sample = homeHistorical + awayHistorical + homeCurrent + awayCurrent;

  if (sample >= 60) return "solid";
  if (sample >= 30) return "moderate";
  return "limited";
}

const levelContent: Record<ConfidenceLevel, { label: string; explanation: string; width: string }> = {
  solid: {
    label: "Muestra sólida",
    explanation: "El modelo cuenta con historial suficiente de ambos equipos.",
    width: "84%",
  },
  moderate: {
    label: "Muestra moderada",
    explanation: "La lectura tiene contexto, pero puede cambiar con nuevos partidos.",
    width: "58%",
  },
  limited: {
    label: "Muestra limitada",
    explanation: "Interpreta la predicción con cautela.",
    width: "34%",
  },
  "new-team": {
    label: "Equipo nuevo",
    explanation: "El historial local de uno de los equipos todavía es reducido.",
    width: "18%",
  },
};

export function ModelConfidence({ homeHistorical, awayHistorical, homeCurrent, awayCurrent }: ModelConfidenceProps) {
  const level = getConfidenceLevel(homeHistorical, awayHistorical, homeCurrent, awayCurrent);
  const content = levelContent[level];
  const tooltipId = "model-confidence-tooltip";

  return (
    <section className={`model-confidence model-confidence-${level}`} aria-labelledby="model-confidence-title">
      <div className="model-confidence-heading">
        <div>
          <span className="detail-kicker">Calidad de muestra</span>
          <h2 id="model-confidence-title">{content.label}</h2>
        </div>
        <span className="model-confidence-help">
          <button type="button" aria-label="Qué significa la confianza del modelo" aria-describedby={tooltipId}>i</button>
          <span id={tooltipId} role="tooltip">La confianza describe la calidad y cantidad de la muestra, no garantiza el resultado.</span>
        </span>
      </div>
      <div className="model-confidence-bar" role="img" aria-label={`${content.label}. Indicador de cobertura de la muestra, no porcentaje de probabilidad ni certeza.`}>
        <span style={{ width: content.width }} />
      </div>
      <p>{content.explanation} La barra indica cobertura de datos, no certeza del resultado.</p>
    </section>
  );
}
