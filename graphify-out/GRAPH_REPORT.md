# Graph Report - GlorIA_Futbolera  (2026-10-31)

## Corpus Check
- 174 files · ~899,339 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 40 file(s) not represented in the graph (top: .csv 30, .css 7, .example 1)

## Summary
- 957 nodes · 1626 edges · 78 communities (70 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89e641a5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analysis-model.test.cjs
- normalize-premier-league.mjs
- MatchDetailClient.tsx
- partidos/page.tsx
- react
- como-funciona/page.tsx
- package.json
- bank/page.tsx
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
- local-fixtures/route.ts
- metodologia/page.tsx
- api-football-audit.mjs
- Auditoría de API-Football
- GlorIA Futbolera — MVP y control de objetivos
- Q: ¿Cómo conecta Next.js el catálogo, los partidos, Bank y autenticación?
- Especificación: Bank personal
- Tareas
- 15. Plan de implementación por fases
- 3.1 Mercados estadísticos incluidos
- 8. Datos, fuentes y estrategia de API
- 20261029000100_create_bank_schema.sql
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
- login/page.tsx
- ref_node_fs
- Tareas: conexión de datos del nuevo home
- validate-team-identities.mjs
- match-detail.ts
- Product
- normalize-league-data.mjs
- league-analysis.ts
- Estilo de fondo del hero
- configuracion/page.tsx
- [competition]/page.tsx
- scripts
- SportiaSidebar
- next
- getLocalStandings
- dependencies
- Implementation Plan: Public competitions catalogue
- not-found-page.test.cjs
- app/layout.tsx
- calibration.ts
- supabase/proxy.ts
- competitions-todo.md
- Plan: páginas 404 pública y autenticada
- eslint
- Tareas: páginas 404
- terminos/page.tsx
- Página de metodología
- posiciones/page.tsx
- sportsdb/fixtures/route.ts

## God Nodes (most connected - your core abstractions)
1. `next` - 48 edges
2. `normalizeLeague()` - 34 edges
3. `getLocalLeagueAnalysis()` - 24 edges
4. `react` - 23 edges
5. `SportiaSidebar()` - 21 edges
6. `MatchDetailClient()` - 21 edges
7. `GlorIA Futbolera — MVP y control de objetivos` - 20 edges
8. `SportiaPageHeader()` - 19 edges
9. `compilerOptions` - 17 edges
10. `MatchDetailPage()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Supuestos por validar` --references--> `getLocalLeagueAnalysis()`  [INFERRED]
  docs/ideas/metodologia.md → features/match-analysis/services/league-analysis.ts
- `Tareas y aceptación` --references--> `HomeLayout()`  [INFERRED]
  tasks/404-page-plan.md → app/(account)/home/layout.tsx
- `Decisiones` --references--> `LandingFooter()`  [INFERRED]
  tasks/404-page-plan.md → components/layout/LandingFooter.tsx
- `Decisiones` --references--> `LandingHeader()`  [INFERRED]
  tasks/404-page-plan.md → components/layout/LandingHeader.tsx
- `Tareas y aceptación` --references--> `SportiaSidebar()`  [INFERRED]
  tasks/404-page-plan.md → components/layout/SportiaSidebar.tsx

## Import Cycles
- None detected.

## Communities (78 total, 8 thin omitted)

### Community 0 - "analysis-model.test.cjs"
Cohesion: 0.12
Nodes (19): competitionAliases, getTeamVenue(), LocalCompetition, resolveFixtureVenue(), TeamVenue, teamVenues, getKnownTeamByKey(), normalizeTeamKey() (+11 more)

### Community 1 - "normalize-premier-league.mjs"
Cohesion: 0.08
Nodes (9): files, matches, outputDirectory, preMatchFeatures, rawDirectory, requiredColumns, summary, teamSeasonStats (+1 more)

### Community 2 - "MatchDetailClient.tsx"
Cohesion: 0.07
Nodes (48): crestByTeam, getKnownTeamCrest(), formatTimelineDate(), FormTimeline(), FormTimelineProps, OpponentMark(), outcomeLabel(), CornerProfile() (+40 more)

### Community 3 - "partidos/page.tsx"
Cohesion: 0.08
Nodes (33): competitionLabels, dateLabel(), featuredMatch, Fixture, FixtureCacheEntry, FixtureRow(), FootballDataFixture, formatDate() (+25 more)

### Community 4 - "react"
Cohesion: 0.26
Nodes (7): UpdatePasswordPage(), supabase, UserProfile(), signOut(), getHomeUserInitials(), createClient(), react

### Community 5 - "como-funciona/page.tsx"
Cohesion: 0.22
Nodes (11): HowItWorksPage(), Icon(), IconName, information, match, MatchHistory(), metadata, OutcomeEstimate() (+3 more)

### Community 6 - "package.json"
Cohesion: 0.15
Nodes (18): devDependencies, supabase@^2.122.0, tailwindcss@4.1.14, @tailwindcss/postcss@4.1.14, @types/node@24.7.2, @types/react@19.2.2, @types/react-dom@19.2.2, typescript@5.9.3 (+10 more)

### Community 7 - "bank/page.tsx"
Cohesion: 0.08
Nodes (43): BankPage(), HomeLayout(), GET(), HomeUserContext, HomeUserProvider(), useHomeUserProfile(), RequireAuth(), firstString() (+35 more)

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
Nodes (12): metadata, NotFound(), metadata, PublicCompetitionsPage(), FooterIcon(), groups, LandingFooter(), LandingHeader() (+4 more)

### Community 14 - "home/page.tsx"
Cohesion: 0.18
Nodes (18): articles, competitionDetails, CompetitionGroup, FixtureResponse, formatKickoff(), getDetailHref(), getRecommendedPick(), getVectorCrestUrl() (+10 more)

### Community 16 - "premier-league-analysis.ts"
Cohesion: 0.27
Nodes (11): average(), blend(), canonicalTeamName(), CurrentSeasonResult, getHistoricalMatches(), getPremierLeagueHistoricalAnalysis(), HistoricalMatch, outcomeProbabilities() (+3 more)

### Community 17 - "refresh-current-season.mjs"
Cohesion: 0.18
Nodes (7): dryRun, league, leagues, parseCsvLine(), requiredColumns, sourceArgument, validateIncomingCsv()

### Community 20 - "README.md"
Cohesion: 0.12
Nodes (15): Datos históricos locales, Mercados del MVP, Rutina semanal, Validación del modelo, Cobertura y fuentes, Comandos, Cómo se calcula, Detalle del encuentro (+7 more)

### Community 21 - "local-fixtures/route.ts"
Cohesion: 0.24
Nodes (12): GET(), datasets, GET(), LocalFixture, fixtureInFlight, fixtureMemoryCache, footballDataCompetitions, FootballDataStanding (+4 more)

### Community 22 - "metodologia/page.tsx"
Cohesion: 0.12
Nodes (12): coverage, fixtureOnly, formatUpdatedAt(), metadata, MethodologyPage(), metricLabels, datasetInfoByCompetition, DatasetMarket (+4 more)

### Community 23 - "api-football-audit.mjs"
Cohesion: 0.23
Nodes (11): bodyErrors(), classify(), COMPETITIONS, ENV_PATH, extractStats(), loadApiKey(), main(), md() (+3 more)

### Community 24 - "Auditoría de API-Football"
Cohesion: 0.22
Nodes (8): Auditoría de API-Football, Estadísticas de partido, Hallazgo adicional del plan gratuito, Interpretación, Ligas y temporadas, Muestras de partidos finalizados, Recomendaciones, Resultado observado

### Community 25 - "GlorIA Futbolera — MVP y control de objetivos"
Cohesion: 0.18
Nodes (10): DatasetInfo, 12. Fuera del alcance del MVP, 13. Definición de “terminado”, 14. Matriz de seguimiento de objetivos, 16. Riesgos y limitaciones conocidas, 17. Criterios para considerar el MVP listo, 19. Registro de cambios, 4. Competiciones incluidas (+2 more)

### Community 26 - "Q: ¿Cómo conecta Next.js el catálogo, los partidos, Bank y autenticación?"
Cohesion: 0.50
Nodes (3): Answer, Q: ¿Cómo conecta Next.js el catálogo, los partidos, Bank y autenticación?, Source Nodes

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

### Community 32 - "20261029000100_create_bank_schema.sql"
Cohesion: 0.35
Nodes (7): bank_adjustments_bank_id_occurred_at_idx, bank_adjustments_user_id_occurred_at_idx, bets_bank_id_placed_at_idx, bets_user_id_status_idx, public.bank_adjustments, public.banks, public.bets

### Community 33 - "LandingMatchPreview.tsx"
Cohesion: 0.23
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

### Community 49 - "login/page.tsx"
Cohesion: 0.23
Nodes (13): GET(), AtIcon(), EyeIcon(), getAuthCallbackUrl(), getRequestedDestination(), GoogleIcon(), LockIcon(), LoginForm() (+5 more)

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
Cohesion: 0.13
Nodes (26): AnalysisConfig, average(), blendHistoricalAndCurrent(), configurations, dataCache, DerivedMarkets, expectedAwaySideMetric(), expectedHomeSideMetric() (+18 more)

### Community 58 - "configuracion/page.tsx"
Cohesion: 0.19
Nodes (14): availableCompetitions, fixtureCachePrefixes, savePreferences(), SettingsIcon(), SettingsPage(), AppLanguage, applyPreferences(), AppTheme (+6 more)

### Community 59 - "[competition]/page.tsx"
Cohesion: 0.22
Nodes (14): MatchDetailPage(), safeCrest(), SearchParams, getLocalVenuePhoto(), getVenuePhoto(), isTrustedImageUrl(), isTrustedSourceUrl(), localVenuePhotos (+6 more)

### Community 60 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, backtest, build, cache:logos, dev, lint, normalize:data, normalize:premier (+6 more)

### Community 61 - "SportiaSidebar"
Cohesion: 0.19
Nodes (13): competitions, CompetitionsPage(), DataPage(), datasets, HomeNotFound(), AppSidebar(), SportiaPageHeader(), Icon() (+5 more)

### Community 62 - "next"
Cohesion: 0.24
Nodes (5): metadata, PrivacyPage(), LegalPageLayout(), nextConfig, next

### Community 63 - "getLocalStandings"
Cohesion: 0.24
Nodes (11): createStanding(), getDataset(), getLocalMatchDetailContext(), getLocalStandings(), getStandingsZone(), getTeamRecentForm(), getTeamSeasonStatistics(), getTeamSideValue() (+3 more)

### Community 64 - "dependencies"
Cohesion: 0.22
Nodes (9): dependencies, next@^16.4.2, react@19.1.0, react-dom@19.1.0, @supabase/ssr@^0.12.7, @supabase/supabase-js@^2.118.0, react-dom, @supabase/ssr (+1 more)

### Community 65 - "Implementation Plan: Public competitions catalogue"
Cohesion: 0.20
Nodes (9): Design contract, Implementation Plan: Public competitions catalogue, Overview, Phase 1: Public route and shared navigation, Phase 2: Catalogue and evidence, Phase 3: Responsive review, Risks, Tasks (+1 more)

### Community 66 - "not-found-page.test.cjs"
Cohesion: 0.25
Nodes (7): assert, path, React, { readFileSync }, { renderToStaticMarkup }, test, typescript

### Community 67 - "app/layout.tsx"
Cohesion: 0.29
Nodes (4): jakartaSans, metadata, plexSans, plexSansCondensed

### Community 68 - "calibration.ts"
Cohesion: 0.31
Nodes (9): applyMap(), calibrateProbability(), calibrateResultProbabilities(), CalibrationBin, CalibrationDocument, CalibrationMap, clamp(), getCalibrationDocument() (+1 more)

### Community 69 - "supabase/proxy.ts"
Cohesion: 0.43
Nodes (5): isProtectedPath(), protectedPageRoots, updateSession(), config, proxy()

### Community 71 - "Plan: páginas 404 pública y autenticada"
Cohesion: 0.29
Nodes (6): Criterios de aceptación, Decisiones, Objetivo, Plan: páginas 404 pública y autenticada, Riesgos, Tareas y aceptación

### Community 72 - "eslint"
Cohesion: 0.40
Nodes (4): eslint@^9.39.5, eslint-config-next@^16.4.2, eslint, eslint-config-next

### Community 74 - "terminos/page.tsx"
Cohesion: 0.33
Nodes (6): metadata, sections, TermsPage(), ContactIconName, TermsExplorer(), TermsSection

### Community 75 - "Página de metodología"
Cohesion: 0.22
Nodes (8): Alcance inicial, Criterio de éxito, Dirección recomendada, No incluir todavía, Problema, Próximos pasos antes de implementar, Página de metodología, Supuestos por validar

### Community 76 - "posiciones/page.tsx"
Cohesion: 0.39
Nodes (7): competitions, dynamic, getCompetition(), positionClass(), PositionsPage(), StandingsTable(), getFootballDataStandings()

### Community 77 - "sportsdb/fixtures/route.ts"
Cohesion: 0.53
Nodes (4): GET(), getSportsDbEvents(), leagueAliases, sportsDbLeagues

## Knowledge Gaps
- **1 isolated node(s):** `Estilo de fondo del hero`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 478 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `MatchDetailClient.tsx`, `partidos/page.tsx`, `react`, `como-funciona/page.tsx`, `package.json`, `bank/page.tsx`, `(public)/page.tsx`, `LandingFooter`, `home/page.tsx`, `local-fixtures/route.ts`, `metodologia/page.tsx`, `LandingMatchPreview.tsx`, `contacto/page.tsx`, `login/page.tsx`, `configuracion/page.tsx`, `[competition]/page.tsx`, `SportiaSidebar`, `dependencies`, `app/layout.tsx`, `supabase/proxy.ts`, `terminos/page.tsx`, `posiciones/page.tsx`, `sportsdb/fixtures/route.ts`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **What connects `Estilo de fondo del hero` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analysis-model.test.cjs` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._
- **Why does `DatasetInfo` connect `GlorIA Futbolera — MVP y control de objetivos` to `league-analysis.ts`, `partidos/page.tsx`, `metodologia/page.tsx`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `normalize-premier-league.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Why does `GlorIA Futbolera — MVP y control de objetivos` connect `GlorIA Futbolera — MVP y control de objetivos` to `7. Requisitos de diseño y experiencia`, `11. Requisitos no funcionales`, `9. Motor de análisis estadístico`, `10. Arquitectura sugerida`, `18. Instrucciones para Codex`, `5. Usuarios y escenarios principales`, `6. Páginas y componentes del MVP`, `1. Resumen del producto`, `2. Objetivos del MVP`, `15. Plan de implementación por fases`, `3.1 Mercados estadísticos incluidos`, `8. Datos, fuentes y estrategia de API`?**
  _High betweenness centrality (0.110) - this node is a cross-community bridge._
- **Should `MatchDetailClient.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._