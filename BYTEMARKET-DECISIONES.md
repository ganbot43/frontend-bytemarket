# Decisiones de diseño y lógica de negocio — ByteMarket

Este documento recoge **por qué** el código hace lo que hace. No describe la
API ni cómo levantar el proyecto —eso está en el README de cada repositorio y
en `BYTEMARKET-WORKFLOW.md`—, sino las decisiones que no se deducen leyendo
las clases, y que si alguien "simplifica" sin saber, rompe algo.

**Contenido:** [el proyecto en cifras](#el-proyecto-en-cifras) ·
[mapa del código](#mapa-del-código) · [las decisiones](#1-el-frontend-nunca-habla-con-mysql) ·
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
| Tablas | 18 |

| Esquema | Tablas |
|---|---|
| `bytemarket_user` | `users`, `customers`, `business_config` |
| `bytemarket_catalog` | `products`, `product_images`, `categories`, `subcategories`, `banners`, `reviews`, `favorites`, `inventory_movements` |
| `bytemarket_order` | `orders`, `order_items`, `order_status_logs`, `payment_methods`, `coupons` |
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
---

## Trampas conocidas

Cosas que ya han fallado una vez y conviene no repetir.

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
