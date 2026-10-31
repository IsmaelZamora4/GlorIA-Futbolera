# Contexto de GlorIA Futbolera

Documento de continuidad para futuras conversaciones de desarrollo.

## Proyecto y reglas

- Repositorio: `IsmaelZamora4/GlorIA-Futbolera`.
- Aplicación Next.js App Router con React y TypeScript; autenticación y persistencia conectadas a Supabase.
- Antes de editar código Next.js, leer la guía correspondiente en `node_modules/next/dist/docs/`. El `AGENTS.md` del repositorio indica que esta versión puede tener cambios incompatibles con versiones anteriores.
- `next-env.d.ts` es generado por Next.js; no editarlo a mano.
- Mantener los cambios locales que no formen parte de la tarea y revisar `git status` antes de añadir archivos.

## Navegación autenticada

Las secciones de la aplicación viven bajo `/home`; el grupo `(account)` solo organiza los archivos y no forma parte de la URL.

| Sección | URL canónica |
| --- | --- |
| Inicio | `/home` |
| Partidos | `/home/partidos` |
| Competiciones | `/home/competiciones` |
| Posiciones | `/home/posiciones` |
| Detalle de partido | `/home/partido/[competition]` |
| Mi Bank | `/home/bank` |
| Datos | `/home/datos` |
| Configuración | `/home/configuración` |
| Metodología | `/home/metodología` |

El layout `app/(account)/home/layout.tsx` requiere una sesión y comparte el perfil de usuario. `next.config.ts` mantiene redirecciones temporales desde rutas previas como `/partidos`, `/competiciones`, `/bank`, `/configuracion` y `/metodologia`; también normaliza las variantes sin tilde de Configuración y Metodología. Al añadir enlaces internos, usar las rutas canónicas `/home/...`.

## Páginas 404

- 404 pública: `app/not-found.tsx`.
- 404 dentro de la cuenta: `app/(account)/home/not-found.tsx`; el catch-all `app/(account)/home/[...slug]/page.tsx` envía rutas desconocidas de esa zona a `notFound()`.
- Presentación compartida: `features/not-found/components/NotFoundContent.tsx` y `NotFoundContent.module.css`.
- Wallpaper: `public/wallpapers/404-wallpaper.png`.
- La 404 pública reutiliza el header y footer de la página principal. La versión autenticada presenta el contenido dentro del shell de `/home`.

## Estado y verificaciones de la tarea reciente

- Se reubicaron páginas privadas bajo `app/(account)/home/` y se actualizaron enlaces internos para apuntar a `/home/...`.
- Se creó `/home/datos` con información de cobertura de datos.
- Se conservaron las redirecciones para las rutas antiguas.
- `npx next typegen` y `npm run typecheck` pasaron después de retirar tipos obsoletos de `.next/types/app/(account)/`; la limpieza afectó solo artefactos generados.
- `graphify update . --force` terminó con código 0 e informó que no había cambios de topología. El grafo actual ya contiene las páginas bajo `app/(account)/home/`.
- No se ejecutó la suite de pruebas unitarias en esta tarea.
- El diagrama Archify previo tenía referencias a ubicaciones antiguas y debe quedar ligado a la revisión publicada que contiene los cambios de rutas.

## Archivos locales que requieren revisión antes de incluirlos

En el árbol de trabajo había artefactos no seguidos de revisiones previas bajo `.archify/architecture-gloria-futbolera-20261030-153631/review-{3,4,5,7}/` y `public/teams/paderborn.svg`. No forman parte automáticamente de esta tarea; comprobar si se usan antes de agregarlos o borrarlos.

## Continuación

1. Verificar el estado de Git y conservar los cambios de páginas 404 y navegación que ya están en curso.
2. Actualizar y validar el diagrama Archify con evidencia y rutas de archivos actuales.
3. Revisar `context.md`, el grafo, el diagrama y el diff antes de completar el envío a GitHub.
