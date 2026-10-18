# Decisiones de diseño y lógica de negocio — ByteMarket

Este documento recoge **por qué** el código hace lo que hace. No describe la
API ni cómo levantar el proyecto —eso está en el README de cada repositorio y
en `BYTEMARKET-WORKFLOW.md`—, sino las decisiones que no se deducen leyendo
las clases, y que si alguien "simplifica" sin saber, rompe algo.

**Contenido:** [el proyecto en cifras](#el-proyecto-en-cifras) ·
[mapa del código](#mapa-del-código) · [las decisiones](#1-el-frontend-nunca-habla-con-mysql) ·
[qué está comprobado](#qué-está-comprobado-y-qué-no) ·
[trampas conocidas](#trampas-conocidas) · [preguntas frecuentes](#preguntas-frecuentes)

---

## El proyecto en cifras

| | |
|---|---|
| Repositorios | 7 (6 servicios Spring Boot + 1 frontend Nuxt) |
| Clases Java | 134 |
| Endpoints REST | 93 |
| Componentes y páginas Vue | 77 (34 páginas, 39 componentes, 4 layouts) |
| Tests automatizados | 156 (58 catalog, 52 order, 34 support, 12 user) |
| Esquemas MySQL | 4, uno por servicio de negocio |
| Tablas | 21 |

| Esquema | Tablas |
|---|---|
| `bytemarket_user` | `users`, `customers`, `business_config` |
| `bytemarket_catalog` | `products`, `product_images`, `categories`, `subcategories`, `banners`, `reviews`, `favorites`, `inventory_movements`, `stock_reservations` |
| `bytemarket_order` | `orders`, `order_items`, `order_status_logs`, `payment_methods`, `coupons`, `cash_sessions`, `cash_movements` |
| `bytemarket_support` | `complaints`, `order_notifications` |

---

## Mapa del código

Dónde está cada cosa cuando hay que tocarla.

### Servicios y su responsabilidad

| Servicio | Puerto | De qué es dueño |
|---|---|---|
| `eureka-server` | 8761 | Registro: quién está vivo y en qué IP |
| `api-gateway` | 8085 | Entrada única; enruta por path |
| `user-service` | 8081 | Cuentas, login, **firma del JWT**, perfiles |
| `catalog-service` | 8082 | Productos, categorías, banners, inventario, reseñas, favoritos |
| `order-service` | 8083 | Pedidos, pagos, cupones, reportes |
| `support-service` | 8084 | Libro de reclamaciones |

### Clases que concentran la lógica

| Clase | Qué hace | Por qué mirarla |
|---|---|---|
| `CartService` (order) | Arma el carrito: resuelve precios, valida stock, aplica cupón | Toda la lógica del dinero pasa por aquí |
| `OrderService` (order) | Crea el pedido y gestiona cambios de estado | Es quien publica los eventos de stock |
| `StockService` (catalog) | Descuenta y devuelve stock | **Idempotente**; lo usan la cola y el REST |
| `CatalogClient` + `Fallback` (order) | Llamadas Feign a catalog | Define qué pasa si catalog no responde |
| `StockPublisher` / `StockListener` | Los dos extremos de la cola | El flujo asíncrono del inventario |
| `GlobalExceptionHandler` (×4) | Forma única de los errores | Lo que recibe el frontend al fallar |
| `ProductoSpecification` (catalog) | Filtros dinámicos del catálogo | La usan tienda y panel, con distinto `isActive` |
| `server/api/[...path].ts` (front) | Proxy al gateway con el JWT | Por aquí pasan todas las llamadas del navegador |

### Las dos caras del catálogo

`ProductoSpecification.conFiltros(...)` la usan la tienda **y** el panel. La
diferencia es un parámetro:

- Tienda: `isActive = 1` → solo productos publicados.
- Panel: `isActive = null` → también los desactivados, que es justo lo que la
  tienda esconde.

---

## 1. El frontend nunca habla con MySQL

Nuxt solo hace HTTP contra el gateway. Todo `/api/**` sin manejador propio se
reenvía desde `server/api/[...path].ts`, añadiendo el JWT de la sesión como
`Bearer`.

**Por qué.** Cada microservicio es dueño de su esquema, y las reglas de
negocio viven en ellos. Si el frontend leyera la base directamente, se
saltaría esas reglas: la más evidente, la que impide comprar a un precio que
no sea el del catálogo.

## 2. El navegador nunca ve el JWT

El login no lo hace el navegador contra el gateway: lo hacen los manejadores
propios de Nuxt (`server/api/auth/*`), que llaman al gateway desde el
servidor y guardan el token en una **cookie sellada** de `nuxt-auth-utils`.

**Por qué.** Un token en `localStorage` es legible por cualquier script que
acabe en la página. Así el navegador solo tiene una cookie que no puede
leer, y el token vive en el servidor de Nuxt.

## 3. El gateway NO valida el token

Solo reenvía la cabecera. Cada servicio lo verifica en su `SecurityConfig`.

**La consecuencia a tener presente:** si se añade un servicio nuevo y se
olvida su `SecurityConfig`, queda abierto. El gateway no es una red de
seguridad.

El `JWT_SECRET` debe ser **idéntico** en user, catalog, order y support:
user-service firma y los demás verifican. Si difieren, todas las peticiones
autenticadas fallan con 401 **sin dejar rastro en el log**, que es lo que
hace el fallo tan difícil de diagnosticar.

## 4. El precio y el stock se leen del catálogo, nunca del navegador

`CartService` recibe del frontend solo `productId` y `quantity`. El precio,
el nombre y el stock los pide a catalog-service.

**Por qué.** Si el importe viniera en la petición, cualquiera podría comprar
un celular a un sol editando el cuerpo del JSON.

Lo mismo con los cupones: el checkout manda **solo el código**, nunca el
descuento calculado.

## 5. Validar stock es síncrono; descontarlo, asíncrono

Son dos operaciones distintas y van por caminos distintos a propósito:

| Operación | Cuándo | Cómo | Por qué |
|---|---|---|---|
| **Validar** que hay stock | antes de confirmar | Feign, síncrono | el cliente necesita saber antes de pagar si quedan unidades |
| **Descontar** el stock | después de confirmar | RabbitMQ, asíncrono | el cliente ya tiene su pedido; que baje dos segundos después no le afecta |

**La consecuencia:** con catalog-service caído, el checkout **sigue
fallando**, porque no puede consultar precios. La cola no arregla eso. Lo que
arregla es el otro caso: catalog responde bien al validar, el pedido se
confirma, y catalog se cae en ese intervalo. Antes ahí se perdía el descuento
y quedaba un `log.error`; existía incluso
`/api/admin/inventory/backfill` para reconstruirlo a mano.

## 6. El descuento de stock es idempotente

`StockService` comprueba si ya existe un movimiento de kardex con ese
`related_order_id`, `product_id` y tipo. Si existe, no hace nada.

**Por qué es obligatorio.** RabbitMQ garantiza entrega **"al menos una
vez"**: si el consumidor se cae justo después de procesar y antes de
confirmar, el mensaje vuelve. Sin esta comprobación, ese reintento
descontaría el stock dos veces y el inventario quedaría mal sin que nadie se
entere.

Se distingue por **tipo** porque un pedido puede tener una salida por venta
y, más tarde, una entrada por cancelación: ambas son legítimas.

## 7. Un mensaje que no se puede procesar se aparta, no se descarta

La cola `inventario.stock` tiene una *dead letter* a
`inventario.stock.fallidos`. Tras 4 intentos con espera creciente, el
mensaje va ahí.

**Por qué.** Sin esa cola, RabbitMQ reencolaría el mensaje envenenado sin fin
y bloquearía el procesamiento de todos los demás.

## 8. Los circuit breakers no inventan respuestas

`CatalogClientFallback` **no es uniforme**, y es deliberado:

| Llamada | Fallback |
|---|---|
| `lowStock`, `exportProducts` | lista vacía |
| `resolve`, `decrementStock`, `restoreStock` | **relanza la excepción** |

**Por qué.** En esas tres hay dinero de por medio. Si `resolve` devolviera
lista vacía, el carrito calcularía subtotal 0 y se vendería gratis. Si
`decrementStock` fingiera un "ok", se vendería stock inexistente.

El circuito aquí sirve para que el fallo llegue **de inmediato** en vez de
agotar el timeout de 8 segundos, no para disimularlo.

## 9. El cupón se previsualiza sin gastarlo

`previewCoupon` calcula el descuento sin consumirlo; solo `applyCoupon`, al
confirmar el pedido, incrementa `times_used`.

**Por qué.** Si validar consumiera el cupón, con solo escribirlo en el
checkout se gastaría, y uno de un único uso se perdería sin que nadie
comprara.

Un cupón ya canjeado **no se borra**: se desactiva. Borrarlo dejaría el
historial de los pedidos que lo aplicaron apuntando a algo inexistente.

## 10. Un cupón puede estar activo y aun así no servir

El panel distingue cuatro estados —Activo, Inactivo, **Vencido**,
**Agotado**— usando las banderas `expired` y `exhausted` que calcula el
backend.

**Por qué.** Mostrar "Activo" en un cupón caducado haría que el administrador
no entendiera por qué los clientes se quejan de que no funciona.

## 11. Las reseñas nacen ocultas

Toda reseña entra con estado `pending` y no aparece en la tienda hasta que el
panel la aprueba.

**Por qué.** Es texto de terceros que se muestra en una página pública.

El DTO público **omite el `userId`** a propósito: la ficha no tiene por qué
exponer quién escribió cada reseña. La consecuencia conocida es que el
frontend no puede saber si el cliente ya opinó, así que lo descubre al
enviar y recibir un 409.

## 12. Los favoritos son locales primero

Se guardan en el navegador sin necesidad de cuenta; al iniciar sesión,
`/api/favorites/sync` **fusiona** la lista local con la de la cuenta.

**Por qué local.** Quien compra repuestos suele llegar sin sesión, comparar
dos o tres piezas y volver días después. Pedirle registrarse antes de poder
guardar nada pierde justo esa visita.

**Por qué fusiona y no reemplaza.** Si se sobrescribiera con lo local, abrir
la web en un móvil nuevo borraría los favoritos guardados desde el ordenador.

## 13. Los errores tienen una sola forma

Todos responden `{"statusCode": N, "message": "..."}`, que es lo que el
frontend lee en `e.data.message`. `GlobalExceptionHandler` se encarga de los
que escapan de los controladores.

**El detalle del error va al log, no a la respuesta.** Un `ex.getMessage()`
de un fallo de SQL expone nombres de tablas, y un `NullPointerException`
rutas de clases internas.

## 14. El pedido guarda el precio, no una referencia

Cada `order_item` almacena el precio con el que se vendió.

**Por qué.** Si guardara solo el `productId`, cambiar el precio del catálogo
reescribiría el histórico de ventas y los reportes dejarían de cuadrar.

---

## 15. RabbitMQ lleva órdenes; Kafka, hechos

Conviven las dos mensajerías y no se solapan. El reparto:

| | RabbitMQ (`inventario.stock`) | Kafka (`bytemarket.pedidos`) |
|---|---|---|
| Qué viaja | una **orden**: "descuenta 2 del producto 14" | un **hecho**: "el pedido BM-… pasó a entregado" |
| Consumidores | uno (catalog-service) | cualquiera; hoy support-service |
| Al consumirse | desaparece de la cola | se retiene y se puede releer |
| Si se pierde | el inventario queda mal | el pedido sigue bien, solo nadie avisó |

**Por qué no sobra ninguna.** Son necesidades opuestas. El descuento de stock
quiere una cola de trabajo: un destinatario, ejecútalo exactamente una vez, y
si no se puede apártalo a la cola de fallidos (decisiones 5, 6 y 7). El aviso
al cliente quiere lo contrario: que varios consumidores lean el MISMO evento
sin quitárselo a los demás, y que uno nuevo pueda rebobinar y reconstruir su
estado. Meter el aviso en la cola de stock obligaría a que un solo consumidor
hiciera las dos cosas; meter el descuento en Kafka sería renunciar a la cola
de fallidos.

**La clave del mensaje es el `orderCode`**, no el id. Kafka manda todas las
claves iguales a la misma partición, y eso garantiza que los eventos de un
pedido se lean en el orden en que ocurrieron. Sin clave reparte en
round-robin y "entregado" podría leerse antes que "pago validado".

**Quién avisa no es quien cobra.** El correo lo manda support-service, no
order-service, aunque el cambio de estado ocurra allí. Si lo enviara
order-service, añadir mañana un SMS tocaría el servicio que procesa pagos, y
un SMTP colgado podría frenar un checkout. Publicando el hecho,
order-service se desentiende de quién escucha.

---

## 16. El aviso al cliente también es idempotente

`order_notifications` guarda una fila por `(order_code, estado)`, y se
consulta antes de enviar.

**Por qué.** Kafka entrega *al menos una vez*: si support-service procesa un
evento y muere antes de confirmar el offset, al arrancar lo vuelve a leer.
Sin esa marca el cliente recibiría el mismo correo dos veces, o diez si el
reinicio se repite. Es el mismo recurso que `related_order_id` en el kardex
(decisión 6): **un consumidor de cola solo es correcto si es idempotente**.

La marca de la creación es `__creado` y no `pending`. Si usara `pending`, un
pedido devuelto a ese estado a mano desde el panel no volvería a avisar
nunca, porque la marca ya estaría puesta por el alta.

La fila se guarda también cuando el SMTP rechaza el correo, con
`enviado = false`. Así en base se distingue "el evento llegó y el correo no
salió" de "el evento nunca llegó", que se arreglan de formas distintas.

---

## 17. Las rutas internas del catálogo piden credencial

`/api/internal/**` en catalog-service exige rol `SERVICE`.

**Por qué.** Estaba en `permitAll()`. El gateway no enruta esas rutas, lo que
daba una falsa sensación de privacidad: `docker-compose` publica el 8082, así
que un `curl` desde el host llegaba igual a
`/api/internal/products/stock-decrement` y podía mover inventario sin ser
nadie.

**Cómo, sin inventar un mecanismo nuevo.** order-service firma un JWT con el
mismo secreto que ya comparten los cuatro servicios, con `role: SERVICE`, y
un `RequestInterceptor` de Feign lo adjunta a las tres llamadas al catálogo.
El `JwtAuthenticationFilter` que catalog ya tenía lo valida sin un solo
cambio. Dura cinco minutos: solo tiene que sobrevivir a la llamada que lo usa.

## 18. El día del negocio es el de Lima, no el del contenedor

Los contenedores corren en UTC, así que `created_at` guarda hora UTC. Todas
las cifras por día —el resumen de la portada, el reporte de ventas, la
gráfica— cortan el día en Lima.

**Por qué.** Sin eso, lo vendido a partir de las 19:00 caía en el día
siguiente: a las ocho de la tarde el panel decía "hoy: S/ 0" con la caja
llena, y el cierre del día mostraba las ventas de la noche anterior.

**Por qué no se cambia la zona del contenedor**, que sería más corto. Los
pedidos que ya están guardados se escribieron en UTC; reinterpretarlos como
hora de Lima movería cinco horas todo el histórico. Lo que se corrige es el
corte, no el dato.

**Hay que hacerlo en dos sitios, y uno solo no basta.** `HoraDeLima` traduce
los bordes del rango —qué día es en Lima, y sus 00:00 expresadas en UTC—,
pero el `GROUP BY` agrupa dentro de SQL y no se entera: ahí va
`DATE(CONVERT_TZ(created_at, '+00:00', '-05:00'))`. Con el desfase numérico
y no con `'America/Lima'`: el nombre exige las tablas de zonas horarias de
MySQL, y la imagen de Docker las trae vacías.

El mismo corte aplica al código del pedido (`BM-aaaammdd-nnnn`), que se
imprime en el comprobante del cliente.

## 19. El umbral de stock bajo lo decide catalog

Es una constante en `Product.UMBRAL_STOCK_BAJO`, y los endpoints que lo
aceptan por parámetro lo devuelven en la respuesta.

**Por qué.** Lo tenían por triplicado con valor 10: la lista de existencias,
la tarjeta "Stock bajo" del dashboard y las alertas, cada una con su
`defaultValue`. Con tres copias, cambiarlo en una dejaba al panel diciendo
dos cosas distintas del mismo producto.

**Por qué order-service no manda ninguno.** Los productos son de catalog, así
que el número también. Su parámetro es un `Integer` opcional: cuando llega
null, decide catalog. Y como order-service no puede leer una constante de
otro servicio, catalog le devuelve el umbral que aplicó, para que el panel
pueda escribir "con 5 unidades o menos" sin tener su propia copia.

## 20. Todo lo que cuenta dinero cuenta solo lo cobrado

El resumen de la portada, el reporte de ventas y la gráfica filtran por
estado de pago, no solo por "no cancelado".

**Por qué.** Un pedido pendiente de pago no es una venta todavía. Mezclarlos
hace que dos pantallas den cifras distintas de lo mismo, y entonces no se
puede decidir con ninguna de las dos.

**Ha fallado dos veces, igual.** Primero el desglose por canal, que sumaba
2549.15 bajo un titular que decía 747.59. Después la gráfica de la portada,
que decía 3964.04 el día que la tarjeta de al lado decía 2022.48. Las dos
veces fue una consulta que se quedó con la regla vieja mientras el resto
avanzaba. Por eso ahora la regla vive en una sola consulta, reusada, y no
copiada en cada sitio que la necesita.

## 21. De entregado y de cancelado ya no se sale

`changeStatus` rechaza cualquier cambio desde `delivered` o `cancelled`.

**Por qué, y por qué los dos.** Las dos cosas ya movieron el stock, y
deshacerlas lo movería otra vez en el sentido que no toca:

- **Entregado** significa que las unidades salieron por la puerta.
  Cancelarlo publica una ENTRADA y las devuelve al inventario sin que nadie
  las haya traído.
- **Cancelado** ya devolvió el stock. Sacarlo de ahí —a entregado, por
  ejemplo— **no lo vuelve a descontar**, porque la salida se publica al
  crear el pedido y eso no se repite. El inventario se queda inflado, por
  el mismo sitio y al revés.

Aunque el stock no entrara en juego seguiría estando mal: devolver un
entregado a "pendiente" dice que un pedido que el cliente tiene en casa
está por preparar. El histórico de estados es una auditoría, no un
borrador.

Lo que se hace con una entrega que vuelve es registrar la devolución —una
entrada con su motivo, desde Inventario—, que deja rastro de las dos
cosas: que se vendió y que volvió. Con un pedido cancelado que el cliente
reactiva, se registra un pedido nuevo.

**Dónde se comprueba.** En el servicio, no en el panel. El panel es una de
las formas de llegar, y `/api/admin/**` está abierta a cualquiera con un
token de administrador. El panel, además, sustituye el formulario de
cambio de estado por la explicación: un desplegable sin opciones parece una
pantalla rota.
## 22. El kardex explica la existencia, y si no, se nota

Sumar los `delta` de los movimientos de un producto tiene que dar su stock.
Las dos cifras cuentan lo mismo desde sitios distintos, y mientras cuadren
el histórico sirve para auditar.

**Qué lo rompía.** `setStock(Math.max(0, actual + delta))` recortaba la
existencia a cero, pero el movimiento se guardaba con la cantidad pedida
entera. Vender 5 con stock 2 dejaba la columna en 0 —se habían movido 2— y
el kardex anotando −5. A partir de ahí el histórico dejaba de explicar la
existencia, y nada lo avisaba: ni excepción, ni aviso, ni rastro. El
recorte era invisible.

**Cómo queda.** El movimiento anota lo que SE MOVIÓ, no lo que se pidió, y
el motivo deja escrito que faltaban unidades. La diferencia entre lo pedido
y lo habido se investiga leyendo el kardex, que es para lo que está.

**Por qué el ajuste manual rechaza en vez de recortar.** En la cola, el
mensaje llega cuando la venta ya ocurrió: recortar y anotarlo es lo único
que se puede hacer. En el panel es una persona dando una orden, y si se
equivoca de número lo que necesita es que se lo digan. Para una salida que
de verdad supera lo registrado —mermas que nadie anotó— está "Conté el
almacén", que fija la cifra real.

## 23. El stock se mueve con un UPDATE, no leyendo y guardando

`moverStock` hace la suma dentro del `UPDATE`, con la condición de que el
resultado no sea negativo.

**Por qué.** Leer el stock, sumarle y guardarlo son tres pasos, y entre el
primero y el tercero cabe otra venta: las dos leen 2, las dos escriben 1, y
se ha vendido una unidad que no existía. Es la condición de carrera clásica
del inventario, y **no la arregla validar antes**, porque el hueco está
después de validar.

Dentro del `UPDATE` la suma es atómica y dos peticiones simultáneas se
serializan solas. Cuando no cabe, devuelve 0 filas y quien llama se entera,
en vez de escribir un número inventado.

**Lo que esto todavía no resuelve.** Validar el stock es síncrono y
descontarlo es asíncrono (decisión 5), así que entre la validación del
checkout y el consumo del mensaje sigue cabiendo otra venta. Lo que hace
esto es que esa carrera deje de corromper el dato: se descuenta hasta cero
y queda anotada. La solución completa es reservar en el checkout y
confirmar al pagar, que es como lo resuelven las tiendas grandes y que aquí
no está hecho.

## 24. El stock se aparta antes de vender, y lo apartado caduca

El checkout reserva las unidades en catalog **antes** de guardar el pedido.
Lo disponible pasa a ser `stock - reserved`, no `stock`.

**Por qué.** Validar y descontar no ocurrían en el mismo instante: el
checkout preguntaba "¿hay tres?", le decían que sí, y el descuento llegaba
después por la cola. Entre una cosa y otra cabía otra compra que preguntaba
lo mismo y recibía la misma respuesta, mirando una cifra que ya estaba
comprometida. Dos clientes, una unidad.

Reservar cierra el hueco porque la pregunta y la respuesta son la misma
operación: no se consulta el stock, se intenta coger, dentro de un UPDATE
atómico. Si vuelve vacío, no había.

**Antes de guardar, no después.** Al revés sería tarde: un pedido guardado
con unidades que no hay es una promesa que alguien tendrá que deshacer a
mano. Si el guardado falla después de reservar, se libera en el acto.

**El plazo es lo que hace que no necesite vigilancia.** Entre apartar y
descontar puede caerse cualquier cosa, y sin plazo esas unidades quedarían
retenidas para siempre para un pedido que no existe: el catálogo diría
"agotado" con el almacén lleno. Quince minutos —margen para que un servicio
caído vuelva y la cola entregue lo pendiente— y un barrido cada minuto las
devuelve solas.

**Todo o nada.** Si una línea del carrito no alcanza, se devuelven las que
ya se habían apartado. Media reserva es peor que ninguna: el cliente ve un
error y aun así tendría unidades bloqueadas a su nombre durante el plazo.

**La llave es un UUID, no el código del pedido.** Ese código se genera
antes de guardar, comprobando que no exista ya en la tabla, así que dos
checkouts a la vez pueden sacar el mismo: liberar uno devolvería las
unidades del otro. El código se guarda igual en la reserva, pero solo para
poder rastrear de quién era.

**Cambiar el estado de una reserva lleva la condición dentro del UPDATE.**
El barrido de caducadas y una liberación manual pueden caer sobre la misma
fila a la vez; sin eso, las dos devolverían las mismas unidades y el
`reserved` bajaría el doble de lo que subió.

**Consumir a medias es un error, no un resultado.** Si no se puede
consumir una reserva, se relanza y la transacción se deshace entera: el
mensaje vuelve a la cola y acaba en la de fallidos si insiste. Aceptarlo
dejaría el pedido dado por servido con el stock sin descontar, y nadie
volvería a mirarlo.

**La caja no reserva.** En el mostrador la mercancía se entrega en el acto:
no hay ventana entre prometer y entregar, que es lo único que la reserva
protege. `descontar` consume la reserva si existe y descuenta directo si
no, que es también lo que pasa con los pedidos anteriores a esto.

## 25. Una venta de mostrador pertenece a un turno de caja

`/admin/caja` no cobra si no hay turno abierto. Cada venta guarda su
`cash_session_id`, y al cerrar se cuadra:

    esperado   = fondo + ventas en efectivo + ingresos − retiros − gastos
    diferencia = contado − esperado

**Por qué obligatorio.** Una venta que no pertenece a ningún turno no
aparece en ningún arqueo, y basta una para que el cuadre del día deje de
significar nada: el cajón tendría dinero que el sistema no sabe explicar.

**Por qué solo el efectivo.** Yape, tarjeta y transferencia se informan
—el encargado quiere ver el total del turno— pero no entran en el
esperado: ese dinero nunca pasó por el cajón. Sumarlo es el error típico y
hace que la caja descuadre siempre por la misma cantidad sin que nadie
entienda por qué.

**Por qué el esperado NO se enseña con la caja abierta.** `resumen()` lo
omite mientras el turno está abierto, y eso es parte de la regla, no de la
pantalla: quien ve la cifra objetivo deja de contar y la copia, y entonces
el arqueo no detecta nada —que es justo para lo que existe—.

**Por qué se congela al cerrar.** Recalcularlo al leer el histórico daría
otra cifra en cuanto se anulara una venta de ese turno, y un arqueo
firmado no puede cambiar a posteriori.

**Por qué por persona y no por local.** Encaja con que el comprobante ya
imprime quién atendió, y hace que un faltante tenga dueño. Con una caja
compartida el descuadre aparece y no hay a quién preguntar.

**Los movimientos exigen motivo.** Un retiro de 200 soles sin explicar es
indistinguible de un faltante cuando alguien revise el turno dentro de un
mes.

**El pedido a mano no lleva turno.** Un WhatsApp o un teléfono no pasan
por el cajón: se cobran después, por Yape o transferencia. Solo el canal
`caja` exige turno abierto.

---

## 26. El que vende no es el que cuadra

Cuatro roles, y la línea que los separa es una sola:

| rol | es | puede |
|---|---|---|
| `superadmin` | gerente | todo, más métodos de pago y configuración |
| `admin` | encargado de tienda | toda la operación; apertura y arquea |
| `jefe_ventas` | jefe de ventas | apertura cajas, entrega fondos, mueve efectivo, arquea, da de alta cajeros |
| `cajero` | cajero | vende y atiende |

**Por qué la caja tiene dos personas.** `CashSession` guarda `cashier_id`
—de quién es el cajón— y `opened_by` —quién entregó el fondo—. Antes eran
la misma columna, y eso significaba que el cajero se abría su caja con el
fondo que quisiera y declaraba él solo lo que había al final: el arqueo lo
firmaba exactamente a quien vigila. Salía un papel, pero no era un
control. Separarlas es lo que convierte esto en control interno y no en un
formulario.

**Qué no ve quien va a contar.** Con la caja abierta, `paraArqueo()` no
devuelve ni un importe: ni ventas, ni efectivo, ni desglose. Solo cuántas
ventas hubo y de qué formas, para saber qué comprobantes juntar. Es la
misma regla del esperado (decisión 25) llevada hasta el final: contar Yape
teniendo delante «Yape: 900» no es contar. Al cajero sí se le enseña lo
que cobró en su propia barra, porque él no es quien cuenta.

**Por qué el cajero no pone el precio.** En el mostrador se regatea, y el
encargado y el jefe pueden mover el precio de una línea o aplicar un
descuento a mano. El cajero no. Vendiendo a 10 soles una batería de 155,
el cajón **cuadra perfecto** al final del turno —el sistema esperaba 10— y
los 145 no aparecen por ningún lado. No es un descuadre que se pueda ver
contando dinero, así que la única defensa es que no pueda tocar el precio.
Lo rechaza `PanelSaleService`, y la pantalla además no le enseña el campo.

**Dónde se decide.** En `SecurityConfig` de order-service, con reglas
específicas antes del comodín: el orden importa porque Spring se queda con
la primera que casa. El menú y el middleware del front filtran lo mismo,
pero solo para no mandar a nadie contra un 403: la decisión es del
servicio.

**Límite conocido.** `cashierName` lo manda el cliente y se guarda como
etiqueta para el papel; lo que identifica al cajero es `cashier_id`.
Ningún permiso se decide con el nombre. order-service tampoco comprueba
que el id sea de un cajero —no tiene cliente de user-service— así que un
jefe podría aperturar una caja a nombre de alguien que no lo es. No da
acceso a nada: para cobrar hace falta el rol igualmente.

---

## 27. Cada forma de pago se cuadra contra su propio comprobante

El arqueo dejó de ser una sola cifra. `cash_counts` guarda una línea por
forma y turno, con lo esperado, lo contado y la diferencia:

    efectivo  → el dinero del cajón, contado a mano
    tarjeta   → el cierre de lote del POS (Niubiz)
    yape/plin → los abonos recibidos en la cuenta del negocio

**Por qué no basta el efectivo.** Con un arqueo de solo efectivo, un turno
con el cajón perfecto y 50 soles de Yape que nunca llegaron sale en verde.
Esa diferencia no aparece hasta que alguien revise el banco a fin de mes,
y para entonces ya no se sabe de qué turno era.

**Qué entra en cada esperado.** El fondo inicial y los movimientos solo
cuentan en el efectivo, porque es el único dinero que pasa por el cajón.
En las demás formas lo esperado son las ventas del turno y nada más.

**El efectivo siempre está; el resto, solo si tuvo ventas.** El fondo
sigue en el cajón aunque no se haya cobrado nada en efectivo, y hay que
devolverlo. Pedir el cierre de lote un día que nadie pagó con tarjeta es
ruido, y el ruido hace que el arqueo se rellene sin mirar.

**No se cierra a medias.** Si una forma tuvo ventas y no se declara, el
cierre se rechaza nombrándola. Un arqueo incompleto que parece completo es
peor que no tenerlo: el papel saldría firmado dando por bueno un dinero
que nadie contó.

**El papel.** Al cerrar se imprime un comprobante de 80 mm —el mismo rollo
de los tickets de venta— con el desglose, los movimientos y dos líneas de
firma: el cajero reconoce con qué entregó la caja, el encargado que lo
contó él. Es el artefacto físico que cierra el circuito; por eso el
sistema no guarda ninguna "firma digital" que no significaría nada.

---

## Qué está comprobado y qué no

Lo escrito arriba son decisiones tomadas; esto es hasta dónde llega la
comprobación de cada una. Vale la pena mirarlo antes de dar algo por
seguro.

**Comprobado con pruebas automáticas y CI en verde.** 197 pruebas entre
los cuatro servicios —12 en user, 80 en order, 71 en catalog, 34 en
support—. Cubren las reglas de negocio, la invariante del kardex, el plan
de carga del pedido, el ciclo completo de una reserva —apartar, consumir,
liberar, caducar— y el arqueo por forma de pago, contra una base en
memoria.

**Comprobado contra el sistema corriendo.** Los endpoints del panel, las
cifras del dashboard y del reporte, la paginación, y el corte del día en
hora de Lima, este último con un pedido de prueba insertado dentro de la
franja problemática y borrado después.

También el turno de caja entero, con los cuatro roles autenticados de
verdad: el jefe apertura la caja del cajero con su fondo, el cajero vende
en efectivo y por Yape, el jefe retira, y el cierre se rechaza mientras
falte una forma por contar. El arqueo final dio cajón exacto y 54.79 de
Yape sin abonar —el caso que justifica la decisión 27—. También se
comprobó lo que cada rol NO puede: el cajero no se apertura la caja, no
cierra, no lista pedidos y no mueve el precio. Los datos de esa prueba se
borraron después, devolviendo las unidades al stock.

**NO comprobado de punta a punta.** El flujo de compra completo cruza dos
servicios y RabbitMQ: el checkout reserva por Feign, el pedido se guarda,
el mensaje viaja por la cola y catalog consume la reserva al otro lado.
Cada tramo tiene su prueba; la cadena entera, ninguna. Lo primero que hay
que hacer al levantar el sistema es una compra normal y mirar que
`products.reserved` vuelve a cero después.

**Comprobado visualmente.** Las pantallas de caja, cajas, usuarios,
dashboard, reportes, inventario y pedidos se han abierto en un navegador
real con cada rol, mirando la captura y la consola. Así salieron dos
fallos que ninguna prueba automática iba a ver: clases con `scoped`
reutilizadas desde otra pantalla —el modal salía sin estilo— y el CSS de
impresión que apagaba la página entera. El resto del panel —cupones,
categorías, banners, reseñas, reclamaciones, métodos de pago— sigue
verificado solo como "responde 200".

**Sin tocar.** La tienda pública: portada, catálogo, ficha, carrito y
checkout desde el lado del cliente. Los cambios de catalog la afectan —lo
disponible ahora descuenta lo reservado—, así que merece una pasada.

---

## Trampas conocidas

Cosas que ya han fallado una vez y conviene no repetir.

**Un `@media print` sin condición alcanza a todo el panel.** La pantalla
de caja tenía `body * { visibility: hidden !important }` en un `<style>`
sin `scoped` —lo necesita, para llegar al `<body>`—. El bundle agrupa las
rutas vecinas, así que esa hoja se carga en medio panel: imprimir desde
cualquier otra pantalla sacaba un folio en blanco. Ahora cuelga de una
clase que se pone y se quita alrededor de `window.print()`. Si se añade
otra impresión, misma receta y clase propia.

**`startsWith` con rutas que comparten prefijo.** El middleware mandaba al
cajero a su caja con `!to.path.startsWith('/admin/caja')`, y eso también
casaba con `/admin/cajas` —la pantalla de su jefe—. Entraba y veía una
tabla vacía, que es la peor forma de decir que no. Comparación exacta.

**El orden de las rutas del gateway importa.** Las `/api/admin/**` van
declaradas antes que los comodines; si no, catálogo y pedidos se las tragan.
Y `/api/admin/inventory/backfill` va la primera de todas, porque la sirve
order-service y no catálogo.

**`/api/internal/**` no se enruta en el gateway a propósito.** Es
comunicación servicio a servicio por Feign; exponerla la haría alcanzable
desde fuera.

**La propiedad del circuit breaker de Feign cambió de sitio.** Desde Spring
Cloud 2022 es `spring.cloud.openfeign.circuitbreaker.enabled`. Escrita como
`feign.circuitbreaker.enabled` **se ignora en silencio**: los circuitos
aparecen registrados en el actuator pero no interceptan nada.

**Los `LocalDate` no se formatean con `new Date()`.** Una fecha sin hora
parseada así se lee como medianoche UTC y, al pintarla en la zona de Lima,
retrocede un día.

**Un `DATE(created_at)` a secas agrupa por día UTC.** Es la misma trampa de
arriba vista desde SQL, y no la arregla ajustar el rango desde Java: el
`GROUP BY` ya pasó. Va `CONVERT_TZ(created_at, '+00:00', '-05:00')` dentro
de la función, y en el `SELECT`, el `GROUP BY` y el `ORDER BY` a la vez.

**En el frontend, `config.public.*` se tipa como `unknown`.** No es culpa
del código: hay dos copias de `@nuxt/schema` en `node_modules` —la 3.21.11
que trae nuxt y la 4.5.2 que arrastra `@nuxt/ui`— y la augmentación de tipos
que genera Nuxt aterriza en la que `useRuntimeConfig()` no usa. `skipLibCheck`
esconde el motivo. Hay que afirmar el tipo al leerlo; en `useLogo` está hecho
y comentado.

**Un componente Vue con estilos propios para algo que ya existe.** Las clases
`sp-*` del panel cubren tarjetas, pastillas, botones de fila, pestañas y
tablas. Cada pantalla que inventó las suyas acabó con otro verde, otro radio
y otro grosor de icono; ver el README del frontend antes de escribir CSS
nuevo.

**Comprobar y actuar en dos pasos.** Es la forma que tuvieron casi todos
los fallos de integridad de este proyecto, y reaparece disfrazada:

- leer el stock, decidir, y guardarlo → dos ventas leen 2 y las dos
  escriben 1;
- validar en el checkout y descontar al llegar el mensaje → dos clientes
  se llevan la última unidad;
- leer una reserva, mirar su estado y escribirlo → el barrido y una
  liberación la devuelven dos veces.

El arreglo es siempre el mismo: que la condición viaje DENTRO del
`UPDATE` y se mire cuántas filas cambió. Cero filas significa que otro se
adelantó; una, que la operación es tuya. Validar antes no sirve, porque el
hueco está después de validar.

Y el matiz que costó tres intentos: **arreglarlo en el camino principal no
basta**. Las rutas de excepción —el respaldo cuando no cabe, el reintento,
el fallback— se escriben con prisa y nadie las mira, y ahí volvió a
colarse el mismo error tres veces en la misma tarde.

**Un 4xx de otro servicio no es una caída.** El 409 de "no hay stock"
contaba como fallo del circuit breaker de Feign: un producto agotado
popular lo abría y el fallback rechazaba TODAS las compras durante quince
segundos, también las de productos que sí había. Va en `ignoreExceptions`.
Lo mismo valdría para cualquier 4xx: son respuestas, no averías.

**El código del pedido no vale como llave de nada.** `BM-aaaammdd-nnnn` se
genera ANTES de guardar, comprobando que no exista ya en la tabla, así que
dos checkouts simultáneos pueden sacar el mismo. Para el cliente está bien;
para agrupar reservas o cualquier cosa que deba ser única, hace falta un
UUID.


**`kafkaTemplate.send()` bloquea aunque parezca asíncrono.** Mientras busca
los metadatos del topic retiene el hilo de la petición hasta `max.block.ms`,
que por defecto es **un minuto**, y el `try/catch` de alrededor no lo
atrapa porque no es una excepción: es espera. Con un broker que no resuelve,
cada compra y cada cambio de estado se quedan colgados. Lo mismo vale para
`convertAndSend` de RabbitMQ y su `connection-timeout`. Los dos están
acotados en `application.yml` de order-service; si se añade otro productor,
acotarlo también.

**Una JVM sin `-Xmx` se cree dueña del 25% de la RAM de la máquina.** Son
siete servicios Java: sin `mem_limit` en el compose, en un portátil justo el
sistema empieza a usar swap y se vuelve lento todo a la vez, lo que despista
porque no apunta a ninguna pantalla concreta. Los topes están en los dos
`docker-compose`; ojo si se añade un servicio nuevo, que no los hereda solo
—solo los que usan el ancla `*servicio-negocio`—.


**Las instancias de resilience4j NO se llaman como el método.** Spring Cloud
registra el circuito quitando `#`, `(`, `)` y las comas de la firma:

```
CatalogPricingClient#resolve(List)   →   CatalogPricingClientresolveList
CatalogReportingClient#lowStock(int) →   CatalogReportingClientlowStockint
```

Escritas con la firma completa, **resilience4j ignora la instancia en
silencio** y aplica `configs.default`. En los circuitos no se notaba, porque
el default es lo que querían de todas formas; en el `timelimiter` sí: el
recorte a 3s de las lecturas del panel no se aplicaba nunca y esperaban los
8s del checkout. Los nombres reales se consultan en
`/actuator/circuitbreakers`.

**Un circuito abierto no debe tumbar el healthcheck.** `registerHealthIndicator`
añade los circuitos a `/actuator/health`, pero resilience4j deja
`allowHealthIndicatorToFail` en `false` y eso es lo correcto: si catalog cae,
order-service tiene que seguir atendiendo. Que un circuito abierto lo marcara
`DOWN` sacaría de servicio justo al que está aguantando la caída. Mismo
criterio que con el `MailHealthIndicator` en support-service.

**`show-details: never` oculta los componentes a todo el mundo.** Se puede
registrar un health indicator y no poder consultarlo nunca: el
`/actuator/health` devolvía `{"status":"UP"}` con un circuito abierto. Hoy es
`when-authorized`, así que el anónimo —el healthcheck de Docker— ve solo el
status y el staff ve el detalle.

**Del actuator se exponen `health`, `circuitbreakers`, `circuitbreakerevents`
y `metrics`,** y todo salvo `health` exige rol de staff. Siguen fuera `env`,
`beans`, `mappings` y `configprops`: revelan configuración interna.

**El frontend se construye con Node 26.** Es la versión que generó el
`package-lock.json`; con Node 22, `npm ci` falla al leer las copias anidadas
de `unplugin`.

---

## Preguntas frecuentes

Las que suelen aparecer al revisar o defender el proyecto, respondidas desde
el código.

### ¿Por qué microservicios y no un monolito?

Para un catálogo de este tamaño, un monolito sería más simple — y de hecho
existió: queda un esquema `bytemarket` sin sufijo, de cuando todo estaba
junto. La separación responde al objetivo del curso y a que cada área
(catálogo, pedidos, usuarios, soporte) evoluciona por su lado.

El precio que se paga está a la vista: un cambio que cruce servicios son
varios commits en varios repositorios, y hay que resolver cosas que un
monolito regala, como la consistencia del inventario.

### ¿Cómo se comunican los servicios entre sí?

De tres formas, cada una para lo suyo:

| Forma | Dónde | Cuándo |
|---|---|---|
| **HTTP vía gateway** | navegador → cualquier servicio | todo lo que pide el cliente |
| **Feign + Eureka** | order → catalog | cuando se necesita la respuesta **ya** (precios, stock) |
| **RabbitMQ** | order → catalog | cuando no se puede perder pero puede esperar (descuento de stock) |

### ¿Para qué sirve Eureka? ¿No bastaría con poner las IPs?

Las IPs cambian: en Docker cada contenedor recibe una distinta al reiniciarse.
Eureka es la libreta de direcciones — cada servicio se registra al arrancar y
el gateway pregunta "¿dónde está catalog?" en vez de tenerlo escrito.

Por eso el compose usa `EUREKA_INSTANCE_PREFER_IP_ADDRESS=true`: sin eso cada
servicio se registra con el hostname del contenedor (su id), que no siempre
se resuelve.

### ¿Qué pasa si se cae un servicio?

Depende de cuál:

| Se cae | Consecuencia |
|---|---|
| `catalog-service` | No se puede comprar (no hay precios ni stock). El panel sigue, con las tarjetas de catálogo vacías |
| `order-service` | No se puede comprar ni ver pedidos. El catálogo se navega igual |
| `user-service` | No se puede iniciar sesión. Lo público sigue funcionando |
| `support-service` | Solo afecta a reclamaciones |
| `eureka` | Lo ya registrado sigue funcionando un rato; los reinicios fallan |
| `RabbitMQ` | Los pedidos se confirman pero el descuento de stock se pierde, como antes de la cola |

### ¿Cómo evitas que alguien compre a un precio manipulado?

El frontend manda **solo** `productId` y `quantity`. `CartService` pide el
precio real a catalog-service y calcula el total con él. Con los cupones
igual: viaja el código, nunca el descuento.

### ¿Y que compre algo sin stock?

`CartService` valida contra el stock del catálogo antes de confirmar, y suma
las cantidades repetidas del mismo producto en el carrito.

**Honestamente, no es a prueba de todo:** entre validar y descontar hay un
hueco, así que dos clientes comprando la última unidad a la vez podrían
pasar. Resolverlo bien pide una reserva con bloqueo en catalog, que no está
implementada.

### ¿Por qué cada servicio tiene su propia base de datos?

Es lo que hace que sean independientes de verdad. Si compartieran esquema,
un cambio de columna en `products` rompería a quien no debía, y no se podría
desplegar uno sin el otro.

El coste: no hay `JOIN` entre servicios. Por eso `reviews` guarda
`product_id` como columna suelta y el panel resuelve los nombres en dos
pasos.

### ¿Por qué el descuento de stock va por cola y la validación no?

Porque son preguntas distintas. "¿Hay stock?" la necesita el cliente **antes
de pagar**, así que tiene que ser síncrona. "Descuenta 3 unidades" no
necesita respuesta: el pedido ya está confirmado.

Y como no se puede perder, va por una cola que la guarda hasta que catalog
pueda aplicarla.

### ¿Qué pasa si el mismo mensaje llega dos veces?

No pasa nada, y está probado. `StockService` comprueba si ya existe un
movimiento de kardex con ese `related_order_id`, `product_id` y tipo. Es
obligatorio: RabbitMQ garantiza entrega **al menos una vez**.

### ¿Cuándo se abre el circuit breaker?

Tras **5 fallos** sobre una ventana de 10 llamadas con más del 50% de error.
Mientras está abierto responde al instante en vez de agotar el timeout de 8
segundos. A los 15 segundos deja pasar 3 pruebas y, si van bien, se cierra
solo.

Su estado se consulta en `/actuator/health`.

### ¿Por qué el token no está en localStorage?

Porque cualquier script que acabe en la página podría leerlo. Vive en una
cookie sellada que el navegador no puede abrir, y el token real se queda en
el servidor de Nuxt, que es quien lo adjunta al llamar al gateway.

### ¿Cómo se despliega?

`git push` → GitHub Actions construye la imagen y la publica en Docker Hub →
el servidor hace `pull` y `up -d`. Siete repositorios, siete imágenes, cada
uno con su pipeline.

En el servidor solo hacen falta tres archivos: el `docker-compose.prod.yml` y
los dos `.env`. Ni Java, ni Node, ni código fuente.

### ¿Se puede escalar?

A nivel de arquitectura sí: Eureka permite varias instancias del mismo
servicio y el gateway reparte entre ellas.

Lo que **no** está resuelto hoy: los cuatro servicios son *stateless*, pero
el descuento de stock no tiene bloqueo optimista, así que varias instancias
de catalog procesando pedidos a la vez podrían pisarse.

### ¿Qué falta por hacer?

Dicho sin maquillaje:

- **Tests donde no los hay.** Son 47 y de buena calidad —27 en order-service
  y 20 en catalog—, pero cubren solo esos dos: user, support, gateway y el
  frontend no tienen ninguno.
- **Reserva de stock con bloqueo**, para cerrar el hueco entre validar y
  descontar.
- **Reseñas duplicadas**: el cliente descubre que ya opinó al enviar, porque
  el endpoint público oculta el autor a propósito.
- **Validación del JWT en el gateway**, hoy cada servicio verifica por su
  cuenta.
