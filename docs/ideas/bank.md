# Bank personal de GlorIA

## Problema

Quien apuesta fuera de GlorIA necesita registrar sus operaciones y entender cuánto capital tiene disponible, cuánto ganó o perdió y cómo evoluciona su rendimiento. Una hoja de cálculo o notas dispersas hacen difícil mantener ese control.

## Dirección recomendada

Ofrecer a cada usuario autenticado un bank privado de seguimiento. La primera versión permite elegir una moneda (PEN, USD o EUR), registrar apuestas manuales, liquidarlas y consultar un resumen verificable. GlorIA registra actividad; no recibe ni mueve dinero.

El registro manual y un panel claro entregan valor sin depender de cuotas, casas de apuestas ni APIs de liquidación. El análisis de partidos actual sigue siendo público. Vincular una apuesta con un partido de GlorIA puede añadirse después de validar el registro básico.

## Supuestos por validar

- Los usuarios registrarán sus apuestas si el formulario es breve; comprobarlo con personas que hoy usan notas u hojas de cálculo.
- Apuestas simples y cuotas decimales cubrirán el primer uso; observar si las combinadas o liquidaciones parciales aparecen con frecuencia.
- Los usuarios entienden la diferencia entre capital total y saldo disponible tras reservar apuestas pendientes; probarla con ejemplos concretos.
- Elegir una sola moneda por bank satisface el primer uso; si se necesitan varias simultáneas, crear saldos separados por moneda sin sumar importes incompatibles.

## Alcance inicial

1. Un bank privado por usuario, con capital inicial y moneda elegida entre PEN, USD y EUR.
2. Registro manual de apuesta: fecha, deporte o evento, mercado, selección, cuota decimal e importe apostado.
3. Estados pendiente, ganada, perdida y anulada. Liquidación manual y cálculo transparente del beneficio neto.
4. Ajustes manuales de capital para reflejar aportes o retiros realizados fuera de GlorIA.
5. Panel con capital total, saldo disponible, importe pendiente, beneficio neto, rendimiento e historial.
6. Acceso restringido a los datos propios de cada usuario.

## No incluir todavía

- Pagos, depósitos o retiros reales dentro de GlorIA: requieren otro producto y controles adicionales.
- Cuotas en vivo, recomendaciones de apuestas o apuestas ejecutadas desde la web: no forman parte del seguimiento personal.
- Conversión automática entre monedas: introduce una fuente externa y complica la interpretación del historial.
- Importación de casas de apuestas, liquidación automática, varios banks y apuestas combinadas: primero validar el flujo manual básico.

## Criterio de éxito

Una persona puede registrar una apuesta en poco tiempo, liquidarla y explicar de dónde salen su saldo y su rendimiento. Al cerrar sesión y volver, encuentra sus datos; otra cuenta no puede verlos.

## Preguntas abiertas

- ¿Se permiten correcciones de apuestas ya liquidadas y cómo queda visible ese historial?
- ¿El primer lanzamiento admitirá apuestas de cualquier deporte o solo fútbol?
