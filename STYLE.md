# GlorIA Futbolera — guía de estilo

Esta guía es el contrato visual del producto. Antes de crear o rediseñar una pantalla, identifica si pertenece al sitio público o al área autenticada y aplica el sistema correspondiente. No inventes una tercera identidad visual para una nueva sección.

## Referencias y alcance

- **Sitio público:** `http://localhost:3000/`. Se inspeccionó la página renderizada y sus estilos. La referencia visual es la landing de fútbol con acento violeta, el wallpaper del hero, la vista previa del producto y superficies oscuras.
- **Área autenticada:** `http://localhost:3000/home`. La ruta exige sesión y, durante esta revisión, redirigió a `/login?next=%2Fhome`; por eso su sistema se contrastó con el código real de `app/(account)/home/page.tsx`, `components/layout/SportiaSidebar.tsx`, `components/layout/SportiaPageHeader.tsx` y `app/globals.css`.
- La landing y el dashboard comparten la marca y la familia tipográfica, pero cumplen trabajos distintos. Una pantalla autenticada no debe copiar el hero editorial de la landing.

## Identidad común

- **Tipografía de interfaz:** IBM Plex Sans (`--font-plex-sans`). Es la fuente predeterminada del producto.
- **Tipografía de display pública:** Plus Jakarta Sans (`--font-jakarta-sans`) se usa en el gran titular de la landing. No la extiendas a todo el dashboard.
- **IBM Plex Sans Condensed:** existe en el proyecto para piezas concretas ya diseñadas. No la uses como sustituto general de la tipografía del dashboard.
- **Voz:** directa, futbolera e informativa. Los títulos de navegación y las secciones del dashboard usan frases breves; evita etiquetas doradas, titulares gigantes de landing y copys genéricos en pantallas de trabajo.
- **Marca:** el violeta y el fútbol son las señales visuales principales. Champagne/dorado (`--gloria-gold`) pertenece a pantallas antiguas concretas y no es el acento de `/` ni de `/home`.

## Sitio público `/`

### Paleta

| Uso | Valor actual |
| --- | --- |
| Fondo de la landing | `#0d0e12` (`--landing-canvas`) |
| Violeta de marca y CTA | `#8738ce` (`--landing-violet`) |
| Violeta de hover | `#9b4bdf` |
| Indicador activo de navegación | `#bd80ff` |
| Texto principal | `#f5f2f8` / blanco |
| Texto secundario | `#d0cbd5` |
| Fondo de vista previa del producto | `#101117` |

### Composición y componentes

- Header centrado, de hasta 1200 px, con marca a la izquierda, navegación en el centro y acciones a la derecha. En escritorio mide 72 px y se integra con el hero.
- El hero usa el wallpaper existente `/wallpapers/wallpaper_futbol_4K_3840x1280.jpg`, con texto a la izquierda y la vista previa real del partido a la derecha. Su composición de escritorio es aproximadamente 45/55 y su alto mínimo es 480 px.
- El overlay hace legible el texto y desvanece el wallpaper hacia el fondo. No reemplaces esta imagen por fondos planos ni apliques un recorte/zoom distinto sin una razón visual comprobable.
- Los CTA principales usan violeta sólido; los secundarios, fondo oscuro y borde violeta claro. Los radios son contenidos (5–8 px para botones).
- Después del hero, las funciones, competiciones y vistas del producto usan tarjetas oscuras, bordes discretos y separación consistente. El violeta destaca acciones, navegación activa y detalles relacionados con la marca; no tiñe todos los textos.
- En pantallas estrechas, el header pasa al menú móvil y las composiciones se apilan; conserva el orden y la prioridad del CTA.

## Dashboard autenticado `/home`

### Tokens de color

Usa estos colores para nuevas secciones dentro de `/home` y sus rutas hijas:

| Token | Valor | Uso |
| --- | --- | --- |
| `--sportia-bg` | `#0e0f14` | Fondo de toda el área autenticada |
| `--sportia-sidebar` | `#12131a` | Barra lateral |
| `--sportia-card` | `#14151d` | Tarjetas y paneles principales |
| `--sportia-inner` | `#1b1d27` | Superficies internas, filas seleccionadas y controles elevados |
| `--sportia-line` | `#252634` | Bordes y separadores |
| `--sportia-purple` | `#6823db` | Selección de deporte, CTA y acción principal |
| Violeta hover | `#7733ea` | Hover de acciones principales |
| Violeta de enlaces | `#c9a8ff` | Enlaces y señales activas sobre fondos oscuros |
| Texto principal | `#e2e8f0` / `#ffffff` | Titulares y datos principales |
| Texto secundario | `#c9cbd4` | Contenido y nombres secundarios |
| Texto tenue | `#8d90a5` | Metadatos, descripciones y horas |

Los colores semánticos de estado —por ejemplo, marcador en vivo o error— se usan solo donde ese estado existe. No conviertas cada cifra en una señal de color.

### Shell y jerarquía

- Reutiliza `SportiaSidebar`/`AppSidebar` y `SportiaPageHeader`. Mantén el perfil, navegación, notificaciones y estilos activos del shell compartido; no construyas otra barra lateral para una sección nueva.
- El dashboard usa `.sportia-home`, `.sportia-main` y `.sportia-dashboard`. La sidebar mide 256 px en escritorio; el contenido usa 32 px de padding y un grid principal aproximado de 2/3 para la actividad y 1/3 para tarjetas secundarias, con 32 px de separación.
- La página principal agrupa “Today Match” y la actividad futbolística en la columna principal; el parley y artículos relacionados van en la columna secundaria. Conserva ese ritmo de superficies y jerarquía cuando agregues una sección.
- Las tarjetas `.sportia-card` usan fondo `#14151d`, borde `#1e202b` y radio de 16 px. Las filas internas pueden usar `#1b1d27`; los separadores son de 1 px y bajo contraste.
- El hero deportivo puede usar el wallpaper de partido y tratamiento violeta. No extiendas el gradiente del hero a formularios, tablas ni a todas las tarjetas.

### Tipografía, controles e interacción

- Usa IBM Plex Sans para la interfaz autenticada. El título del topbar mide 24 px, peso 700; títulos de tarjeta, 16 px, peso 700; texto de partidos y contenido, aproximadamente 12–14 px; metadatos, 10–12 px.
- Usa blanco o `#e2e8f0` para títulos; `#8d90a5` para descripciones y metadatos. Evita etiquetas pequeñas, espaciadas y doradas como decoración por defecto.
- El CTA principal es violeta (`#6823db`, hover `#7733ea`) con texto blanco. Las acciones secundarias usan fondo transparente/oscuro y borde discreto.
- La navegación activa usa relleno violeta; los enlaces usan violeta claro. Los estados de hover aclaran la superficie y el texto, sin cambiar la identidad de la pantalla.
- Respeta foco visible, etiquetas asociadas a campos, estados disabled legibles y controles táctiles cómodos.

### Responsive

- Hasta 1000 px, el dashboard pasa a una sola columna; las tarjetas secundarias pueden compartir fila cuando el ancho alcance.
- Hasta 720 px, la sidebar se oculta, aparece el filtro móvil de competiciones y el contenido reduce su padding a unos 20 px.
- En móvil, apila equipos y acciones cuando sea necesario; evita desbordamiento horizontal, nombres truncados sin contexto y controles demasiado estrechos.

## Reglas para nuevos apartados

1. Determina si la ruta es pública o autenticada y usa la paleta de esa sección; no mezcles los tokens dorados heredados con el dashboard violeta.
2. Reutiliza el shell y los componentes compartidos antes de crear variantes locales.
3. Conserva los fondos, superficies, bordes, tipografía, tamaños, radios y estados descritos arriba. Si un diseño de referencia aprobado pide una excepción, aplícala solo al alcance solicitado.
4. Diseña estados de carga, vacío, error y contenido real con la misma jerarquía y contraste que el resto de la página.
5. Revisa escritorio y móvil en el navegador cuando la sesión de prueba lo permita. No afirmes una inspección visual autenticada si la ruta redirige al login.
6. Si el usuario cambia deliberadamente el sistema visual de la marca, actualiza esta guía en el mismo trabajo para que las siguientes secciones tengan una fuente vigente.

## Fuentes del sistema

- `app/layout.tsx`: carga IBM Plex Sans, IBM Plex Sans Condensed y Plus Jakarta Sans.
- `app/globals.css`: `.landing-page`, `.sportia-home`, `.sportia-sidebar`, `.sportia-topbar`, `.sportia-dashboard` y `.sportia-card`.
- `app/(account)/home/page.tsx`: estructura y jerarquía de `/home`.
- `components/layout/SportiaSidebar.tsx` y `components/layout/SportiaPageHeader.tsx`: navegación y encabezado autenticados compartidos.
