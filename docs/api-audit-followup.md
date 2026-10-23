# Seguimiento de auditoría de API-Football

- Fecha de ejecución: 2026-10-22T10:27:05.563Z
- Límite duro: 6 solicitudes nuevas
- Clave: no se muestra ni se registra

## Plan ejecutado

- 1. Consultar /fixtures para Liga 1 de Perú (league=286, season=2024, status=FT, page=1).
- 2. Si hay un fixture finalizado, consultar /fixtures/statistics una sola vez.
- 3. Solo si Perú no devuelve error de plan y quedan llamadas, repetir para Serie A (league=135).
- 4. Límite estructural: 2 competiciones × (1 fixtures + 1 statistics) = 4 llamadas; máximo permitido 6.

## Resultado

**No se realizaron solicitudes.** Falta `API_FOOTBALL_KEY` en el entorno y no se encontró `.env.local`.

Añade la clave localmente y ejecuta `node scripts/api-football-audit.mjs`.
