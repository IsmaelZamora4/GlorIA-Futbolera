# GlorIA Futbolera — MVP y control de objetivos

> Documento base del producto. Codex debe usarlo para auditar el estado real del proyecto, distinguir lo implementado de lo pendiente y mantener este archivo actualizado.
>
> **Regla importante:** no marcar una función como completada solo porque exista una pantalla o datos de demostración. Debe funcionar, tener pruebas o evidencia verificable y cumplir los criterios de aceptación de este documento.

**Versión:** 1.0  
**Estado general:** En desarrollo  
**Tipo de producto:** Aplicación web personal de análisis estadístico prepartido de fútbol  
**Presupuesto objetivo:** S/ 0 al mes  
**Idioma inicial:** Español  
**Nombre:** GlorIA Futbolera

---

## 1. Resumen del producto

GlorIA Futbolera es una aplicación web que permite explorar partidos de fútbol próximos y consultar un análisis estadístico previo al partido. Busca presentar información futbolística de forma clara, visual y profesional, ayudando al usuario a entender las tendencias y probabilidades estimadas de distintos mercados estadísticos.

El producto no debe limitarse a mostrar una interfaz atractiva: su propósito es convertir datos históricos y disponibles de fútbol en un análisis entendible, explicando qué se sabe, qué se estima y qué limitaciones existen.

En el MVP, el uso principal es personal y también sirve como proyecto de portafolio para demostrar habilidades de desarrollo web, integración de datos, diseño de producto y análisis estadístico.

### Propuesta de valor

**Consultar en un solo lugar un análisis prepartido claro, sustentado en datos y con probabilidades estimadas, sin cuotas de apuestas, pagos ni necesidad de crear una cuenta.**

### Principios del producto

1. **Honestidad estadística:** no presentar cifras ficticias como datos reales ni probabilidades sin una metodología identificable.
2. **Costo cero:** priorizar servicios gratuitos y evitar infraestructura de pago.
3. **Control de consumo de API:** no realizar consultas innecesarias ni llamadas automáticas al abrir la página.
4. **Diseño editorial y deportivo:** aspecto profesional, sobrio y legible; evitar colores neón y patrones visuales genéricos.
5. **Simplicidad:** un usuario debe poder encontrar un partido y comprender su análisis con pocos pasos.
6. **Privacidad:** no exigir cuenta, contraseña ni datos personales.
7. **Transparencia:** mostrar fecha de actualización, fuente, cobertura y limitaciones de los datos.

---

## 2. Objetivos del MVP

### Objetivo principal

Construir una web funcional que permita seleccionar una competición y un partido, consultar información disponible y visualizar análisis prepartido para cinco grupos de mercados estadísticos.

### Objetivos específicos

- [ ] Mostrar partidos por fecha y competición.
- [ ] Permitir buscar y seleccionar un partido.
- [ ] Mostrar información básica de ambos equipos y del encuentro.
- [ ] Presentar análisis de cinco mercados definidos en este documento.
- [ ] Distinguir datos observados, estimaciones calculadas y datos de demostración.
- [ ] Utilizar datos almacenados en caché para evitar consultas repetidas a la API.
- [ ] Mantener una experiencia usable en escritorio, tablet y móvil.
- [ ] Ejecutar la aplicación localmente con instrucciones claras.
- [ ] Contar con pruebas o verificaciones para los cálculos y flujos esenciales.
- [ ] Mantener el costo mensual en S/ 0 usando servicios gratuitos y límites razonables.

---

## 3. Alcance funcional

### 3.1 Mercados estadísticos incluidos

El MVP se limita a los siguientes cinco mercados. No añadir otros mercados sin actualizar este documento.

#### M1. Resultado 1X2

Mostrar la probabilidad estimada de:

- Victoria del equipo local.
- Empate.
- Victoria del equipo visitante.

**Criterios de aceptación**
- [ ] Se muestran las tres probabilidades.
- [ ] Las probabilidades están entre 0 % y 100 %.
- [ ] La suma es aproximadamente 100 % (tolerancia de redondeo máxima: 1 punto porcentual).
- [ ] La pantalla indica que son estimaciones, no certezas.
- [ ] La estimación se basa en un método documentado y datos disponibles.
- [ ] Si no hay datos suficientes, se muestra “Datos insuficientes” en vez de inventar probabilidades.

#### M2. Córners

Mostrar estimación de córners totales y, cuando los datos lo permitan, por equipo:

- Córners esperados del local.
- Córners esperados del visitante.
- Total esperado.
- Posibles líneas estadísticas descriptivas, solo si se define y documenta su cálculo.

**Criterios de aceptación**
- [ ] Se distingue entre promedio histórico y estimación para el próximo partido.
- [ ] Se identifica el tamaño de la muestra cuando sea posible.
- [ ] No se muestran estadísticas de córners como reales si no existen en la fuente.

#### M3. Ambos equipos marcan (BTTS)

Mostrar la probabilidad estimada de:

- Sí: ambos equipos marcan al menos un gol.
- No: al menos uno de los equipos no marca.

**Criterios de aceptación**
- [ ] Se muestran las opciones “Sí” y “No”.
- [ ] Las probabilidades suman aproximadamente 100 %.
- [ ] Se explica que es una estimación estadística.
- [ ] Se utiliza un método documentado; si no hay datos suficientes, no se inventa el resultado.

#### M4. Goles

Mostrar estimaciones de goles totales y por equipo:

- Goles esperados del local.
- Goles esperados del visitante.
- Goles totales esperados.
- Promedios históricos relevantes, separados de las estimaciones.

**Criterios de aceptación**
- [ ] Se distinguen goles históricos de goles esperados.
- [ ] Se indica el periodo o tamaño de muestra utilizado.
- [ ] El total esperado es coherente con los valores de ambos equipos, salvo que la metodología documente otra cosa.
- [ ] No se promete un marcador exacto ni se presenta una estimación como certeza.

#### M5. Tiros a puerta

Mostrar el promedio histórico y, cuando sea viable, la estimación de tiros a puerta de cada equipo:

- Tiros a puerta del local.
- Tiros a puerta del visitante.
- Total estimado, si se calcula y documenta.

**Criterios de aceptación**
- [ ] La definición de “tiro a puerta” corresponde a la fuente de datos.
- [ ] Se diferencia el promedio histórico de la proyección.
- [ ] Si la fuente no ofrece esta estadística para un partido o competición, se indica claramente.
- [ ] No se sustituye por tiros totales ni se inventan valores.

---

## 4. Competiciones incluidas

El alcance inicial debe cubrir estas ocho competiciones:

| Competición | País / ámbito | Incluida |
|---|---|---|
| Liga 1 de Perú | Perú | Sí |
| Serie A | Italia | Sí |
| LaLiga | España | Sí |
| Ligue 1 | Francia | Sí |
| Bundesliga | Alemania | Sí |
| Premier League | Inglaterra | Sí |
| UEFA Champions League | Europa | Sí |
| UEFA Europa League | Europa | Sí |

**Nota técnica:** que una API enumere una competición o una temporada no garantiza que el plan gratuito permita consultar sus partidos o estadísticas. Codex debe comprobar el acceso real de cada endpoint antes de declarar una competición compatible.

**Criterios de aceptación**
- [ ] Las competiciones se identifican correctamente.
- [ ] Los identificadores de liga se guardan en una configuración central, no dispersos en componentes.
- [ ] La interfaz no muestra una competición como disponible si la fuente no permite recuperar sus datos.
- [ ] La falta de datos se comunica sin bloquear el resto de la aplicación.

---

## 5. Usuarios y escenarios principales

### Usuario objetivo

Una persona que quiere revisar estadísticas y estimaciones prepartido de fútbol de manera rápida, sin registrarse ni pagar.

### Flujo principal

1. El usuario abre la web.
2. Selecciona una fecha o una competición.
3. Revisa la lista de partidos disponibles.
4. Selecciona un partido.
5. Consulta los cinco mercados.
6. Revisa la fecha de actualización, la fuente y las advertencias de cobertura.

### Escenarios secundarios

- Buscar un equipo o partido.
- Cambiar de competición.
- Navegar entre fechas.
- Encontrar una competición sin cobertura y entender por qué.
- Ver una etiqueta de datos de demostración cuando no hay datos reales configurados.

---

## 6. Páginas y componentes del MVP

### 6.1 Inicio / dashboard

Debe incluir:

- Marca GlorIA Futbolera.
- Navegación simple.
- Selector de fecha.
- Filtro de competición.
- Búsqueda de partidos o equipos.
- Lista de partidos.
- Estado de datos: reales, almacenados en caché, insuficientes o de demostración.
- Panel de análisis del partido seleccionado.

**Criterios de aceptación**
- [ ] Los filtros cambian realmente la lista de partidos.
- [ ] Seleccionar un partido actualiza el panel de análisis.
- [ ] La página tiene estados de carga, error, vacío y datos insuficientes.
- [ ] La interfaz no realiza llamadas a la API solo por renderizar o recargar la página, salvo que exista una acción explícita y documentada.

### 6.2 Panel de partido

Debe incluir:

- Nombre y escudo de los equipos si la fuente proporciona los activos.
- Competición, fecha y hora local del encuentro.
- Indicador de calidad/cobertura de los datos.
- Los cinco mercados.
- Promedios o datos históricos de apoyo.
- Fecha de actualización.
- Fuente y metodología, al menos mediante un panel informativo o sección accesible.

### 6.3 Estados de interfaz

Implementar los siguientes estados:

- Cargando.
- Datos disponibles.
- Datos antiguos desde caché.
- Sin partidos.
- Sin datos para una estadística.
- Error de fuente/API.
- Datos de demostración.
- Cobertura o muestra insuficiente.

No ocultar errores importantes ni reemplazar silenciosamente datos ausentes con ceros.

---

## 7. Requisitos de diseño y experiencia

### Dirección visual

- Tema oscuro, sobrio y editorial.
- Apariencia de producto deportivo profesional, no de plantilla genérica.
- Uso moderado de espacio, jerarquía tipográfica y tablas/cards estadísticas.
- Priorizar legibilidad y densidad de información.
- Evitar neones, degradados exagerados, efectos de cristal innecesarios y adornos que no aporten información.
- Evitar animaciones pesadas.

### Paleta propuesta

| Uso | Color |
|---|---|
| Fondo principal | `#101112` |
| Superficie de tarjetas | `#1C1D1F` |
| Bordes | `#303133` |
| Texto principal | `#F5F2EC` |
| Texto secundario | `#A6A6A3` |
| Acento champagne | `#C6B08A` |

### Tipografía sugerida

- **IBM Plex Sans:** textos, navegación, filtros, etiquetas y explicaciones.
- **IBM Plex Sans Condensed:** titulares deportivos, nombres de equipos, cifras y estadísticas destacadas.

Codex puede conservar la tipografía existente si ya cumple este objetivo; cualquier cambio debe ser coherente y no duplicar cargas de fuentes innecesarias.

### Responsive

- [ ] Escritorio: lista de partidos y panel de análisis bien aprovechados.
- [ ] Tablet: layout adaptable sin desbordamientos.
- [ ] Móvil: navegación compacta, lista legible y panel de partido en una columna.
- [ ] No debe haber scroll horizontal involuntario.
- [ ] Contraste y tamaños de texto adecuados.

### Marca y activos

- Nombre exacto: **GlorIA Futbolera**.
- El logo puede vivir en `public/images/`.
- Los activos opcionales no deben bloquear la aplicación si no existen.
- Si se usa un banner de estadio, debe ser decorativo y no dificultar la lectura.
- No inventar un archivo de logo ni asumir que está instalado: verificarlo en el repositorio.

---

## 8. Datos, fuentes y estrategia de API

### Fuente prevista

API-Football es la fuente candidata para fixtures y estadísticas. Su disponibilidad depende del plan, los endpoints, la temporada, la competición y los límites vigentes. No asumir acceso a temporadas actuales ni a parámetros específicos sin una comprobación real.

### Reglas obligatorias para las llamadas

1. **No llamar a la API automáticamente al abrir la web.**
2. No realizar polling, cron, refresco periódico ni precarga masiva en el MVP.
3. La consulta de datos debe ser manual o activada por una acción explícita del usuario/desarrollador.
4. Consultar primero los datos locales/cache antes de considerar una llamada remota.
5. Guardar las respuestas válidas para reutilizarlas.
6. Limitar y documentar el número de requests de pruebas.
7. No volver a ejecutar auditorías de endpoints sin autorización explícita o un presupuesto de requests definido.
8. No hacer llamadas desde el navegador que expongan la API key.
9. La clave debe estar solo en una variable de entorno del servidor.
10. No imprimir la clave en logs, errores, capturas, reportes ni commits.

### Variables de entorno

Usar una variable privada del servidor, por ejemplo:

`API_FOOTBALL_KEY=...`

- El archivo `.env.local` no debe subirse al repositorio.
- El `.gitignore` debe excluir secretos.
- Crear `.env.example` con el nombre de la variable y un valor vacío o marcador, nunca una clave real.
- Si se detecta una clave expuesta, recomendar revocarla y generar otra.
- No añadir claves al código fuente ni a variables `NEXT_PUBLIC_*`.

### Caché y almacenamiento local

El MVP debe reutilizar resultados para evitar consumo innecesario.

- Cachear fixtures y estadísticas ya consultados.
- Guardar fecha/hora de consulta.
- Diferenciar “actualizado” de “antiguo”.
- Permitir que el usuario consulte datos almacenados aunque la API no esté disponible.
- No asumir que el almacenamiento del navegador es suficiente para datos compartidos entre dispositivos; para el MVP de uso local se puede comenzar con archivos JSON o una base de datos local, según el estado real del proyecto.
- No introducir una base de datos remota de pago.

### Política de presupuesto de requests

- Las peticiones tienen un costo de cuota aunque no tengan costo monetario.
- No consultar endpoints en bucles sin límite.
- Toda rutina de importación o auditoría debe tener un máximo explícito de peticiones.
- Antes de ejecutar una prueba de integración real, mostrar o documentar cuántas peticiones hará.
- No repetir una llamada fallida automáticamente en bucle.
- Preferir un conjunto pequeño de fixtures históricos para validar el flujo.

### Datos de demostración

Los datos ficticios son aceptables solo para desarrollar y mostrar la interfaz.

- Deben etiquetarse claramente como **“Datos de demostración — no son estadísticas reales”**.
- No deben mezclarse silenciosamente con datos reales.
- No deben alimentar el análisis real ni presentarse como una predicción válida.
- Debe ser posible distinguirlos en el código, por ejemplo mediante un campo `source` o `isDemo`.
- Antes de producción o de presentar resultados como reales, se debe verificar la procedencia de los datos.

---

## 9. Motor de análisis estadístico

### Objetivo

Calcular estimaciones reproducibles a partir de datos históricos suficientes. No se exige machine learning para la primera versión: un modelo estadístico sencillo, documentado y comprobable es preferible a una IA ficticia o a porcentajes inventados.

### Requisitos mínimos

- [ ] Documentar el método utilizado para cada uno de los cinco mercados.
- [ ] Identificar las variables de entrada y el tamaño de la muestra.
- [ ] Definir el tratamiento de partidos sin estadísticas y de valores ausentes.
- [ ] Evitar fuga de información: las estimaciones prepartido no deben utilizar estadísticas que solo se conocieron después del encuentro.
- [ ] Validar la salida con datos históricos separados del conjunto usado para ajustar el método, si se dispone de datos suficientes.
- [ ] Mostrar una advertencia cuando la muestra sea pequeña o la cobertura incompleta.
- [ ] No usar lenguaje que garantice resultados.

### Primera aproximación permitida

Puede implementarse inicialmente un método estadístico básico y transparente, por ejemplo promedios recientes ajustados por condición de local/visitante y una distribución de Poisson para goles, siempre que el código documente sus supuestos y se pruebe correctamente.

Para córners y tiros a puerta se necesita comprobar que existen datos suficientes y consistentes. Si no existen, se debe mostrar “Sin datos suficientes” en vez de fabricar una estimación.

### Requisitos de calidad

- Los cálculos deben vivir en módulos independientes de los componentes visuales.
- Deben existir pruebas unitarias para los casos normales, límites y datos ausentes.
- Los resultados deben ser deterministas para la misma entrada.
- No etiquetar el modelo como “IA” o “predictor avanzado” si solo usa una regla simple sin justificación.
- La precisión predictiva todavía no es un objetivo garantizado; debe medirse antes de afirmar que el sistema predice bien.

---

## 10. Arquitectura sugerida

Codex debe inspeccionar primero el repositorio y adaptar esta propuesta a lo que realmente existe. No recrear el proyecto desde cero ni reemplazar archivos sin necesidad.

### Stack preferido

- Next.js con App Router.
- React.
- TypeScript.
- Tailwind CSS si ya está configurado o resulta coherente con el proyecto.
- API-Football solo en el servidor.
- Archivos JSON o almacenamiento local para la primera versión, si resulta suficiente.

### Separación lógica sugerida

- `app/`: páginas y rutas.
- `components/`: elementos visuales reutilizables.
- `lib/api-football/`: cliente servidor para la API y normalización de respuestas.
- `lib/analysis/`: cálculos estadísticos y probabilidades.
- `lib/cache/` o equivalente: lectura/escritura de caché.
- `data/demo/`: datos ficticios claramente marcados.
- `tests/`: pruebas unitarias y verificaciones.
- `docs/`: documentación y reportes de auditoría.

Los nombres anteriores son orientativos; respetar la estructura existente si ya hay una equivalente.

### Seguridad y robustez

- Validar parámetros de entrada.
- Manejar errores y límites de la API.
- No exponer secretos al cliente.
- No asumir que todas las propiedades de una respuesta externa existen.
- Normalizar las respuestas de la API antes de utilizarlas en componentes.
- Evitar dependencias nuevas si la funcionalidad puede resolverse con el stack actual.

---

## 11. Requisitos no funcionales

### Rendimiento
- [ ] La interfaz inicial carga con datos locales o cacheados.
- [ ] No depende de una API remota para renderizar la estructura principal.
- [ ] Imágenes optimizadas y sin bloquear el contenido.
- [ ] Evitar paquetes pesados innecesarios.

### Fiabilidad
- [ ] Los fallos de API se muestran de forma comprensible.
- [ ] Los datos de caché se pueden utilizar cuando la fuente falla.
- [ ] No se confunden valores ausentes con cero.
- [ ] Las fechas y horas se muestran con una zona horaria explícita y consistente.

### Accesibilidad
- [ ] Controles con etiquetas comprensibles.
- [ ] Contraste adecuado.
- [ ] Navegación por teclado para controles esenciales.
- [ ] Estados que no dependan únicamente del color.

### Mantenibilidad
- [ ] TypeScript sin errores relevantes.
- [ ] Lógica estadística separada de la UI.
- [ ] Instrucciones para ejecutar y probar el proyecto.
- [ ] Variables de entorno documentadas.
- [ ] Sin claves ni datos sensibles en Git.

---

## 12. Fuera del alcance del MVP

No implementar por ahora:

- Registro, login o perfiles de usuario.
- Suscripciones, pagos o monetización.
- Cuotas de casas de apuestas o recomendaciones de apuestas.
- Predicciones en vivo.
- Seguimiento minuto a minuto.
- Notificaciones push o por correo.
- App móvil nativa.
- Funciones sociales, comentarios o chat.
- Panel administrativo complejo.
- Entrenamiento de modelos de machine learning de gran escala.
- Infraestructura cloud de pago.
- Scraping de páginas de terceros.
- Cobertura de ligas adicionales sin actualizar el alcance.
- Automatizaciones que consuman cuota de API de forma periódica.

---

## 13. Definición de “terminado”

Una función se considera terminada solo si:

1. Está implementada y conectada al flujo real.
2. Cumple los criterios de aceptación.
3. Maneja errores y datos ausentes.
4. Tiene pruebas o pasos de verificación reproducibles.
5. No introduce llamadas de API no autorizadas ni expone secretos.
6. La documentación refleja su comportamiento actual.
7. Codex puede indicar el archivo o prueba que demuestra su estado.

### Estados permitidos para el seguimiento

- `PENDIENTE`: no implementado.
- `EN PROGRESO`: implementación parcial.
- `IMPLEMENTADO SIN VERIFICAR`: existe código, pero faltan pruebas/evidencia.
- `BLOQUEADO`: depende de un servicio, dato o decisión pendiente.
- `COMPLETADO`: pasa los criterios de aceptación con evidencia.
- `NO APLICA`: no corresponde al MVP; justificar el motivo.

No marcar como `COMPLETADO` una función basándose únicamente en que “se ve bien” en una captura.

---

## 14. Matriz de seguimiento de objetivos

Codex debe completar esta tabla después de inspeccionar el repositorio. No debe asumir el estado basándose solo en este documento.

| ID | Objetivo / entregable | Estado | Evidencia verificable | Próxima acción |
|---|---|---|---|---|
| OBJ-01 | Proyecto ejecutable localmente | EN PROGRESO | `npm run dev`, `typecheck` y `lint` pasan; `next build` falla en Turbopack/CSS | Resolver build de producción |
| OBJ-02 | Dashboard responsive | IMPLEMENTADO SIN VERIFICAR | Dashboard y media queries en `app/page.tsx`/`app/globals.css`; falta matriz visual completa | Verificar escritorio, tablet y móvil |
| OBJ-03 | Filtros de fecha y competición funcionales | IMPLEMENTADO SIN VERIFICAR | Estado y filtrado demo en `app/page.tsx` | Verificar fecha y datos reales |
| OBJ-04 | Lista de partidos seleccionables | IMPLEMENTADO SIN VERIFICAR | `MatchRow` actualiza partido seleccionado en `app/page.tsx` | Añadir prueba reproducible |
| OBJ-05 | Panel de análisis del partido | EN PROGRESO | Panel demo funcional; aún sin análisis real ni estados completos | Conectar modelo normalizado |
| OBJ-06 | Mercado 1X2 | PENDIENTE | Función de cálculo y pruebas | Implementar/validar |
| OBJ-07 | Mercado de córners | PENDIENTE | Fuente, función y pruebas | Comprobar cobertura de datos |
| OBJ-08 | Mercado BTTS | PENDIENTE | Función de cálculo y pruebas | Implementar/validar |
| OBJ-09 | Mercado de goles | PENDIENTE | Función de cálculo y pruebas | Implementar/validar |
| OBJ-10 | Mercado de tiros a puerta | PENDIENTE | Fuente, función y pruebas | Comprobar cobertura de datos |
| OBJ-11 | Ocho competiciones objetivo | EN PROGRESO | IDs centralizados en `lib/football.ts`; cobertura real aún no verificada | Comprobar acceso por competición |
| OBJ-12 | Etiquetado de datos demo/reales | EN PROGRESO | UI etiqueta demo y endpoint devuelve `source`; falta modelo común | Normalizar `source` y fecha |
| OBJ-13 | API key protegida en servidor | COMPLETADO | `.env.local` ignorado; endpoint lee `process.env` y no expone la clave | Regenerar clave antes de publicar |
| OBJ-14 | Caché de respuestas | EN PROGRESO | `fetch` con `revalidate: 21600` y endpoint con `s-maxage` | Probar reutilización sin repetir request |
| OBJ-15 | Sin llamadas automáticas al cargar | IMPLEMENTADO SIN VERIFICAR | Consulta API solo tras pulsar `Cargar datos reales`; una liga por petición | Verificar red en navegador |
| OBJ-16 | Estados de error, vacío y datos insuficientes | EN PROGRESO | Error API, vacío demo y mensaje manual parcial | Completar loading/cache/insuficiente |
| OBJ-17 | Pruebas unitarias de análisis | IMPLEMENTADO Y VERIFICADO | `npm test` valida coherencia de mercados, ausencia de fuga temporal y calibración monótona en las cinco ligas | Ampliar con casos de datos incompletos |
| OBJ-18 | Diseño visual coherente con la marca | IMPLEMENTADO SIN VERIFICAR | Revisión visual desktop y estilos responsive | Revisar tablet/móvil/accesibilidad |
| OBJ-19 | Documentación de instalación | PENDIENTE | Existe documentación de caché, no README | Documentar instalación y comandos |
| OBJ-20 | Presupuesto objetivo S/ 0 | EN PROGRESO | Stack local y API Free; sin infraestructura de pago | Definir límites de uso y despliegue |

**Importante:** estos estados son valores iniciales de plantilla, no una afirmación sobre el estado actual del código. Codex debe actualizarlos con evidencia real.

---

## 15. Plan de implementación por fases

### Fase 0 — Auditoría del proyecto

- [ ] Inspeccionar los archivos y estructura actuales.
- [ ] Identificar stack, scripts, dependencias y páginas existentes.
- [ ] Ejecutar comprobaciones locales disponibles sin hacer llamadas externas.
- [ ] Revisar si existen `.env.local`, `.env.example` y reglas de `.gitignore`, sin mostrar secretos.
- [ ] Revisar los scripts de auditoría de API para confirmar que tienen límites de requests.
- [ ] Actualizar la matriz de seguimiento con el estado real.
- [ ] Registrar bloqueos y riesgos.

**No realizar llamadas a API durante esta fase.**

### Fase 1 — Interfaz y experiencia local

- [ ] Completar el dashboard y el panel de partido.
- [ ] Usar datos de demostración explícitamente etiquetados.
- [ ] Implementar filtros, selección y estados de interfaz.
- [ ] Ajustar diseño responsive.
- [ ] No conectar la API todavía.

### Fase 2 — Modelo de datos y almacenamiento

- [ ] Definir tipos TypeScript para competición, partido, equipo, estadísticas y análisis.
- [ ] Normalizar los datos de demostración.
- [ ] Implementar lectura y escritura de caché.
- [ ] Registrar fuente y fecha de actualización.
- [ ] Probar manejo de datos ausentes.

### Fase 3 — Integración controlada de API

- [ ] Confirmar que existe una API key válida configurada de forma privada.
- [ ] Revisar límites y cobertura del plan actual.
- [ ] Presentar el número previsto de requests antes de hacer la prueba.
- [ ] Hacer una prueba pequeña y manual, con un máximo explícito.
- [ ] Verificar fixtures, estadísticas de partidos y las cinco categorías de datos.
- [ ] Guardar resultados en caché.
- [ ] No habilitar refresco automático.

### Fase 4 — Cálculos estadísticos

- [ ] Documentar el método de cada mercado.
- [ ] Implementar funciones independientes.
- [ ] Añadir pruebas unitarias.
- [ ] Validar límites y coherencia de probabilidades.
- [ ] Mostrar insuficiencia de datos cuando corresponda.
- [ ] No usar datos posteriores al partido para generar una predicción prepartido.

### Fase 5 — Validación y cierre del MVP

- [ ] Ejecutar lint, typecheck, tests y build, según los scripts disponibles.
- [ ] Probar el flujo principal completo.
- [ ] Probar diseño en escritorio y móvil.
- [ ] Verificar que no se filtra la API key.
- [ ] Verificar que el dashboard no dispara requests inesperados.
- [ ] Actualizar matriz de objetivos con evidencia.
- [ ] Documentar limitaciones conocidas y pasos siguientes.

---

## 16. Riesgos y limitaciones conocidas

- El plan gratuito de la fuente de datos puede restringir temporadas, endpoints, parámetros y estadísticas.
- No todas las competiciones tendrán necesariamente los cinco mercados.
- Los datos de tiros a puerta y córners pueden tener cobertura desigual.
- Una probabilidad estadística no garantiza el resultado de un partido.
- Una muestra pequeña puede producir estimaciones poco fiables.
- Una interfaz con datos ficticios puede parecer funcional sin estar conectada a datos reales; debe evitarse esa confusión.
- La cuota de API puede agotarse si se repiten pruebas o se realizan consultas automáticas.
- Un diseño local no demuestra por sí solo que el proyecto esté listo para desplegarse.

---

## 17. Criterios para considerar el MVP listo

El MVP puede considerarse **listo para uso personal en modo de datos reales** cuando:

- [ ] El proyecto se instala, arranca y compila de forma reproducible.
- [ ] El usuario puede filtrar y seleccionar partidos.
- [ ] La información del partido proviene de una fuente verificada o está etiquetada como demostración.
- [ ] Cada mercado disponible presenta datos y estimaciones con metodología documentada.
- [ ] Los mercados sin datos suficientes lo indican claramente.
- [ ] Los cálculos críticos tienen pruebas.
- [ ] La caché evita consultas redundantes.
- [ ] No hay llamadas automáticas no deseadas.
- [ ] La API key permanece en el servidor y fuera del repositorio.
- [ ] El diseño funciona en escritorio y móvil.
- [ ] La matriz de objetivos y el README reflejan el estado real.
- [ ] No hay servicios de pago obligatorios para el uso local básico.

Si solo está lista la interfaz con datos ficticios, el estado debe describirse como **“prototipo visual funcional”**, no como MVP completo con análisis real.

---

## 18. Instrucciones para Codex

Usa este documento como la fuente principal de requisitos del producto.

### Primera tarea: auditoría, no reescritura

1. Inspecciona el repositorio existente antes de cambiar código.
2. Lee este documento completo.
3. Verifica cada fila de la matriz de seguimiento contra el código, scripts, pruebas y configuración reales.
4. No marques una función como completada solo porque existe una pantalla o un componente.
5. No hagas requests a API, no consumas cuota y no pruebes claves durante la auditoría inicial.
6. No muestres ni copies valores de secretos en la salida.
7. Actualiza la matriz con los estados correctos, evidencia verificable y próxima acción.
8. Identifica discrepancias entre la implementación actual y este documento.
9. Separa claramente:
   - Funcionalidad implementada y verificada.
   - Funcionalidad implementada pero no verificada.
   - Funcionalidad parcial.
   - Funcionalidad ausente.
   - Bloqueos de datos/API.
10. Al terminar, presenta un resumen breve: porcentaje aproximado de objetivos completados, objetivos bloqueados, riesgos y los próximos tres pasos de mayor prioridad.

### Después de la auditoría

Implementa solo la siguiente fase prioritaria y mantén este documento actualizado. No hagas una reescritura total, no añadas funcionalidades fuera del alcance y no realices llamadas externas sin autorización explícita.

### Registro de cambios

Al modificar este documento, añade al final una entrada breve con fecha, cambios realizados, verificaciones ejecutadas y pendientes. No inventes resultados de pruebas.

---

## 19. Registro de cambios

- **v1.0:** definición inicial del producto, alcance del MVP, cinco mercados, ocho competiciones, reglas de API/caché, criterios de aceptación y matriz de seguimiento. Pendiente de auditoría contra el repositorio real.
- **2026-10-22:** auditoría inicial y conexión manual de fixtures por competición. API limitada a una petición por consulta, caché de 6 horas, `typecheck`/`lint` pasan. Pendientes: normalización de fixtures en la UI, cálculos estadísticos, tests, estados completos y `next build`.
- **2026-10-23:** pipeline histórico multiliga, backtest temporal, calibración local y pruebas reproducibles incorporados. Verificados con `normalize:data`, validadores de datos/equipos, `backtest`, `npm test`, `typecheck` y `lint`. Pendiente: resolver el bloqueo de build de Turbopack/CSS y completar validación visual en dispositivos.
- **2026-10-23:** rutina semanal local `npm run refresh:current` incorporada para reemplazar un CSV de temporada actual con respaldo automático y regenerar el pipeline sin consumir API.
- **2026-10-23:** protección de cuota de football-data.org reforzada: se eliminaron consultas de estadio por fixture, se añadió deduplicación/caché de servidor y Home carga ligas de forma secuencial con caché persistente en el navegador.
