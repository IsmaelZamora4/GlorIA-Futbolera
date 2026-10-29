# Especificación: Bank personal

## Objetivo

Permitir que una persona autenticada lleve un registro privado de apuestas hechas fuera de GlorIA. Debe poder conocer su capital, apuestas pendientes y rendimiento sin mezclar monedas ni depender de datos de casas de apuestas. El análisis público de partidos continúa accesible sin cuenta.

## Supuestos y decisiones actuales

- Cada usuario tiene un bank en la primera versión.
- Al crearlo elige PEN, USD o EUR; todas las operaciones de ese bank usan esa moneda. La moneda no cambia una vez que existen movimientos.
- La primera versión registra apuestas simples con cuota decimal. Su liquidación es manual.
- Los ajustes de capital son registros informativos de aportes y retiros externos; la aplicación no procesa pagos.
- Una apuesta puede referirse a cualquier deporte mediante texto manual. La asociación automática a un fixture de GlorIA queda fuera del primer alcance.

## Flujo de usuario

1. La persona inicia sesión y abre Bank. Si aún no existe, fija capital inicial y moneda.
2. Registra una apuesta pendiente con fecha, evento/deporte, mercado, selección, cuota decimal e importe.
3. El panel muestra la apuesta y reserva su importe del saldo disponible.
4. Tras conocer el resultado, la marca como ganada, perdida o anulada.
5. Puede registrar un ajuste manual de capital y consultar el historial de apuestas y ajustes.

## Reglas de cálculo

- Beneficio neto de una apuesta ganada: `importe × (cuota − 1)`.
- Beneficio neto de una perdida: `−importe`; de una anulada: `0`; de una pendiente: todavía no se realiza beneficio.
- Capital total: capital inicial + ajustes netos + beneficio neto de apuestas liquidadas.
- Importe pendiente: suma de importes de apuestas pendientes.
- Saldo disponible: capital total − importe pendiente.
- Rendimiento (*yield*): beneficio neto de apuestas ganadas y perdidas dividido entre la suma de sus importes. Mostrar «Sin datos» si no hay apuestas resueltas; las anuladas no entran en el denominador.
- Los importes se presentan con la moneda elegida. No se suman importes de monedas distintas.

## Datos y privacidad

- Auth identifica al propietario de cada bank, apuesta y ajuste.
- Los datos persisten en Supabase; políticas RLS limitan lectura y escritura a la cuenta propietaria.
- La interfaz y el servidor validan campos e importes. Los cálculos deben provenir de los movimientos persistidos para que la página y el historial coincidan.
- No exponer claves privilegiadas de Supabase en el navegador.

## Stack y estructura previstos

- Next.js 16, React 19, TypeScript y Supabase Auth/Postgres, con integración SSR apropiada para la versión del proyecto.
- Páginas y rutas en `app/`; componentes en `components/`; reglas y clientes de datos en `lib/`; migraciones en `supabase/`; pruebas de cálculo y acceso en `tests/` o la ubicación que adopte el plan técnico.
- Mantener la separación ya usada por el proyecto entre UI, preferencias y lógica de análisis.

## Comandos del proyecto

- Desarrollo: `npm run dev`
- Compilación: `npm run build`
- Tipos: `npm run typecheck`
- Lint: `npm run lint`
- Pruebas existentes: `npm test`

## Estilo y verificación

- Usar nombres explícitos y tipos de dominio. Ejemplo de regla: `const netProfit = stake * (decimalOdds - 1);`.
- Probar cálculos de ganada, perdida, anulada y pendiente con importes y cuotas conocidos.
- Comprobar con dos cuentas que ninguna pueda consultar o modificar registros de la otra, incluso mediante acceso directo a datos.
- Comprobar creación, registro, liquidación, ajuste, recarga de página y estados vacíos en escritorio y móvil.

## Límites de la implementación

- Siempre: validar datos de entrada, aplicar RLS, conservar migraciones reproducibles y revisar el estado real de Supabase/Next.js antes de implementar.
- Consultar una decisión de producto antes de cambiar la regla de moneda o de beneficio cuando haya datos persistidos.
- Nunca: publicar claves de servicio, sumar monedas diferentes, presentar el bank como monedero real ni alterar los cálculos sin actualizar esta especificación.

## Criterios de aceptación

1. Un usuario crea un solo bank y elige PEN, USD o EUR; una vez que registra movimientos, la moneda se mantiene.
2. Puede registrar y liquidar apuestas simples y ver el efecto correcto en capital total, disponible, pendientes, beneficio y rendimiento.
3. Puede registrar ajustes manuales sin mover dinero dentro de la web.
4. Los datos permanecen tras cerrar sesión y volver a entrar; otra cuenta no puede leerlos ni modificarlos.
5. Las páginas de partidos y metodología siguen disponibles sin iniciar sesión.
6. La interfaz explica las cifras, muestra estados vacíos y funciona en móvil y escritorio.

## Preguntas abiertas para la revisión

- ¿Cómo se corrige una apuesta liquidada por error: edición con historial de cambios o reversión seguida de una nueva liquidación?
- ¿Hace falta incluir cash out o apuestas combinadas en el primer lanzamiento? La propuesta actual los deja fuera.
