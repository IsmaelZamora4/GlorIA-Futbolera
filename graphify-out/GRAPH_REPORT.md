# Graph Report - GlorIA_Futbolera  (2026-10-31)

## Corpus Check
- 170 files · ~948,815 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 41 file(s) not represented in the graph (top: .csv 30, .css 7, (none) 2)

## Summary
- 1015 nodes · 1716 edges · 75 communities (66 shown, 9 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca4f95b0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analysis-model.test.cjs
- normalize-premier-league.mjs
- MatchDetailClient.tsx
- partidos/page.tsx
- metodologia/page.tsx
- como-funciona/page.tsx
- package.json
- BankDashboard.tsx
- (public)/page.tsx
- backtest-league-model.mjs
- compilerOptions
- validate-league-data.mjs
- Plan: conectar el nuevo home con partidos y datasets
- LandingFooter
- home/page.tsx
- normalizeLeague
- premier-league-analysis.ts
- refresh-current-season.mjs
- postcss.config.mjs
- README.md
- competitions/page.tsx
- datasets.ts
- api-football-audit.mjs
- Auditoría de API-Football
- GlorIA Futbolera — MVP y control de objetivos
- GlorIA Futbolera — guía de estilo
- Especificación: Bank personal
- Tareas
- 15. Plan de implementación por fases
- 3.1 Mercados estadísticos incluidos
- 8. Datos, fuentes y estrategia de API
- public.bets
- LandingMatchPreview.tsx
- 7. Requisitos de diseño y experiencia
- 11. Requisitos no funcionales
- 9. Motor de análisis estadístico
- Seguimiento de auditoría de API-Football
- 10. Arquitectura sugerida
- 18. Instrucciones para Codex
- 5. Usuarios y escenarios principales
- 6. Páginas y componentes del MVP
- 1. Resumen del producto
- 2. Objetivos del MVP
- AGENTS.md
- api-cache.md
- contacto/page.tsx
- Tareas: Auth y Bank personal
- Bank personal de GlorIA
- react
- ref_node_fs
- Tareas: conexión de datos del nuevo home
- validate-team-identities.mjs
- match-detail.ts
- Product
- normalize-league-data.mjs
- league-analysis.ts
- Estilo de fondo del hero
- configuración/page.tsx
- [competition]/page.tsx
- Contexto de GlorIA Futbolera
- SportiaSidebar
- next
- getLocalStandings
- venue-photos.ts
- Implementation Plan: Public competitions catalogue
- not-found-page.test.cjs
- app/layout.tsx
- home/not-found.tsx
- competitions-todo.md
- Plan: páginas 404 pública y autenticada
- Tareas: páginas 404
- Página de metodología
- posiciones/page.tsx

## God Nodes (most connected - your core abstractions)
1. `next` - 49 edges
2. `normalizeLeague()` - 34 edges
3. `getLocalLeagueAnalysis()` - 24 edges
4. `react` - 23 edges
5. `SportiaSidebar()` - 22 edges
6. `MatchDetailClient()` - 21 edges
7. `SportiaPageHeader()` - 20 edges
8. `GlorIA Futbolera — MVP y control de objetivos` - 20 edges
9. `compilerOptions` - 17 edges
10. `MatchDetailPage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Supuestos por validar` --references--> `getLocalLeagueAnalysis()`  [INFERRED]
  docs/ideas/metodologia.md → features/match-analysis/services/league-analysis.ts
- `Tareas y aceptación` --references--> `HomeLayout()`  [INFERRED]
  tasks/404-page-plan.md → app/(account)/home/layout.tsx
- `Shell y jerarquía` --references--> `AppSidebar()`  [INFERRED]
  STYLE.md → components/layout/AppSidebar.tsx
- `Decisiones` --references--> `LandingFooter()`  [INFERRED]
  tasks/404-page-plan.md → components/layout/LandingFooter.tsx
- `Decisiones` --references--> `LandingHeader()`  [INFERRED]
  tasks/404-page-plan.md → components/layout/LandingHeader.tsx

## Import Cycles
- None detected.

## Communities (75 total, 9 thin omitted)

### Community 0 - "analysis-model.test.cjs"
Cohesion: 0.13
Nodes (19): competitionAliases, getTeamVenue(), LocalCompetition, resolveFixtureVenue(), TeamVenue, teamVenues, getKnownTeamByKey(), normalizeTeamKey() (+11 more)

### Community 1 - "normalize-premier-league.mjs"
Cohesion: 0.08
Nodes (9): files, matches, outputDirectory, preMatchFeatures, rawDirectory, requiredColumns, summary, teamSeasonStats (+1 more)

### Community 2 - "MatchDetailClient.tsx"
Cohesion: 0.07
Nodes (48): crestByTeam, getKnownTeamCrest(), formatTimelineDate(), FormTimeline(), FormTimelineProps, OpponentMark(), outcomeLabel(), CornerProfile() (+40 more)

### Community 3 - "partidos/page.tsx"
Cohesion: 0.08
Nodes (34): competitionLabels, dateLabel(), Fixture, FixtureCacheEntry, FixtureRow(), FootballDataFixture, formatDate(), getCompetitionLogo() (+26 more)

### Community 4 - "metodologia/page.tsx"
Cohesion: 0.18
Nodes (6): coverage, fixtureOnly, formatUpdatedAt(), metadata, MethodologyPage(), metricLabels

### Community 5 - "como-funciona/page.tsx"
Cohesion: 0.20
Nodes (11): HowItWorksPage(), Icon(), IconName, information, match, MatchHistory(), metadata, OutcomeEstimate() (+3 more)

### Community 6 - "package.json"
Cohesion: 0.05
Nodes (45): dependencies, next@^16.4.2, react@19.1.0, react-dom@19.1.0, @supabase/ssr@^0.12.7, @supabase/supabase-js@^2.118.0, devDependencies, eslint@^9.39.5 (+37 more)

### Community 7 - "BankDashboard.tsx"
Cohesion: 0.05
Nodes (60): BankPage(), BankPageShell(), BankSearchParams, BankSummaryRow, getLoadError(), numeric(), parsePage(), toBankSummary() (+52 more)

### Community 8 - "(public)/page.tsx"
Cohesion: 0.24
Nodes (9): competitions, FeatureIcon(), features, LandingPage(), productViews, fixtures, LandingFixturesPreview(), LandingStandingsPreview() (+1 more)

### Community 9 - "backtest-league-model.mjs"
Cohesion: 0.21
Nodes (18): available(), average(), backtestLeague(), calibrationModel(), calibrationOutputPath, expectedAwayMetric(), expectedHomeMetric(), leagues (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, baseUrl, esModuleInterop, incremental, isolatedModules, jsx, lib (+11 more)

### Community 11 - "validate-league-data.mjs"
Cohesion: 0.21
Nodes (15): auditLeague(), auditProcessedLeague(), auditRawLeague(), canonicalTeamName(), countDuplicates(), createCounter(), leagues, optionalNumericColumns (+7 more)

### Community 12 - "Plan: conectar el nuevo home con partidos y datasets"
Cohesion: 0.14
Nodes (13): Checkpoint visual y funcional, Decisiones de implementación, Estado actual, Fase 1: contrato de cobertura y fuente, Fase 2: normalización de datos, Fase 3: agenda real en `/home`, Fase 4: integración del análisis histórico, Fase 5: entrada pública (+5 more)

### Community 13 - "LandingFooter"
Cohesion: 0.20
Nodes (12): metadata, NotFound(), metadata, sections, TermsPage(), FooterIcon(), groups, LandingFooter() (+4 more)

### Community 14 - "home/page.tsx"
Cohesion: 0.17
Nodes (19): articles, competitionDetails, CompetitionGroup, FixtureResponse, formatKickoff(), getDetailHref(), getRecommendedPick(), getVectorCrestUrl() (+11 more)

### Community 16 - "premier-league-analysis.ts"
Cohesion: 0.27
Nodes (11): average(), blend(), canonicalTeamName(), CurrentSeasonResult, getHistoricalMatches(), getPremierLeagueHistoricalAnalysis(), HistoricalMatch, outcomeProbabilities() (+3 more)

### Community 17 - "refresh-current-season.mjs"
Cohesion: 0.18
Nodes (7): dryRun, league, leagues, parseCsvLine(), requiredColumns, sourceArgument, validateIncomingCsv()

### Community 20 - "README.md"
Cohesion: 0.12
Nodes (15): Datos históricos locales, Mercados del MVP, Rutina semanal, Validación del modelo, Cobertura y fuentes, Comandos, Cómo se calcula, Detalle del encuentro (+7 more)

### Community 21 - "competitions/page.tsx"
Cohesion: 0.33
Nodes (6): metadata, PublicCompetitionsPage(), Availability(), classicMatches, competitions, CompetitionsBrowser()

### Community 22 - "datasets.ts"
Cohesion: 0.29
Nodes (6): datasetInfoByCompetition, DatasetMarket, datasetSeasons, DatasetStatus, historicalMarkets, insufficientDatasetInfo

### Community 23 - "api-football-audit.mjs"
Cohesion: 0.23
Nodes (11): bodyErrors(), classify(), COMPETITIONS, ENV_PATH, extractStats(), loadApiKey(), main(), md() (+3 more)

### Community 24 - "Auditoría de API-Football"
Cohesion: 0.22
Nodes (8): Auditoría de API-Football, Estadísticas de partido, Hallazgo adicional del plan gratuito, Interpretación, Ligas y temporadas, Muestras de partidos finalizados, Recomendaciones, Resultado observado

### Community 25 - "GlorIA Futbolera — MVP y control de objetivos"
Cohesion: 0.22
Nodes (8): 12. Fuera del alcance del MVP, 13. Definición de “terminado”, 16. Riesgos y limitaciones conocidas, 17. Criterios para considerar el MVP listo, 19. Registro de cambios, 4. Competiciones incluidas, Estados permitidos para el seguimiento, GlorIA Futbolera — MVP y control de objetivos

### Community 26 - "GlorIA Futbolera — guía de estilo"
Cohesion: 0.22
Nodes (8): Composición y componentes, Fuentes del sistema, GlorIA Futbolera — guía de estilo, Identidad común, Paleta, Referencias y alcance, Reglas para nuevos apartados, Sitio público `/`

### Community 27 - "Especificación: Bank personal"
Cohesion: 0.15
Nodes (12): Comandos del proyecto, Criterios de aceptación, Datos y privacidad, Especificación: Bank personal, Estilo y verificación, Flujo de usuario, Límites de la implementación, Objetivo (+4 more)

### Community 28 - "Tareas"
Cohesion: 0.12
Nodes (15): Checkpoint: Dominio, Checkpoint: Fundación, Checkpoint: Identidad, Checkpoint: Producto, Decisiones de arquitectura, Fase 0: Preparación y conexión, Fase 1: Identidad, Fase 2: Bank y seguridad de datos (+7 more)

### Community 29 - "15. Plan de implementación por fases"
Cohesion: 0.29
Nodes (7): 15. Plan de implementación por fases, Fase 0 — Auditoría del proyecto, Fase 1 — Interfaz y experiencia local, Fase 2 — Modelo de datos y almacenamiento, Fase 3 — Integración controlada de API, Fase 4 — Cálculos estadísticos, Fase 5 — Validación y cierre del MVP

### Community 30 - "3.1 Mercados estadísticos incluidos"
Cohesion: 0.29
Nodes (7): 3.1 Mercados estadísticos incluidos, 3. Alcance funcional, M1. Resultado 1X2, M2. Córners, M3. Ambos equipos marcan (BTTS), M4. Goles, M5. Tiros a puerta

### Community 31 - "8. Datos, fuentes y estrategia de API"
Cohesion: 0.29
Nodes (7): 8. Datos, fuentes y estrategia de API, Caché y almacenamiento local, Datos de demostración, Fuente prevista, Política de presupuesto de requests, Reglas obligatorias para las llamadas, Variables de entorno

### Community 32 - "public.bets"
Cohesion: 0.29
Nodes (8): bank_adjustments_bank_id_occurred_at_idx, bank_adjustments_user_id_occurred_at_idx, bets_bank_id_placed_at_idx, bets_user_id_status_idx, public.bank_adjustments, public.banks, public.bets, public.get_bank_summary()

### Community 33 - "LandingMatchPreview.tsx"
Cohesion: 0.25
Nodes (9): Crest(), Form(), LandingMatchPreview(), MetricCard(), Results(), Tab, tabs, Team (+1 more)

### Community 34 - "7. Requisitos de diseño y experiencia"
Cohesion: 0.33
Nodes (6): 7. Requisitos de diseño y experiencia, Dirección visual, Marca y activos, Paleta propuesta, Responsive, Tipografía sugerida

### Community 35 - "11. Requisitos no funcionales"
Cohesion: 0.40
Nodes (5): 11. Requisitos no funcionales, Accesibilidad, Fiabilidad, Mantenibilidad, Rendimiento

### Community 36 - "9. Motor de análisis estadístico"
Cohesion: 0.40
Nodes (5): 9. Motor de análisis estadístico, Objetivo, Primera aproximación permitida, Requisitos de calidad, Requisitos mínimos

### Community 37 - "Seguimiento de auditoría de API-Football"
Cohesion: 0.50
Nodes (3): Plan ejecutado, Resultado, Seguimiento de auditoría de API-Football

### Community 38 - "10. Arquitectura sugerida"
Cohesion: 0.50
Nodes (4): 10. Arquitectura sugerida, Seguridad y robustez, Separación lógica sugerida, Stack preferido

### Community 39 - "18. Instrucciones para Codex"
Cohesion: 0.50
Nodes (4): 18. Instrucciones para Codex, Después de la auditoría, Primera tarea: auditoría, no reescritura, Registro de cambios

### Community 40 - "5. Usuarios y escenarios principales"
Cohesion: 0.50
Nodes (4): 5. Usuarios y escenarios principales, Escenarios secundarios, Flujo principal, Usuario objetivo

### Community 41 - "6. Páginas y componentes del MVP"
Cohesion: 0.50
Nodes (4): 6.1 Inicio / dashboard, 6.2 Panel de partido, 6.3 Estados de interfaz, 6. Páginas y componentes del MVP

### Community 42 - "1. Resumen del producto"
Cohesion: 0.67
Nodes (3): 1. Resumen del producto, Principios del producto, Propuesta de valor

### Community 43 - "2. Objetivos del MVP"
Cohesion: 0.67
Nodes (3): 2. Objetivos del MVP, Objetivo principal, Objetivos específicos

### Community 46 - "contacto/page.tsx"
Cohesion: 0.38
Nodes (5): ContactPage(), metadata, questions, ContactForm(), ContactIcon()

### Community 47 - "Tareas: Auth y Bank personal"
Cohesion: 0.20
Nodes (9): Checkpoint: Dominio, Checkpoint: Fundación, Checkpoint: Identidad, Checkpoint: Producto, Fase 0: Preparación y conexión, Fase 1: Identidad, Fase 2: Bank y seguridad de datos, Fase 3: Interfaz (+1 more)

### Community 48 - "Bank personal de GlorIA"
Cohesion: 0.22
Nodes (8): Alcance inicial, Bank personal de GlorIA, Criterio de éxito, Dirección recomendada, No incluir todavía, Preguntas abiertas, Problema, Supuestos por validar

### Community 49 - "react"
Cohesion: 0.10
Nodes (30): HomeLayout(), GET(), UpdatePasswordPage(), AtIcon(), EyeIcon(), getAuthCallbackUrl(), getRequestedDestination(), GoogleIcon() (+22 more)

### Community 50 - "ref_node_fs"
Cohesion: 0.22
Nodes (6): outputDirectory, teams, apiKey, envPath, outputDirectory, requestedNames

### Community 51 - "Tareas: conexión de datos del nuevo home"
Cohesion: 0.40
Nodes (4): Completado, Decisión posterior, Tareas: conexión de datos del nuevo home, Verificado

### Community 52 - "validate-team-identities.mjs"
Cohesion: 0.29
Nodes (5): aliases, leagueDirectories, output, processedRoot, reports

### Community 53 - "match-detail.ts"
Cohesion: 0.08
Nodes (21): AggregateMetric, configurations, datasetCache, DetailCompetitionConfig, FormOutcome, HeadToHeadMatch, HeadToHeadSummary, LocalDetailDataset (+13 more)

### Community 54 - "Product"
Cohesion: 0.20
Nodes (9): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Platform, Positioning, Product, Product Principles, Product Purpose (+1 more)

### Community 55 - "normalize-league-data.mjs"
Cohesion: 0.27
Nodes (9): leagues, normalizeRow(), parseCsvLine(), processedRoot, rawRoot, requiredColumns, seasonFromFile(), toIsoDate() (+1 more)

### Community 56 - "league-analysis.ts"
Cohesion: 0.06
Nodes (55): GET(), GET(), datasets, GET(), LocalFixture, GET(), competitions, fixtureInFlight (+47 more)

### Community 58 - "configuración/page.tsx"
Cohesion: 0.19
Nodes (14): availableCompetitions, fixtureCachePrefixes, savePreferences(), SettingsIcon(), SettingsPage(), AppLanguage, applyPreferences(), AppTheme (+6 more)

### Community 59 - "[competition]/page.tsx"
Cohesion: 0.31
Nodes (10): MatchDetailPage(), safeCrest(), SearchParams, getLocalVenuePhoto(), getDataset(), getHeadToHead(), getLocalMatchDetailContext(), getMatchDetailCompetitionBySlug() (+2 more)

### Community 60 - "Contexto de GlorIA Futbolera"
Cohesion: 0.25
Nodes (7): Archivos locales que requieren revisión antes de incluirlos, Contexto de GlorIA Futbolera, Continuación, Estado y verificaciones de la tarea reciente, Navegación autenticada, Proyecto y reglas, Páginas 404

### Community 61 - "SportiaSidebar"
Cohesion: 0.18
Nodes (14): competitions, CompetitionsPage(), DataPage(), datasets, SportiaPageHeader(), Icon(), IconName, leagues (+6 more)

### Community 62 - "next"
Cohesion: 0.16
Nodes (10): metadata, PrivacyPage(), LegalPageLayout(), isProtectedPath(), protectedPageRoots, updateSession(), nextConfig, config (+2 more)

### Community 63 - "getLocalStandings"
Cohesion: 0.31
Nodes (9): createStanding(), getLocalStandings(), getStandingsZone(), getTeamRecentForm(), getTeamSeasonStatistics(), getTeamSideValue(), getVenueSeasonRecord(), latestFinishedDate() (+1 more)

### Community 64 - "venue-photos.ts"
Cohesion: 0.38
Nodes (6): getVenuePhoto(), isTrustedImageUrl(), isTrustedSourceUrl(), localVenuePhotos, VenuePhoto, WikipediaSummary

### Community 65 - "Implementation Plan: Public competitions catalogue"
Cohesion: 0.20
Nodes (9): Design contract, Implementation Plan: Public competitions catalogue, Overview, Phase 1: Public route and shared navigation, Phase 2: Catalogue and evidence, Phase 3: Responsive review, Risks, Tasks (+1 more)

### Community 66 - "not-found-page.test.cjs"
Cohesion: 0.25
Nodes (7): assert, path, React, { readFileSync }, { renderToStaticMarkup }, test, typescript

### Community 67 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): jakartaSans, metadata, plexSans, plexSansCondensed

### Community 68 - "home/not-found.tsx"
Cohesion: 0.53
Nodes (3): HomeNotFound(), NotFoundContent(), NotFoundContentProps

### Community 71 - "Plan: páginas 404 pública y autenticada"
Cohesion: 0.29
Nodes (6): Criterios de aceptación, Decisiones, Objetivo, Plan: páginas 404 pública y autenticada, Riesgos, Tareas y aceptación

### Community 75 - "Página de metodología"
Cohesion: 0.22
Nodes (8): Alcance inicial, Criterio de éxito, Dirección recomendada, No incluir todavía, Problema, Próximos pasos antes de implementar, Página de metodología, Supuestos por validar

### Community 76 - "posiciones/page.tsx"
Cohesion: 0.33
Nodes (8): competitions, dynamic, getCompetition(), positionClass(), PositionsPage(), StandingsTable(), FootballDataStanding, getFootballDataStandings()

## Knowledge Gaps
- **1 isolated node(s):** `Estilo de fondo del hero`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 514 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `MatchDetailClient.tsx`, `partidos/page.tsx`, `metodologia/page.tsx`, `como-funciona/page.tsx`, `package.json`, `BankDashboard.tsx`, `(public)/page.tsx`, `LandingFooter`, `home/page.tsx`, `competitions/page.tsx`, `LandingMatchPreview.tsx`, `contacto/page.tsx`, `react`, `league-analysis.ts`, `configuración/page.tsx`, `[competition]/page.tsx`, `SportiaSidebar`, `app/layout.tsx`, `posiciones/page.tsx`?**
  _High betweenness centrality (0.273) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SportiaSidebar()` (e.g. with `Shell y jerarquía` and `Tareas y aceptación`) actually correct?**
  _`SportiaSidebar()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Estilo de fondo del hero` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analysis-model.test.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Why does `DatasetInfo` connect `partidos/page.tsx` to `league-analysis.ts`, `datasets.ts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `normalize-premier-league.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `GlorIA Futbolera — MVP y control de objetivos` connect `GlorIA Futbolera — MVP y control de objetivos` to `7. Requisitos de diseño y experiencia`, `partidos/page.tsx`, `11. Requisitos no funcionales`, `9. Motor de análisis estadístico`, `10. Arquitectura sugerida`, `18. Instrucciones para Codex`, `5. Usuarios y escenarios principales`, `6. Páginas y componentes del MVP`, `1. Resumen del producto`, `2. Objetivos del MVP`, `15. Plan de implementación por fases`, `3.1 Mercados estadísticos incluidos`, `8. Datos, fuentes y estrategia de API`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._