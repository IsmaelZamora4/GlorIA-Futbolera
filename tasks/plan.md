# Plan de implementación: Auth y Bank personal

## Objetivo

Convertir GlorIA en una aplicación con cuentas y un bank privado. Las páginas de partidos y metodología seguirán siendo públicas. Cada usuario autenticado tendrá un bank en PEN, USD o EUR para registrar apuestas simples, liquidarlas y consultar saldo y rendimiento. No habrá pagos ni movimiento de dinero dentro de la web.

## Mapa de capacidades

| Módulo | Responsabilidad | Depende de |
|---|---|---|
| `supabase-foundation` | Proyecto, clientes SSR, variables de entorno y migraciones | — |
| `identity` | Registro, login, logout, sesión y protección de rutas | `supabase-foundation` |
| `bank-ledger` | Bank, apuestas, ajustes, cálculos y RLS | `identity`, `supabase-foundation` |
| `bank-ui` | Navegación, formularios, panel e historial responsive | `bank-ledger`, `identity` |

Build order: `supabase-foundation` → `identity` → `bank-ledger` → `bank-ui`.

## Decisiones de arquitectura

- Usar `@supabase/supabase-js` y `@supabase/ssr` con sesión en cookies para Next.js.
- Mantener el análisis de partidos público y separar identidad del dominio del bank.
- Un solo bank por usuario en la primera versión. La moneda se elige al crearlo entre `PEN`, `USD` y `EUR` y queda fija después del primer movimiento.
- Guardar apuestas y ajustes como registros persistidos; derivar los totales desde esos registros.
- Activar RLS en todas las tablas expuestas y restringir cada fila al propietario mediante `auth.uid()`.
- No usar `service_role` ni claves secretas en código cliente o variables `NEXT_PUBLIC_`.

## Tareas

### Fase 0: Preparación y conexión

- [ ] **Tarea 1: Conectar el proyecto con Supabase.** Configurar variables seguras, dependencias fijadas y clientes browser/server/proxy según la guía actual de Next.js.
  - Aceptación: compila con configuración válida; el cliente servidor puede leer la sesión sin exponer una clave privilegiada.
  - Verificar: `npm run typecheck`, `npm run lint`, `npm run build` y comprobación de sesión en desarrollo.
  - Dependencias: Supabase creado y autorizado.
  - Archivos probables: `package.json`, `.env.example`, `lib/supabase/*`, `middleware.ts`.

### Checkpoint: Fundación

- [ ] Dependencias y variables revisadas.
- [ ] La aplicación pública sigue cargando sin sesión.

### Fase 1: Identidad

- [ ] **Tarea 2: Registro y perfil básico.** Crear registro por email, confirmación, login, logout, recuperación y perfil mínimo.
  - Aceptación: un usuario puede crear cuenta, iniciar sesión, cerrar sesión y recuperar acceso; los errores se muestran claramente.
  - Verificar: flujo manual con cuenta de prueba y sesión tras recargar.
  - Dependencias: Tarea 1.
  - Archivos probables: `app/(auth)/*`, `app/perfil/*`, `components/*`, `lib/supabase/*`.

- [ ] **Tarea 3: Protección de navegación.** Añadir acceso a Bank solo para usuarios autenticados y mantener públicas partidos y metodología.
  - Aceptación: anónimo recibe ruta a login; autenticado accede a Bank; logout invalida el acceso.
  - Verificar: navegación anónima, autenticada y después de logout.
  - Dependencias: Tarea 2.
  - Archivos probables: `middleware.ts`, `components/AppSidebar.tsx`, `app/bank/*`.

### Checkpoint: Identidad

- [ ] Registro, login, logout y recuperación verificados.
- [ ] Una cuenta no puede acceder a la sesión de otra.
- [ ] No hay claves secretas en el navegador.

### Fase 2: Bank y seguridad de datos

- [ ] **Tarea 4: Modelo SQL y migración inicial.** Crear `banks`, `bets` y `bank_adjustments` con tipos, restricciones, índices, relaciones y RLS.
  - Aceptación: moneda, importes, cuota y estados son válidos; propietario obligatorio; cada tabla tiene RLS y políticas de propietario.
  - Verificar: migración revisada, advisors de Supabase y pruebas de acceso con dos usuarios.
  - Dependencias: Tarea 2.
  - Archivos probables: `supabase/migrations/*`, `docs/specs/bank.md`.

- [ ] **Tarea 5: Reglas de cálculo y operaciones.** Implementar validación, creación del bank, alta de apuesta, ajustes y liquidación.
  - Aceptación: capital total, pendiente, disponible, beneficio y yield coinciden con la especificación; no se mezclan monedas.
  - Verificar: pruebas de ganada, perdida, anulada, pendiente, ajuste y datos vacíos.
  - Dependencias: Tarea 4.
  - Archivos probables: `lib/bank/*`, `app/api/bank/*`, `tests/*`.

### Checkpoint: Dominio

- [ ] Migración y RLS pasan revisión de seguridad.
- [ ] Los cálculos tienen pruebas enfocadas.
- [ ] Dos usuarios están aislados.

### Fase 3: Interfaz

- [ ] **Tarea 6: Crear Bank y registrar apuestas.** Construir formularios con validación, carga y errores.
  - Aceptación: usuario autenticado crea bank, elige moneda y registra apuesta simple sin recarga manual.
  - Verificar: PEN, USD y EUR e inputs inválidos.
  - Dependencias: Tareas 3 y 5.
  - Archivos probables: `app/bank/*`, `components/bank/*`.

- [ ] **Tarea 7: Panel, liquidación e historial.** Mostrar métricas, pendientes, liquidación, ajustes e historial responsive.
  - Aceptación: totales explicados, actualizados y persistentes al recargar.
  - Verificar: escritorio, móvil y sesión expirada.
  - Dependencias: Tarea 6.
  - Archivos probables: `app/bank/*`, `components/bank/*`, `app/globals.css`.

### Checkpoint: Producto

- [ ] Crear bank → registrar → liquidar → consultar historial funciona.
- [ ] Partidos y metodología siguen públicos.
- [ ] Sin overflow ni errores de consola en escritorio y móvil.

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Sesión SSR incorrecta | Alto | Probar cookies y recarga antes del bank. |
| RLS permite cruzar datos | Alto | Políticas por propietario y prueba con dos cuentas. |
| Saldos inconsistentes | Alto | Derivar métricas desde el ledger y definir correcciones. |
| Mezcla de monedas | Alto | Una moneda fija por bank y restricciones SQL. |
| Scope creep hacia pagos | Medio | Mantener pagos fuera del MVP. |

## Preguntas abiertas

- ¿Se corrige una apuesta liquidada mediante reversión con historial o edición directa?
- ¿Se añaden combinadas y cash out después de validar apuestas simples?
- ¿Se vinculan apuestas a fixtures en una fase posterior?
