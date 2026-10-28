type ProbabilityBarProps = { home: number; draw: number; away: number; homeTeam: string; awayTeam: string };

export function ProbabilityBar({ home, draw, away, homeTeam, awayTeam }: ProbabilityBarProps) {
  return <div className="detail-probability-bar" role="img" aria-label={`Probabilidades: ${homeTeam} ${home}%, empate ${draw}%, ${awayTeam} ${away}%`}>
    <span className="home" style={{ width: `${home}%` }}><b>{home}%</b></span><span className="draw" style={{ width: `${draw}%` }}><b>{draw}%</b></span><span className="away" style={{ width: `${away}%` }}><b>{away}%</b></span>
  </div>;
}

type InsightCardProps = { label: string; value: string; probability: number; probabilityLabel: string; reference: string; confidence: string };

export function InsightCard({ label, value, probability, probabilityLabel, reference, confidence }: InsightCardProps) {
  return <article className="detail-key-metric"><header><span>{label}</span><small>{confidence}</small></header><strong>{value}</strong><div className="detail-key-metric-probability"><span>{probabilityLabel}</span><b>{probability}%</b></div><div className="detail-key-metric-bar" role="img" aria-label={`Probabilidad estimada: ${probability}%`}><i style={{ width: `${probability}%` }} /></div><footer>{reference}</footer></article>;
}

type MetricComparisonProps = { label: string; home: string | number; away: string | number; homeValue: number | null; awayValue: number | null };

export function MetricComparison({ label, home, away, homeValue, awayValue }: MetricComparisonProps) {
  const maximum = Math.max(homeValue ?? 0, awayValue ?? 0, 1);
  const homeWidth = homeValue == null ? 0 : Math.round((homeValue / maximum) * 100);
  const awayWidth = awayValue == null ? 0 : Math.round((awayValue / maximum) * 100);
  return <div className="detail-comparison-row"><div><strong>{home}</strong><i><b style={{ width: `${homeWidth}%` }} /></i></div><span>{label}</span><div><strong>{away}</strong><i><b style={{ width: `${awayWidth}%` }} /></i></div></div>;
}

type MarketLinesProps = { title: string; lines: Array<{ label: string; probability: number; detail?: string }>; note: string };

export function MarketLines({ title, lines, note }: MarketLinesProps) {
  return <section className="detail-market-lines"><header><span className="detail-kicker">Líneas disponibles</span><h2>{title}</h2></header><div>{lines.map((line) => <article key={line.label}><div><strong>{line.label}</strong>{line.detail && <small>{line.detail}</small>}</div><b>{line.probability}%</b><i aria-hidden="true"><span style={{ width: `${line.probability}%` }} /></i></article>)}</div><p>{note}</p></section>;
}

type CornerProfileProps = {
  homeTeam: string;
  awayTeam: string;
  homeExpected: number;
  awayExpected: number;
  homeFor: number | null;
  homeAgainst: number | null;
  awayFor: number | null;
  awayAgainst: number | null;
  leagueAverage: number | null;
};

function valueOrMissing(value: number | null) {
  return value == null ? "Sin dato" : value.toFixed(1);
}

export function CornerProfile({ homeTeam, awayTeam, homeExpected, awayExpected, homeFor, homeAgainst, awayFor, awayAgainst, leagueAverage }: CornerProfileProps) {
  const total = homeExpected + awayExpected;
  const homeShare = total ? Math.round((homeExpected / total) * 100) : 0;
  const awayShare = total ? 100 - homeShare : 0;
  const difference = Math.abs(homeExpected - awayExpected);
  const leadingTeam = homeExpected === awayExpected ? "Proyección equilibrada" : homeExpected > awayExpected ? homeTeam : awayTeam;

  return <section className="detail-corner-profile" aria-labelledby="corner-profile-title"><header><span className="detail-kicker">Contexto del modelo</span><h2 id="corner-profile-title">Perfil de córneres</h2></header><div className="detail-corner-share"><div><span>{homeTeam}</span><strong>{homeShare}%</strong></div><i role="img" aria-label={`Reparto esperado: ${homeTeam} ${homeShare}%, ${awayTeam} ${awayShare}%`}><b style={{ width: `${homeShare}%` }} /><em style={{ width: `${awayShare}%` }} /></i><div><strong>{awayShare}%</strong><span>{awayTeam}</span></div></div><p className="detail-corner-difference">{leadingTeam} · diferencia esperada de {difference.toFixed(2)} córneres.</p><div className="detail-corner-season"><div><span>Métrica</span><span>{homeTeam}</span><span>{awayTeam}</span></div><div><span>A favor</span><b>{valueOrMissing(homeFor)}</b><b>{valueOrMissing(awayFor)}</b></div><div><span>En contra</span><b>{valueOrMissing(homeAgainst)}</b><b>{valueOrMissing(awayAgainst)}</b></div></div><footer>Media liga: <b>{leagueAverage == null ? "Sin dato" : `${leagueAverage.toFixed(1)} córneres`}</b> · Proyección: <b>{total.toFixed(2)}</b></footer></section>;
}
