# Datos históricos locales

Los CSV completos viven en `data/raw/<competición>/`. El script de normalización genera archivos derivados en `data/processed/`, que no se editan manualmente.

Para Premier League:

```powershell
npm run normalize:premier
```

La temporada en curso debe mantenerse en un CSV independiente con el mismo esquema y actualizarse manualmente desde una fuente permitida. No se mezcla como temporada completa: se usa para forma reciente y se vuelve a normalizar cada vez que se añadan partidos finalizados.

El proceso genera cuatro archivos: partidos normalizados, resumen de la competición, estadísticas por equipo/temporada y variables pre-partido. Las variables pre-partido se calculan antes de aplicar los resultados de cada fecha, para evitar usar información futura en un backtest.

Los porcentajes históricos describen tendencias. No garantizan resultados ni sustituyen información actual como lesiones, alineaciones o cambios de plantel.

## Mercados del MVP

Los cinco mercados usan únicamente partidos terminados del dataset y el corte temporal anterior al fixture.

- **1X2:** medias suavizadas de ataque/defensa local y visitante; distribución de Poisson independiente para goles; suma de probabilidades de marcadores 0–9 y normalización a 100%.
- **Goles:** suma de goles esperados local y visitante; líneas `+1.5`, `+2.5` y `+3.5` calculadas como cola superior de Poisson. `+2.5` usa calibración walk-forward.
- **BTTS:** `(1 - e^-λ_local) × (1 - e^-λ_visitante)`, donde cada λ es el gol esperado; la probabilidad negativa es `100% - Sí`.
- **Córners:** expectativa por ataque/defensa y condición local/visitante; líneas `+5.5` a `+12.5` mediante Poisson. `+8.5` usa calibración walk-forward.
- **Tiros a puerta:** expectativa por ataque/defensa y condición local/visitante; líneas por equipo `+2.5` y total `+7.5` mediante Poisson. `+7.5` usa calibración walk-forward.

La muestra visible en cada análisis incluye partidos históricos del equipo en su condición y partidos de temporada actual terminados antes del fixture. La temporada actual pesa como máximo 35%; las muestras pequeñas reciben suavizado con ocho observaciones de media de liga.

Si una competición no tiene dataset local o una métrica no tiene observaciones válidas, la interfaz muestra `Sin dato` o `Mercado no disponible`. No convierte ausencia en cero ni fabrica una proyección.

## Validación del modelo

Después de actualizar un CSV, ejecuta el pipeline local completo:

```powershell
npm run normalize:data
npm run validate:data
npm run validate:teams
npm run backtest
npm test
```

El backtest y las pruebas no hacen llamadas a APIs. El primero actualiza el reporte y el modelo de calibración en `data/processed/`; el segundo comprueba que no haya fuga temporal, que 1X2 sume 100%, que las líneas de goles sean coherentes y que la calibración sea monótona.

## Rutina semanal

Descarga el CSV actualizado de una fuente permitida fuera de este repositorio. Después ejecuta un solo comando por competición:

```powershell
npm run refresh:current -- --league premier-league --file "C:\Users\USUARIO\Downloads\premier-actualizada.csv"
```

Ligas aceptadas: `premier-league`, `serie-a`, `la-liga`, `ligue-1` y `bundesliga`.

La rutina valida el CSV antes de modificar datos, guarda la versión anterior en `data/raw/<liga>/archive/`, reemplaza solo el CSV de la temporada actual y ejecuta normalización, validaciones, backtest, calibración y pruebas. Si una etapa falla, restaura automáticamente el CSV anterior. No consume API. Para comprobar la entrada sin cambiar nada, añade `--dry-run` al final.
