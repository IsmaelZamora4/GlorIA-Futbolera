# Plan: Página de metodología

## Objetivo

Crear `/metodologia` para que aficionados con interés estadístico entiendan la cobertura de GlorIA, el flujo general de sus análisis y las limitaciones de las estimaciones.

## Decisiones

- Mostrar primero cobertura y fuentes; después explicar el proceso y sus límites.
- Separar competiciones con modelo histórico local de las que solo ofrecen fixtures o tablas.
- Describir el flujo compartido que usan las cinco ligas analíticas y no confundir "goles esperados" con xG observado.
- No publicar precisión predictiva ni pesos exactos sin validación documentada.

## Tareas

1. Verificar temporadas, fuentes y mercados frente a los archivos de datos reales.
2. Documentar el flujo de cálculo común y las diferencias entre modelos por competición.
3. Implementar la página responsive y actualizar los enlaces de navegación.
4. Verificar contenido, navegación, consola y diseño en escritorio y móvil con Playwright CLI.

## Dependencias y checkpoints

- Tarea 2 usa el inventario de cobertura de Tarea 1, ya contrastado; la procedencia original de los CSV sigue abierta.
- Tarea 3 depende de los hechos y explicaciones acordados en Tareas 1 y 2.
- **Checkpoint de contenido:** revisar la matriz de cobertura y las afirmaciones sobre modelos antes de maquetar.
- **Checkpoint final:** todos los enlaces llegan a `/metodologia`; contenido y recursos cargan sin errores; no hay desbordamiento horizontal en escritorio ni móvil.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La configuración anuncia temporadas que no están completas en los archivos | Contrastar metadatos con fechas y registros reales antes de mostrar la cobertura. |
| El origen original de los CSV no está registrado | Identificarlos como CSV históricos locales normalizados y no inventar un proveedor. |
| "Goles esperados" se interpreta como xG del proveedor | Aclarar que es una estimación del modelo; los CSV históricos no contienen HxG/AxG. |
| La página presenta probabilidades como certezas | Incluir muestra, confianza, límites y una aclaración explícita. |

## Fuera de alcance

Simulador interactivo, fórmulas exactas no auditadas y métricas de precisión sin backtest explicado.
