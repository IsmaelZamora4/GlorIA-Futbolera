# Auditoría de API-Football

- Fecha de ejecución: 2026-10-22T10:24:07.389Z
- Límite duro configurado: 20 solicitudes
- Clave: no se muestra ni se registra

## Resultado observado

- Solicitudes realizadas: **20/20**
- Estadísticas de jugadores: no consultadas; no son necesarias para los mercados definidos.

## Ligas y temporadas

| Competición | ID probado | HTTP | Temporadas devueltas | Error |
|---|---:|---:|---|---|
| Liga 1 de Perú | 286 | 200 | 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| Serie A de Italia | 135 | 200 | 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| LaLiga de España | 140 | 200 | 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| Ligue 1 de Francia | 61 | 200 | 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| Bundesliga de Alemania | 78 | 200 | 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| Premier League de Inglaterra | 39 | 200 | 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| UEFA Champions League | 2 | 200 | 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |
| UEFA Europa League | 3 | 200 | 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026 | [] |

## Muestras de partidos finalizados

| Competición | Temporada | Partido | Fecha | Estado | Goles | HTTP | Error |
|---|---:|---|---|---|---|---:|---|
| Liga 1 de Perú | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| Serie A de Italia | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| LaLiga de España | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| Ligue 1 de Francia | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| Bundesliga de Alemania | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| Premier League de Inglaterra | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| UEFA Champions League | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |
| UEFA Europa League | 2026 |  | — | — | — | 200 | {"plan":"Free plans do not have access to this season, try from 2022 to 2024."} |

## Estadísticas de partido

No se consultaron estadísticas de partido porque el límite de 20 llamadas ya se consumió. La respuesta se resume sin incluir la clave.

| Competición | Fixture | HTTP | Equipos con estadísticas | Campos observados | Error |
|---|---:|---:|---:|---|---|

No se pudieron consultar estadísticas: las 20 llamadas del límite se consumieron validando ligas, temporadas y permisos de fixtures.

## Hallazgo adicional del plan gratuito

Se intentó una muestra de 2024 para cuatro competiciones. API-Football respondió HTTP 200 con el error `Free plans do not have access to the Last parameter` porque el diagnóstico inicial usaba `last=5`. Esto distingue HTTP exitoso de consulta autorizada. No se puede afirmar todavía que los partidos ni sus estadísticas estén disponibles para 2024.

## Interpretación

- `missing`: el campo o respuesta no fue devuelto.
- `null`: el proveedor devolvió explícitamente `null`.
- `zero`: el proveedor devolvió el número cero; no debe confundirse con ausencia.
- `error`: fallo HTTP, de red o error informado por la API.
- Los goles se obtienen de `fixtures.goals`; córneres y tiros a puerta dependen de `fixtures/statistics` y de que el proveedor los haya informado para ese partido.
- La respuesta de `/leagues` enumera temporadas, pero no garantiza que el plan pueda consultar fixtures de esas temporadas.
- El plan gratuito rechazó 2026 y también rechazó el parámetro `last`; la siguiente prueba debe usar `page=1` o un intervalo de fechas pequeño.

## Recomendaciones

- Cachear respuestas de ligas/temporadas por competición y temporada.
- Cachear fixtures finalizados permanentemente o con TTL largo; no recalcular partidos históricos.
- Cachear estadísticas de partido por `fixtureId`; reintentar solo errores transitorios y respetar la cuota.
- Antes de construir predicciones, medir por competición y temporada la proporción de campos `null`, ausentes y cero.
