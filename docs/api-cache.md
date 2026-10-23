# Caché API-Football

`GET /api/fixtures?date=YYYY-MM-DD&league=<id>` consulta una competición del proyecto.

- Cada consulta de fixtures consume como máximo 1 petición: una competición y una fecha. No se hacen consultas adicionales por estadio o equipo.
- El plan Free actual solo permite temporadas 2022, 2023 y 2024; la ruta rechaza otros años antes de contactar API-Football.
- Next.js y el servidor conservan cada respuesta durante 6 horas. Home también la guarda en el navegador, por lo que una recarga reutiliza los fixtures ya descargados.
- Al seleccionar todas las ligas, Home consulta las fuentes de forma secuencial; no lanza ráfagas paralelas que puedan superar el límite Free.
- La clave vive en `.env.local` como `API_FOOTBALL_KEY`; no llega al navegador.
- La respuesta de cada fixture incluye `teams.home.logo` y `teams.away.logo`. Guárdalas como `/teams/<teamId>.png` al preparar el catálogo o al sincronizar fixtures.

Para los seis equipos demo, ejecuta una vez:

```powershell
npm run cache:logos
```

Las imágenes se descargan desde el CDN de API-Sports y se sirven localmente. No uses esta tarea en cada deploy o cada render.
