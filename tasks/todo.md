# Tareas: Página de metodología

## Fase 1: Veracidad de los datos

- [x] **1. Validar cobertura.** Contrastar competiciones, temporadas, campos/mercados y fuentes declaradas con los archivos reales procesados y las fuentes de fixtures.
  - Aceptación: tabla factual por competición que marca por separado datos históricos, temporada actual, fixtures y tablas; las faltas o temporadas parciales quedan indicadas.
  - Verificación: revisar metadatos, encabezados y rangos de fecha de los archivos; no inferir cobertura de nombres de carpetas.
  - Dependencias: ninguna.
  - Hallazgo preliminar (metadata al 27/10/2026): hay cinco temporadas históricas (2021/22–2025/26) y datos parciales de 2026/27 en las cinco ligas analíticas. Filas históricas: Bundesliga 1.530; LaLiga 1.900; Ligue 1 1.678; Premier League 1.900; Serie A 1.900. Filas 2026/27: 63, 99, 72, 80 y 80. Las validaciones de calidad están en estado `passed` para las cinco.
  - Fuentes de fixtures en README/catálogo: football-data.org para las cinco ligas analíticas; el catálogo asigna football-data.org a Champions League y TheSportsDB a Liga 1 y Europa League. El proveedor original de los CSV históricos no está registrado; no atribuirlo por el formato.
  - Los cinco reportes tienen cero columnas requeridas ausentes. Los CSV sí incluyen goles, tiros a puerta y córneres usados por los mercados; HxG/AxG faltan en todos los históricos, así que "goles esperados" debe describirse como salida estimada del modelo, no como xG observado. Se mostrará como origen histórico "CSV local normalizado" y se indicará que no hay proveedor original registrado.

- [x] **2. Precisar la explicación del modelo.** Comparar las rutas de cálculo por competición y redactar qué datos y métodos puede explicar la página con seguridad.
  - Aceptación: se separan los pasos comunes de las diferencias por competición; quedan explicados muestra insuficiente, promedio de liga, métricas esperadas, probabilidades y límites sin promesas no respaldadas.
  - Verificación: contrastar cada afirmación con los módulos de análisis y el backtest disponible; registrar lo que no se puede afirmar.
  - Dependencias: inventario de cobertura de Tarea 1.
  - Resultado: las rutas activas llaman `getLocalLeagueAnalysis` en `lib/league-analysis.ts` para las cinco ligas. `lib/premier-league-analysis.ts` no tiene referencias desde app/components/lib; tratarlo como código no conectado, no como modelo activo. El análisis común usa cinco temporadas históricas, datos de temporada actual anteriores al fixture, suavizado con ocho observaciones de media de liga, peso actual limitado a 35% y distribuciones Poisson; la calibración se aplica a mercados específicos según `docs/historical-data.md`.

## Checkpoint: Contenido

- [x] Revisar cobertura y explicaciones antes de empezar la interfaz.

## Fase 2: Página

- [x] **3. Implementar `/metodologia`.** Crear la página siguiendo el diseño del sitio y enlazarla desde el menú y desde Configuración.
  - Aceptación: tabla/resumen de cobertura, proceso de análisis, guía de métricas y limitaciones; las ligas sin modelo local no se presentan como si lo tuvieran.
  - Verificación: abrir la ruta directamente y usar ambos enlaces de navegación.
  - Dependencias: Tareas 1 y 2.

- [x] **4. Revisar en navegador.** Validar escritorio y móvil con Playwright CLI.
  - Aceptación: carga correcta, navegación funcional, sin errores de consola/recursos ni overflow horizontal; textos y datos corresponden a la auditoría.
  - Verificación: recorrer la página a ambos anchos y comprobar enlaces, tabla y estados informativos.
  - Dependencias: Tarea 3.

## Checkpoint final

- [x] Todas las afirmaciones de cobertura tienen respaldo en los archivos.
- [x] La página explica límites y muestra claramente qué competiciones sí tienen análisis histórico local.
- [x] Verificación de escritorio y móvil completada.
