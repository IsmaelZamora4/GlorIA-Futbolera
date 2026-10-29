# Plan: conectar el nuevo home con partidos y datasets

## Objetivo

Conectar `/home` con la agenda real y los análisis históricos disponibles, conservando su composición, tipografía, paleta morada, espaciado, controles y comportamiento responsive. Reutilizar los endpoints y reglas actuales; no mostrar marcadores en vivo, resultados ficticios ni mercados inventados. La integración de noticias queda fuera de este plan.

## Estado actual

| Área | Situación | Implicación |
| --- | --- | --- |
| `/home` | Partidos, fechas, cuentas de ejemplo y artículos están hardcodeados. | Sustituir el contenido de fútbol; conservar la estructura visual. |
| Agenda actual | `/api/local-fixtures` consulta proveedores actuales para las competiciones configuradas. | Champions puede tener fixtures actuales aunque no tenga dataset analítico. |
| Liga 1 | Está en el catálogo de API-Football, pero el endpoint existente limita ese proveedor a las temporadas 2022–2024. No hay fuente actual configurada para 2026. | No prometer agenda de temporada actual hasta confirmar una fuente disponible. Presentar indisponibilidad con claridad. |
| Datasets históricos | Disponibles para Serie A, LaLiga, Ligue 1, Bundesliga y Premier League. | Solo estas cinco pueden ofrecer el análisis histórico actual. |
| Detalle de partido | `lib/match-detail.ts` y los modelos locales cubren esas mismas cinco ligas. | Para Champions y Liga 1, enlazar a partidos filtrados o informar que aún no hay detalle histórico. |
| Otras fuentes | `/api/football-data/fixtures` sirve fixtures actuales de competiciones admitidas; `/api/fixtures` usa API-Football para temporadas históricas del plan Free. | Mantener claves en el servidor y respetar límites/caché existentes. |

## Decisiones de implementación

- `/home` consumirá las fuentes existentes; no habrá fetch directo del navegador a proveedores externos.
- Separar disponibilidad de agenda actual y disponibilidad de análisis histórico. Tener uno no implica tener el otro.
- Reusar el catálogo de `data/demo-matches.ts` y los nombres de competición existentes; evitar mantener listas de competiciones divergentes.
- `/home` muestra solo partidos de hoy en hora de Lima. No incluye selector de fecha; permanece en `/partidos`.
- La barra lateral filtra Today Match por competición. Repetir clic quita el filtro; en móvil hay controles equivalentes dentro de la tarjeta.
- Las filas muestran equipos, escudos, hora y sede si la fuente los devuelve.
- El bloque «Live Matches» se convierte en partido recomendado real seleccionado, sin marcador ni etiqueta de directo. El bloque de noticias sigue como estado «Próximamente» hasta elegir proveedor.
- Los estados sin partidos, sin fuente, cargando y error conservarán el diseño del home y explicarán qué ocurre.
- Cambiar competición o selección solo cambia datos y estado. No cambiar tipografía, colores, tamaños, layout ni animaciones salvo el ajuste mínimo que exijan nombres reales largos.
- Mantener `/` sin cambios hasta validar paridad funcional de `/home`. El cambio de ruta canónica será el último paso.

## Tareas

### Fase 1: contrato de cobertura y fuente

**Aceptación:** matriz verificable por competición para fixtures actuales, fixtures históricos, dataset analítico y detalle; ninguna liga se presenta con capacidades que no tiene.

**Archivos probables:** `lib/football-data.ts`, `lib/football.ts`, `data/datasets.ts`, `app/api/local-fixtures/route.ts`.

**Dependencias:** ninguna.

### Fase 2: normalización de datos

**Trabajo:** permitir consultar fixtures actuales de Champions League independientemente de que falte dataset histórico; conservar análisis solo donde exista. Unificar la conversión de fixtures a un modelo compartido entre `/` y `/home` donde quite duplicación. Para Liga 1 actual, no activar una fuente de pago ni asumir cobertura: mantener estado no disponible mientras no haya fuente compatible.

**Aceptación:** contrato de respuesta distingue fuente, fecha, disponibilidad de análisis y errores; la API key nunca llega al cliente; la caché mantiene los TTL actuales.

**Verificación:** fixtures próximos, fecha histórica, competencia sin dataset, API sin clave y error del proveedor.

**Dependencias:** Fase 1.

### Fase 3: agenda real en `/home`

**Trabajo:** sustituir las listas de ejemplo por partidos reales de hoy; conectar el filtro de competición del sidebar, grupos plegables, selección y navegación a detalle. No añadir selector de fecha en `/home`; mantiene la lista de siete competiciones.

**Aceptación:** `/home` siempre consulta el día de Lima; filtrar una competición actualiza Today Match; seleccionar un partido actualiza la tarjeta lateral; no aparece ningún marcador; las fuentes fallidas no ocultan resultados de otras competiciones.

**Verificación:** filtrar una y todas las competiciones, plegar grupos, seleccionar fixture y abrir enlaces.

**Dependencias:** Fase 2.

### Fase 4: integración del análisis histórico

**Trabajo:** indicar en cada partido si cuenta con dataset local; abrir el detalle existente para las cinco ligas compatibles. Para Champions y Liga 1, mostrar el estado de cobertura limitado y mantener navegación a la agenda filtrada.

**Aceptación:** ningún fixture recibe probabilidades o métricas sin análisis calculado; los datos históricos y las rutas de detalle coinciden con el catálogo real.

**Verificación:** un fixture de cada una de las cinco ligas con dataset, uno de Champions y un caso sin fuente para Liga 1.

**Dependencias:** Fases 2 y 3.

### Checkpoint visual y funcional

- `npm run typecheck`, `npm run lint` y `npm run build` pasan.
- Playwright comprueba `/home` en escritorio y móvil; cero desbordamiento horizontal o errores de consola.
- Comparación visual confirma que paleta, tipografía, composición y espaciado del home siguen iguales.
- `/`, `/partidos` y los detalles de partido siguen funcionando.

### Fase 5: entrada pública

Solo después del checkpoint y revisión visual: decidir si `/` debe mostrar el nuevo home y dejar `/home` como alias o ruta secundaria. Mantener una vuelta atrás simple al home existente hasta validar el cambio.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Liga 1 sin fixture actual gratuito configurado | No inventar agenda; mostrar estado claro y dejar fuente como tarea independiente. |
| Dataset histórico tratado como fixture actual | Separar ambos estados y limitar cada dato a su fecha/fuente. |
| Doble consulta de proveedores | Reusar endpoints actuales y respetar cachés/concurrencia. |
| Reemplazar datos reduce altura o cambia el diseño | Conservar componentes y estilos; validar en breakpoints antes de ajustar CSS. |
| Cambiar `/` demasiado pronto | Hacer el cutover únicamente tras revisión en `/home`. |

## Fuera de alcance

- Integrar API de noticias.
- Cambiar login, perfil o datos del bank.
- Rediseñar el home o modificar las rutas distintas de la navegación necesaria.
