# Tareas: páginas 404

- [x] Añadir pruebas unitarias del contenido, variantes, enlaces y wallpaper.
- [x] Implementar 404 global para rutas públicas desconocidas.
- [x] Integrar header y footer públicos reales con sus degradados sobre el wallpaper.
- [x] Implementar 404 bajo `/home/*` con `notFound()` y navegación lateral.
- [x] Verificar `npm test` (30/30), `npm run typecheck`, lint enfocado y rutas HTTP.
- [x] Revisar el diff con agentes de rutas y de calidad; resolver el hallazgo de cobertura.

## Verificación pendiente / límites

- `npm run build` no se ejecutó porque hay un servidor Next activo en el puerto 3000 usando el `.next` compartido; construir sobre ese directorio puede interrumpir su sesión.
- El lint global ya reporta un error ajeno a este cambio en `features/home/components/LandingMatchPreview.tsx:43`; el lint de todos los archivos modificados pasó.
