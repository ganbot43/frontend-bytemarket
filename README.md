# frontend-bytemarket

Tienda y panel de administración de **ByteMarket**, hecho con Nuxt 3.

Parte del sistema ByteMarket, una tienda de repuestos y accesorios para
celulares construida con microservicios Spring Boot y este frontend.

## Qué hace

- **Tienda**: portada, catálogo con filtros, ficha de producto, carrito,
  checkout, seguimiento de pedidos y libro de reclamaciones.
- **Panel** (`/admin`): productos, categorías, banners, inventario, pedidos,
  métodos de pago, reclamaciones, usuarios y reportes.

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

Requisitos: **Node 20+** y el stack de microservicios arrancado (como mínimo
el gateway en el 8085).

```bash
cp .env.example .env     # y rellena los valores
npm install
npm run dev
```

Queda en http://localhost:3000 (o el siguiente puerto libre).

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
