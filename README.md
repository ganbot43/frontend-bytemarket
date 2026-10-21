# frontend-bytemarket

Tienda y panel de administración de **ByteMarket**, hecho con Nuxt 3.

Parte del sistema ByteMarket, una tienda de repuestos y accesorios para
celulares construida con microservicios Spring Boot y este frontend.

## Qué hace

- **Tienda**: portada, catálogo con filtros, ficha de producto, carrito,
  checkout, seguimiento de pedidos y libro de reclamaciones.
- **Panel** (`/admin`): dashboard, caja, pedidos, productos, categorías,
  subcategorías, inventario, banners, cupones, reseñas, reclamaciones,
  usuarios, métodos de pago, reportes y configuración.

## No habla con ninguna base de datos

Es intencional. Cada microservicio es dueño de su esquema y el frontend solo
habla HTTP con el gateway:

```
Nuxt ──HTTP──> :8085 gateway ──> user-service     ──> bytemarket_user
                              ──> catalog-service  ──> bytemarket_catalog
                              ──> order-service    ──> bytemarket_order
                              ──> support-service  ──> bytemarket_support
```

Todo `/api/**` que no tenga manejador propio se reenvía al gateway desde
`server/api/[...path].ts`, añadiendo el JWT de la sesión como `Bearer`. Si el
frontend se conectara a las bases directamente se saltaría las reglas de
negocio de los servicios — por ejemplo, la que impide comprar a un precio
que no sea el del catálogo.

## Cómo levantarlo

### Con Docker (recomendado)

El frontend necesita el gateway respondiendo, así que lo normal es levantar
todo junto desde la carpeta padre:

```bash
cd ..
docker compose up -d
```

Queda en http://localhost:3000. Para ver su log o reconstruirlo tras un
cambio:

```bash
docker compose logs -f frontend
docker compose up -d --build frontend
```

El `Dockerfile` es multietapa: construye con Nuxt y la imagen final solo
lleva `.output`, sin `node_modules` ni código fuente.

> Se construye con **Node 26**, la misma versión con la que se generó el
> `package-lock.json`. Con Node 22 el `npm ci` falla al leer las copias
> anidadas de `unplugin`, porque npm 10 y npm 11 interpretan el lock distinto.

### A mano

Requisitos: **Node 26 y npm 11**, los mismos con los que se generó el
`package-lock.json`, y el stack de microservicios arrancado (como mínimo el
gateway en el 8085). Con npm 10 el `npm ci` falla al leer las copias
anidadas de `unplugin`; `npm install` sí funciona, pero reescribe el lock.

```bash
cp .env.example .env     # y rellena los valores
npm install
npm run dev
```

Queda en http://localhost:3000 (o el siguiente puerto libre).

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Construye para producción en `.output` |
| `npm run preview` | Sirve lo construido, para comprobarlo antes de desplegar |
| `npm run typecheck` | Revisa los tipos de **todo** el proyecto |
| `npm run verificar:permisos` | Comprueba la matriz de permisos contra el sistema levantado |

Sobre `verificar:permisos`: hace falta el sistema corriendo (`docker compose
up -d`) porque recorre el camino entero —gateway, servicio, matriz real en
MySQL— con los cuatro puestos del panel. Los tests de cada microservicio
prueban su propio portero con la matriz simulada; esto comprueba lo que
ninguno de ellos ve: una ruta que el gateway no enruta, un módulo que no
concede lo que dice conceder, o una sesión que no trae el rol que debería.
Un 400 o un 409 en su salida son correctos: el cuerpo va vacío a propósito,
porque lo que se mira es la puerta y no el formulario.

Sobre `typecheck`: el servidor de tipos del editor solo analiza los archivos
abiertos, así que un error puede llevar semanas en una página que nadie ha
tocado. Este comando los saca todos de una vez y es lo que conviene correr
antes de commitear. TypeScript está fijado en la 5.x a propósito: la 7
—el port nativo— ya no expone `./lib/tsc` y `vue-tsc` no arranca con ella.

Credenciales de prueba, si corriste el sembrado de los servicios:

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@bytemarket.com` | `admin123` |
| Superadmin | `owner@bytemarket.com` | `admin123` |
| Cliente | `cliente@bytemarket.com` | `cliente123` |

## Configuración

Las credenciales se leen del `.env`, que **no se versiona**. Mira
`.env.example` para saber qué rellenar. La más importante:

```
NUXT_API_GATEWAY_URL=http://localhost:8085
```

## API propia del frontend

Casi todo `/api/**` se reenvía tal cual al gateway. Las únicas rutas que
resuelve Nuxt por su cuenta son las de sesión, porque el token no debe
llegar nunca al navegador:

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | Llama al gateway, guarda el JWT en la **sesión sellada** y devuelve solo `{user}` |
| `POST` | `/api/auth/register` | Registra y deja la sesión iniciada |
| `POST` | `/api/auth/logout` | Cierra sesión y limpia la cookie |
| `GET` | `/api/auth/me` | Usuario de la sesión, sin llamar al backend |
| `*` | `/api/**` | Todo lo demás: proxy al gateway con el JWT como `Bearer` |

El token vive en una cookie sellada y cifrada (`nuxt-auth-utils`), no en
`localStorage`: así no es accesible desde JavaScript del navegador.

## Páginas

| Ruta | Qué es |
|---|---|
| `/` | Portada: carrusel, categorías, lo más pedido |
| `/productos` · `/productos/{slug}` | Catálogo con filtros y ficha de producto |
| `/checkout` | Finalizar compra |
| `/pedido/{code}` | Seguimiento de un pedido |
| `/mi-cuenta` · `/mi-cuenta/pedidos` | Datos del cliente y su historial |
| `/favoritos` | Lista de deseos |
| `/libro-de-reclamaciones` | Reclamos (obligatorio en Perú) |
| `/terminos` · `/privacidad` · `/sobre-nosotros` | Páginas informativas |
| `/login` | Inicio de sesión |
| `/admin` | Panel. Resumen del día, y desde ahí cada sección |
| `/admin/caja` | Venta de mostrador: cobra, calcula el vuelto e imprime |
| `/admin/pedidos` | Pedidos de la tienda y de los otros canales |
| `/admin/productos` · `/admin/categorias` · `/admin/subcategories` | Catálogo |
| `/admin/inventario` | Existencias y kardex, en dos pestañas |
| `/admin/reportes` | Ventas de un período, comparadas con el anterior |
| `/admin/usuarios` · `/admin/banners` · `/admin/cupones` · `/admin/resenas` · `/admin/reclamaciones` | Gestión |
| `/admin/metodos-pago` · `/admin/configuracion` | Solo superadmin |

`/admin` exige rol `admin` o `superadmin`; a un cliente lo manda a
`/mi-cuenta`.

## Estructura

```
pages/(landing)/     portada y páginas informativas
pages/(ecommerce)/   catálogo, carrito, checkout, mi cuenta
pages/admin/         panel de administración
server/api/          proxy al gateway y manejadores de sesión
stores/              carrito y favoritos (Pinia, persistidos en el navegador)
composables/         lógica compartida de presentación
```

Los paréntesis en `(landing)` y `(ecommerce)` son **grupos de rutas** de
Nuxt: agrupan archivos sin aparecer en la URL. Por eso
`pages/(landing)/index.vue` responde en `/`, y no debe existir además un
`pages/index.vue` o competirían por la misma ruta.

## El panel usa un juego de clases, no estilos sueltos

Todo `/admin` se pinta con las clases `sp-*` de `assets/css/admin-panel.css`.
Si vas a añadir una pantalla, cópiala de **`pages/admin/productos/index.vue`**,
que es la que mejor sigue el patrón.

| Clase | Para qué |
|---|---|
| `sp-page` | Cuerpo de la página: columna con la separación entre bloques ya puesta. **No añadas `padding`**: ya lo pone `.admin-shell__main` y se suma |
| `sp-page-toolbar` | Cabecera: título, subtítulo y el botón de acción |
| `sp-card` · `sp-card__head` | Tarjeta de contenido |
| `sp-table-wrap` › `sp-table-scroll` › `sp-table` | Tabla, con `sp-th` / `sp-tr` / `sp-td` |
| `sp-badge` + `--success` `--danger` `--warning` `--neutral` | Pastilla de estado. Lleva un `<span class="sp-badge__dot">` dentro |
| `sp-table-actions` › `sp-table-btn` + `--edit` `--view` `--warn` `--del` | Botones de la fila, con icono de `lucide-vue-next` |
| `sp-tabs` · `sp-tab` | Pestañas dentro de una pantalla |
| `sp-segmented` · `sp-segmented__btn` | Elegir entre pocas opciones excluyentes |

Y dos componentes compartidos que evitan reescribir lo mismo:
`<SharedBarraTabla>` para el buscador con filtros y `<SharedPaginacion>`
para la paginación, que va **de diez en diez** en todos los listados.

La regla práctica: antes de escribir un `style=""` o una clase propia de
colores, busca si ya existe la clase `sp-*`. Casi siempre existe, y cuando
cada pantalla inventa la suya acaban conviviendo cuatro verdes distintos
para decir "activo".

## Documentación del sistema

Además de este README, el repositorio guarda los documentos que valen para
todo ByteMarket, no solo para el frontend:

| Documento | Para qué |
|---|---|
| [`README-GENERAL.md`](README-GENERAL.md) | Levantar el sistema entero y el día a día con Docker |
| [`BYTEMARKET-DECISIONES.md`](BYTEMARKET-DECISIONES.md) | Por qué el código hace lo que hace: lógica de negocio, matices y trampas conocidas |
| [`BYTEMARKET-DEPLOY.md`](BYTEMARKET-DEPLOY.md) | Desplegar en otra PC o servidor, solo con Docker |
| [`BYTEMARKET-WORKFLOW.md`](BYTEMARKET-WORKFLOW.md) | Onboarding, desarrollo local y CI/CD |

**Están duplicados a propósito, y hay que mantenerlos a la par.** La copia
de trabajo vive en la carpeta padre, junto al `docker-compose.yml`, que es
desde donde se usan; pero esa carpeta no es un repositorio, así que la copia
versionada —y la única con respaldo e historial— es esta. Si cambias uno
arriba, cópialo aquí y commitea.

## El sistema completo

| Repositorio | Puerto | Función |
|---|---|---|
| `bytemarket-eureka-server` | 8761 | Registro de servicios |
| `bytemarket-api-gateway` | 8085 | Punto de entrada único |
| `bytemarket-user-service` | 8081 | Cuentas, autenticación JWT, perfiles |
| `bytemarket-catalog-service` | 8082 | Productos, categorías, banners, inventario |
| `bytemarket-order-service` | 8083 | Pedidos, métodos de pago, cupones |
| `bytemarket-support-service` | 8084 | Libro de reclamaciones |
| `frontend-bytemarket` | 3000 | Este repositorio |

Orden de arranque: **Eureka primero**, luego los servicios de negocio, el
gateway al final y el frontend cuando el gateway responda.
