# Plan: páginas 404 pública y autenticada

## Objetivo

Mostrar un estado 404 claro y coherente con GlorIA Futbolera tanto para rutas públicas inexistentes como para direcciones inexistentes dentro de `/home/`. La variante de `/home/` conserva el control de autenticación y la navegación lateral de la referencia del usuario.

## Decisiones

- Usar `app/not-found.tsx` para las rutas públicas/globales, dentro del layout raíz existente.
- Componer la 404 pública con `LandingHeader` y `LandingFooter` existentes, manteniendo sus enlaces y estilos de marca.
- Usar `app/(account)/home/not-found.tsx` para el estado 404 de `/home/*` y un catch-all que invoque `notFound()` para rutas anidadas inexistentes.
- Reutilizar `public/wallpapers/404-wallpaper.png` como fondo con oscurecimiento suficiente para mantener contraste.
- Mantener links de retorno claros: página pública (`/`) y home autenticado (`/home`).
- Mantener el trabajo aislado en estos archivos; no modificar el plan abierto de Auth/Bank.

## Tareas y aceptación

1. **Pruebas primero.** Añadir pruebas unitarias que comprueben la presencia de las convenciones de rutas, del catch-all, del recurso de fondo y de elementos esenciales accesibles en ambas pantallas.
2. **404 pública.** Implementar fondo, jerarquía visual, descripción y enlaces para regresar al inicio o al historial.
3. **404 autenticada.** Añadir catch-all solo bajo `/home/`, activar `notFound()` para conservar el status 404 y renderizar el mensaje junto a `SportiaSidebar` dentro de `HomeLayout`.
4. **Auditoría.** Revisar diff y validar tests, lint, tipos, build y respuestas de ruta si la configuración local permite levantar la app.

## Criterios de aceptación

- Una URL pública desconocida renderiza la experiencia pública y devuelve HTTP 404.
- `/home/<segmento-inexistente>` se resuelve dentro de la protección de sesión; autenticado ve el shell de home y 404, anónimo sigue el flujo de login.
- Ambos estados usan el wallpaper existente, tienen encabezado semántico, enlace de regreso y diseño usable en móvil.
- La 404 pública reutiliza el header/footer reales y reproduce el degradado inferior del header y el superior del footer de la referencia.
- Pruebas unitarias, typecheck, lint y build pasan; revisión independiente no encuentra defectos bloqueantes.

## Riesgos

- La 404 de ruta global no hereda el layout de `(account)`; por eso el contexto autenticado se limita a rutas descendientes de `/home/` con catch-all local.
- El sidebar actual se oculta en pantallas pequeñas; la variante móvil debe conservar contenido y enlaces sin intentar forzar el sidebar de escritorio.
