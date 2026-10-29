# Tareas: Auth y Bank personal

## Fase 0: Preparación y conexión

- [x] **1. Conectar el proyecto con Supabase.**
  - Aceptación: clientes SSR/browser, variables seguras y dependencias fijadas.
  - Verificar: `npm run typecheck`, `npm run lint`, `npm run build` y sesión en desarrollo.
  - Dependencias: Supabase creado y autorizado.

## Checkpoint: Fundación

- [ ] App pública carga sin sesión.
- [ ] Variables y claves revisadas.

## Fase 1: Identidad

- [x] **2. Registro y perfil básico.**
  - Aceptación: registro, confirmación, login, logout y recuperación.
  - Verificar: cuenta de prueba y sesión tras recargar.
  - Dependencias: 1.

- [x] **3. Protección de navegación.**
  - Aceptación: Bank exige sesión; partidos y metodología siguen públicos.
  - Verificar: navegación anónima, autenticada y tras logout.
  - Dependencias: 2.

## Checkpoint: Identidad

- [ ] Registro, login, logout y recuperación pasan.
- [ ] Claves secretas no llegan al navegador.

## Fase 2: Bank y seguridad de datos

- [x] **4. Modelo SQL y migración inicial.**
  - Aceptación: tablas, restricciones, índices y RLS por propietario.
  - Verificar: migración, advisors y prueba con dos usuarios.
  - Dependencias: 2.

- [x] **5. Reglas de cálculo y operaciones.**
  - Aceptación: alta de bank, apuestas, ajustes, liquidación y métricas correctas.
  - Verificar: ganada, perdida, anulada, pendiente, ajuste y vacío.
  - Dependencias: 4.

## Checkpoint: Dominio

- [ ] RLS y migración revisadas.
- [ ] Cálculos probados.
- [ ] Usuarios aislados.

## Fase 3: Interfaz

- [ ] **6. Crear Bank y registrar apuestas.**
  - Aceptación: moneda PEN/USD/EUR, validación y registro persistente.
  - Verificar: flujo completo e inputs inválidos.
  - Dependencias: 3 y 5.

- [ ] **7. Panel, liquidación e historial.**
  - Aceptación: métricas, pendientes, liquidación, ajustes e historial responsive.
  - Verificar: escritorio, móvil y sesión expirada.
  - Dependencias: 6.

## Checkpoint: Producto

- [ ] Crear bank → registrar → liquidar → consultar historial funciona.
- [ ] Rutas públicas siguen funcionando.
- [ ] Sin overflow ni errores de consola.
