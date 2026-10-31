# Contexto de GlorIA Futbolera

Documento de continuidad para futuras conversaciones de desarrollo. Leerlo junto con `AGENTS.md` antes de modificar código.

## Proyecto y reglas

- Repositorio: `IsmaelZamora4/GlorIA-Futbolera`; aplicación Next.js App Router con React, TypeScript y Supabase.
- `AGENTS.md` advierte que la versión instalada de Next.js tiene cambios incompatibles: leer la guía pertinente en `node_modules/next/dist/docs/` antes de cambiar código Next.
- `STYLE.md` define los tokens y patrones visuales. Guiarse por `/` y `/home` para nuevos apartados.
- `next-env.d.ts` es generado por Next.js: no editarlo manualmente.
- Antes de seleccionar archivos, revisar `git status`; hay trabajo local que no debe incluirse sin revisar su alcance.

## Rutas autenticadas

Las rutas privadas están bajo `/home`; el grupo `(account)` no aparece en URL.

- Inicio `/home`; Partidos `/home/partidos`; Competiciones `/home/competiciones`; Posiciones `/home/posiciones`.
- Detalle `/home/partido/[competition]`; Mi Bank `/home/bank`; Datos `/home/datos`.
- Configuración `/home/configuración`; Metodología visible `/home/metodología`.
- La página de Metodología vive en `app/(account)/home/metodologia/page.tsx` (sin tilde). `next.config.ts` reescribe la variante UTF-8 codificada a esta ruta interna ASCII para evitar el 404 por resolución de `í`.
- Hay redirecciones para rutas previas sin el prefijo `/home`; al crear enlaces nuevos usar las rutas canónicas anteriores.

## Mi Bank

- Interfaz y Server Actions: `app/(account)/home/bank/page.tsx`, `features/bank/components/BankDashboard.tsx` y `features/bank/actions.ts`.
- Cálculos y validaciones: `features/bank/services/calculations.ts`.
- Datos por usuario autenticado en `banks`, `bets` y `bank_adjustments`, protegidos por RLS y permisos SQL restringidos.
- `get_bank_summary()` calcula los agregados en Postgres con `SECURITY INVOKER` y filtra por `auth.uid()` para no truncar totales al paginar.
- Migraciones Bank incorporadas: `supabase/migrations/20261031153043_bank_limit_table_access.sql` y `supabase/migrations/20261031153622_bank_summary_rpc.sql`. Confirmar que estén aplicadas en el proyecto Supabase; el commit no las ejecuta en el backend remoto.
- El Bank guardado incluye validaciones, historial paginado y estados de apuesta. Hay cambios locales posteriores para selector de competición/equipos; revisar su diff y pruebas antes de publicarlos.

## Páginas 404

- 404 pública: `app/not-found.tsx`; 404 autenticada: `app/(account)/home/not-found.tsx` y catch-all `app/(account)/home/[...slug]/page.tsx`.
- Presentación compartida: `features/not-found/components/NotFoundContent.tsx` y `NotFoundContent.module.css`.
- Wallpaper: `public/wallpapers/404-wallpaper.png`.

## Grafo y diagrama

- Grafo Graphify actualizado desde checkout limpio del commit `d4394af`: `graphify-out/graph.json`, `graphify-out/graph.html` y `graphify-out/GRAPH_REPORT.md`.
- Último grafo: 1,017 nodos, 1,719 relaciones y 76 comunidades. El corpus reporta 170 archivos y 41 archivos sin clasificar (principalmente CSV y CSS).
- Diagrama Archify actualizado en `.archify/architecture-gloria-futbolera-20261031-121458/architecture-gloria.html`; su `candidate.json` fija como evidencia el mismo commit `ca4f95b...`.
- Archify `finalize` pasó validación, entrega, integridad y browser-check. Se generó revisión visual automatizada; la composición se inspeccionó en captura oscura de escritorio. El recorrido de reescritura de metodología cruza dos líneas secundarias del mapa, sin impedir su lectura.

## Commits y publicación

- `2ba35ec` `feat: improve bank experience and safeguards` — Bank, estilos, pruebas y migraciones SQL.
- `ca4f95b` `fix: resolve metodología route with accented URL` — ruta interna ASCII y compatibilidad de URL.
- La documentación y artefactos actuales deben publicarse en la rama `codex/bank-audit`; no se hizo merge a `main`.
- En la última revisión quedan cambios locales posteriores en perfil, recuperación de contraseña, aliases de equipos y selector de partidos para Bank. No asumir que están publicados; revisar `git status --short` y los diffs.

## Verificaciones registradas

Antes de crear estos commits pasaron `npm run build`, `npm run typecheck`, `npm test` (47 pruebas) y `git diff --check`. Las verificaciones correspondían al estado probado entonces; ejecutar de nuevo lo pertinente después de integrar cambios locales posteriores.

## Próxima conversación

1. Revisar este archivo, `AGENTS.md`, `STYLE.md` y `git status --short --branch`.
2. Confirmar el push de `codex/bank-audit` y que las migraciones Bank estén aplicadas en Supabase.
3. Revisar el selector de competición/equipos que aparece como cambio local en Bank; decidir alcance, incorporar pruebas y publicarlo solo después de validar.
4. Mantener la lógica de Bank por usuario autenticado y no incluir cambios locales de perfil/contraseña/metadata sin revisar su relación con la tarea.
5. Al cambiar arquitectura, actualizar Graphify y Archify desde commits publicados, y sincronizar este handoff.
