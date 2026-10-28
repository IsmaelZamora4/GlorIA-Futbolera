# GlorIA Futbolera

Aplicación web de análisis estadístico prepartido de fútbol. Permite explorar partidos, seleccionar un encuentro y consultar cinco mercados estadísticos usando datasets locales.

Proyecto de portafolio: reproducible, sin cuentas, sin API keys y sin infraestructura de pago.

## Demo local

Requisitos: Node.js compatible con Next.js 16.

```powershell
npm install
npm run dev
```

Abrir `http://localhost:3000`.

Comprobación de producción:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

El build usa Webpack porque el proceso Turbopack del entorno fallaba al procesar CSS.

## Funcionalidad

Flujo principal:

1. Abrir el dashboard.
2. Elegir competición.
3. Elegir fecha.
4. Cargar partidos del dataset local.
5. Seleccionar un partido.
6. Consultar el análisis.
7. Revisar fuente, muestra, metodología y cobertura.

Mercados:

- Resultado 1X2.
- Goles.
- Ambos equipos marcan (BTTS).
- Córners.
- Tiros a puerta.

Los datos ausentes aparecen como `Sin dato` o `Mercado no disponible`. Nunca se convierten en cero.

## Datasets y cobertura

Datasets procesados en `data/processed/`:

- Bundesliga.
- LaLiga.
- Ligue 1.
- Premier League.
- Serie A.

Cada liga contiene cinco temporadas históricas, de `2021/2022` a `2025/2026`, y una temporada actual procesada `2026/2027`.

Análisis disponible: las cinco ligas anteriores.

Liga 1 de Perú, Champions League y Europa League aparecen en el catálogo, pero no tienen dataset analítico local. La interfaz no promete análisis para esas competiciones.

La procedencia y cobertura de cada dataset están definidas en `data/datasets.ts`. El pipeline y las reglas de actualización están documentados en `docs/historical-data.md`.

## Metodología estadística

El modelo usa datos terminados anteriores al partido consultado.

- 1X2: expectativas de goles local/visitante y distribución de Poisson independiente para estimar victoria local, empate y victoria visitante.
- Goles: suma de goles esperados y líneas Poisson de `+1.5`, `+2.5` y `+3.5`.
- BTTS: probabilidad de que ambos equipos marquen al menos un gol.
- Córners: expectativas por condición local/visitante y líneas Poisson.
- Tiros a puerta: expectativas por condición local/visitante y líneas Poisson.

Las muestras pequeñas usan suavizado con la media de liga. La temporada actual tiene peso limitado. La calibración walk-forward se aplica a las métricas configuradas y evita utilizar resultados posteriores al fixture.

Detalles y fórmulas: `docs/historical-data.md`.

## Decisiones técnicas

- Next.js App Router, React y TypeScript.
- JSON procesado localmente; no se requiere base de datos.
- Rutas server-side para leer datasets sin exponer archivos innecesarios al cliente.
- Lógica estadística separada de los componentes visuales.
- Caché local del navegador solo para evitar repetir lecturas durante la sesión.
- Sin llamadas automáticas a APIs externas.
- Estados explícitos para carga, error, vacío, demo, insuficiencia y ausencia de análisis.
- `next build --webpack` para un build reproducible en este entorno.

## Limitaciones

- No es una predicción garantizada ni una recomendación de apuestas.
- No incorpora lesiones, alineaciones, clima ni cambios recientes de plantel.
- La cobertura depende de los campos presentes en cada dataset.
- Tres competiciones del catálogo no tienen análisis local.
- La temporada actual es una muestra parcial y puede cambiar al regenerar los datos.
- La validación visual en navegador debe repetirse en cada entorno de presentación.

## Datos y actualización

Los CSV de entrada viven en `data/raw/`. No editar manualmente los JSON derivados.

```powershell
npm run normalize:data
npm run validate:data
npm run validate:teams
npm run backtest
npm test
```

El pipeline no consume APIs. Las pruebas comprueban coherencia matemática, aliases, cobertura estadística y corte temporal prepartido.

## Capturas y presentación

La demo se presenta ejecutando el proyecto localmente con `npm run dev`.

Capturas recomendadas para el portafolio:

1. Dashboard con lista de partidos y selector de competición.
2. Panel de análisis con los cinco mercados.
3. Vista de detalle con metodología, muestra y limitaciones.
4. Estado de competición sin dataset analítico.

No se incluyen capturas generadas automáticamente en el repositorio; deben tomarse después de la validación visual final del entorno de presentación.

## Estado del proyecto

MVP local de portafolio en desarrollo. El modelo, datasets, pruebas, build y documentación base están implementados. La validación visual completa en escritorio, tablet y móvil sigue siendo el último control manual.
