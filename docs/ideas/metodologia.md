# Página de metodología

## Problema

Quienes consultan GlorIA pueden ver probabilidades y métricas, pero necesitan entender de qué competiciones y temporadas vienen los datos, cómo se construyen las estimaciones y qué límites tienen.

## Dirección recomendada

Crear una página pública y legible para aficionados con interés estadístico. Presentar primero la cobertura y las fuentes; después explicar el flujo general del análisis y, por último, la confianza y las limitaciones. Separar explícitamente las competiciones con análisis histórico local de aquellas donde la web solo ofrece agenda u otros datos.

## Supuestos por validar

- Inventario local comprobado en metadata generada el 27/10/2026: cinco temporadas históricas (2021/22–2025/26) y datos parciales de 2026/27. Partidos históricos por liga: Bundesliga 1.530; LaLiga 1.900; Ligue 1 1.678; Premier League 1.900; Serie A 1.900. Partidos actuales disponibles: 63, 99, 72, 80 y 80, respectivamente. Las validaciones de calidad pasan en las cinco. Validar de nuevo al implementar, porque la temporada actual cambia.
- El origen editorial de los CSV históricos no está documentado en el repositorio. No atribuirlos a un proveedor basándose solo en el formato del CSV.
- README indica football-data.org para fixtures actuales y futuros de las cinco ligas analíticas. El catálogo también usa TheSportsDB para algunas competiciones; distinguir esas fuentes de los CSV históricos locales.
- Las rutas activas consultan `getLocalLeagueAnalysis` para las cinco ligas analíticas. `lib/premier-league-analysis.ts` no aparece referenciado por las rutas o componentes actuales; queda fuera del alcance de esta explicación.
- Los CSV históricos no contienen xG (HxG/AxG). Los "goles esperados" de la interfaz son una estimación del modelo derivada de goles históricos, no xG medido por el proveedor.
- La página debe explicar estimaciones estadísticas, no presentarlas como resultados seguros ni como recomendaciones de apuesta.

## Alcance inicial

1. Tabla de cobertura por competición: temporadas, mercados disponibles, fuente y tipo de dato (análisis local, fixture o tabla).
2. Explicación visual breve: historial de local/visitante y resultados actuales anteriores al encuentro → métricas esperadas → probabilidades. Describir suavizado de muestras pequeñas, peso limitado de la temporada en curso y aproximación de Poisson a nivel divulgativo.
3. Explicación de los mercados visibles: 1X2, goles, ambos anotan, córneres y tiros a puerta.
4. Aclaración sobre muestra: indicar cuándo hay pocos partidos y cuándo se usa una referencia promedio de liga.
5. Sección de límites: variabilidad, cobertura desigual, actualización de datos y ausencia de garantía predictiva.

## No incluir todavía

- Simulador interactivo de probabilidades.
- Fórmulas largas y detalle de implementación que distraigan de la lectura principal.
- Métricas de precisión o rendimiento sin un backtest documentado y explicado.

## Criterio de éxito

Al terminar la página, una persona puede identificar qué cobertura existe para cada competición, de dónde proceden sus datos y cómo interpretar una estimación sin confundirla con una certeza.

## Próximos pasos antes de implementar

- Identificar y documentar la procedencia original de los CSV históricos, si está disponible.
- Revalidar la cobertura al implementar y mostrar la procedencia con precisión: la fuente original de los CSV no está registrada; fixtures actuales de las cinco ligas analíticas vienen de football-data.org.
