# Tareas: conexión de datos del nuevo home

## Completado

- [x] `/home` solicita fixtures del día local de Lima; no permite cambiar fecha.
- [x] La barra lateral filtra Today Match por competición; repetir clic restaura todas.
- [x] En móvil, filtro de competiciones disponible en la tarjeta de partidos.
- [x] Conectar hora, equipos, escudos y sede cuando la fuente los devuelve.
- [x] Reemplazar el bloque «Live Matches» por partido recomendado sin marcador.
- [x] Permitir abrir el análisis local para Serie A, LaLiga, Ligue 1, Bundesliga y Premier League.
- [x] Servir fixtures de Champions aunque no exista dataset analítico.
- [x] Comunicar indisponibilidad de fixtures actuales para Liga 1; no fabricar partidos.
- [x] Mantener `/partidos` como única página con selector de fechas.

## Verificado

- [x] `npm run typecheck`, `npm run lint` y `npm run build`.
- [x] Validar `/home` y endpoints para Champions League y Liga 1.
- [x] Comprobar filtro, selección, enlace a análisis y responsive en Playwright.
- [x] Confirmar `/partidos`, `/` y el detalle del dataset desde `/home`.
- [x] Revisar escritorio y móvil; sin desbordamiento horizontal ni errores de consola.

## Decisión posterior

- [ ] Cambiar la ruta pública `/` para que muestre `/home`; requiere decidir cutover.
