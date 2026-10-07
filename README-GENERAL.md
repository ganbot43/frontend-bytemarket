# ByteMarket

Tienda de repuestos y accesorios para celulares. Son **siete repositorios**:
seis microservicios Spring Boot y un frontend Nuxt 3, orquestados desde aquí
con Docker Compose.

```
navegador ──> frontend :3000 ──> gateway :8085 ──┬─> user-service    :8081 ─> bytemarket_user
              (Nuxt 3)          (Spring Cloud)   ├─> catalog-service :8082 ─> bytemarket_catalog
                                       │         ├─> order-service   :8083 ─> bytemarket_order
                                  eureka :8761   └─> support-service :8084 ─> bytemarket_support
```

El frontend nunca habla con MySQL: todo `/api/**` que no tenga manejador
propio en Nuxt se reenvía al gateway, añadiendo el JWT de la sesión.

## Levantarlo todo

Requisitos: **Docker** y los dos `.env` (ver más abajo).

```bash
docker compose up -d
```

Eso es todo. Queda en **http://localhost:3000**.

| Servicio | Puerto | Qué es |
|---|---|---|
| `frontend` | 3000 | Tienda y panel de administración |
| `gateway` | 8085 | Punto de entrada único de la API |
| `eureka` | 8761 | Registro de servicios (tiene panel web) |
| `user-service` | 8081 | Cuentas, login, JWT, perfiles |
| `catalog-service` | 8082 | Productos, categorías, banners, inventario |
| `order-service` | 8083 | Pedidos, pagos, cupones, reportes |
| `support-service` | 8084 | Libro de reclamaciones |
| `mysql` | **3308** | Un esquema por servicio (dentro de Docker sigue siendo el 3306) |

Credenciales de prueba:

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@bytemarket.com` | `admin123` |
| Superadmin | `owner@bytemarket.com` | `admin123` |
| Cliente | `cliente@bytemarket.com` | `cliente123` |

### La primera vez tarda

La primera construcción compila los seis servicios con Maven **dentro de cada
contenedor**, así que descarga las dependencias seis veces: entre 10 y 20
minutos y varios GB. Los arranques siguientes son de unos 20 segundos porque
Docker reutiliza las imágenes.

```bash
docker compose up -d --build   # solo cuando cambie el código
```

### El gateway tarda unos segundos en responder

Al arrancar devuelve **503** durante unos segundos: está esperando a refrescar
su copia del registro de Eureka. Se arregla solo; no hace falta reiniciar
nada.

## Configuración

Ningún `.env` se versiona; todos tienen su `.env.example` al lado.

**Con Docker** solo hacen falta dos, los de esta carpeta y el del frontend.
Los `.env` de cada servicio no entran en las imágenes: su configuración la
inyecta el compose.

```bash
cp .env.example .env
cp frontend-bytemarket/.env.example frontend-bytemarket/.env
```

| Archivo | Para qué |
|---|---|
| `.env` (esta carpeta) | Contraseña de MySQL y `JWT_SECRET`, que el compose pasa a los seis servicios |
| `frontend-bytemarket/.env` | Sesión sellada, reCAPTCHA, SMTP y datos de marca |

**A mano** es el mismo `.env` de la raíz. Los servicios lo encuentran porque
cada uno lleva un `src/main/resources/.env.properties` que apunta a `..`:

```properties
directory=..
ignoreIfMissing=true
```

Así, al arrancar desde Eclipse (*Run As → Spring Boot App*), el directorio de
trabajo es la carpeta del proyecto y `..` es esta raíz. No hay que configurar
nada en Eclipse ni exportar variables a mano.

> El `JWT_SECRET` tiene que ser **idéntico** para user, catalog, order y
> support: user-service firma el token y los demás verifican la firma. Si
> difieren, toda petición autenticada falla con 401 sin dejar rastro en el log.

Dentro de Docker no se tocan los hosts a mano. El compose inyecta
`DB_HOST=mysql`, `EUREKA_URL=http://eureka:8761/eureka/` y
`NUXT_API_GATEWAY_URL=http://gateway:8085`, porque dentro de un contenedor
`localhost` es el propio contenedor y no el resto del sistema.

### Por qué un solo `.env`

Antes había uno por servicio y el `JWT_SECRET` estaba copiado en seis
archivos. Rotarlo significaba editar los seis, y olvidar uno dejaba ese
servicio devolviendo 401 sin ningún error en el log. Ahora la configuración
del backend vive en un único sitio.

El del frontend sigue aparte porque sus claves son de Nuxt (sesión sellada,
reCAPTCHA, marca) y no las comparte con nadie.

## Comandos del día a día

```bash
docker compose ps                      # estado de los contenedores
docker compose logs -f catalog-service # seguir el log de uno
docker compose restart gateway         # reiniciar uno solo
docker compose down                    # parar todo (los datos se conservan)
docker compose up -d --build frontend  # reconstruir solo uno
```

### Los datos

Viven en el volumen `mysql-data` y sobreviven a `docker compose down`. El
script `docker/mysql-init/01-bytemarket.sql` crea los esquemas y siembra los
datos de ejemplo, pero **solo se ejecuta cuando el volumen está vacío**.

```bash
docker compose down -v   # ⚠️ borra el volumen y con él la base
```

Para volver a sembrar desde cero: `down -v` y luego `up -d`.

### Mensajería (RabbitMQ y Kafka)

Están declaradas pero **fuera del arranque normal**, porque ningún servicio
las usa todavía: no hay `spring-boot-starter-amqp` ni `spring-kafka` en
ningún `pom.xml`. Añadirlas al arranque costaba varios GB y un par de minutos
a cambio de nada. Si las necesitas:

```bash
docker compose --profile mensajeria up -d
```

RabbitMQ en http://localhost:15672 (guest/guest) y Kafka UI en
http://localhost:8086.

## Sin Docker

También se puede levantar a mano, útil para depurar un servicio suelto. Hacen
falta **Java 17+**, **Node 20+** y **MySQL 8** en `localhost:3306`.

El orden importa: **Eureka primero**, luego los cuatro de negocio, el gateway
después y el frontend al final.

```bash
cd bytemarket-eureka-server   && ./mvnw spring-boot:run   # espera a que levante
cd bytemarket-user-service    && ./mvnw spring-boot:run
cd bytemarket-catalog-service && ./mvnw spring-boot:run
cd bytemarket-order-service   && ./mvnw spring-boot:run
cd bytemarket-support-service && ./mvnw spring-boot:run
cd bytemarket-api-gateway     && ./mvnw spring-boot:run
cd frontend-bytemarket        && npm install && npm run dev
```

Cada servicio crea su propio esquema al arrancar
(`createDatabaseIfNotExist=true`), así que basta con que el motor esté
levantado.

> Si en vez de instalar MySQL prefieres usar el del compose
> (`docker compose up -d mysql`), recuerda que queda publicado en el **3308**:
> cambia `DB_PORT` a 3308 en el `.env` mientras trabajes así.

> Todos leen el `.env` de esta carpeta. Si falta, `JWT_SECRET` queda vacío:
> los servicios levantan igual, pero rechazan cualquier token con 401 y sin
> dejar rastro en el log.

## Documentación

| Documento | Para qué |
|---|---|
| [`BYTEMARKET-WORKFLOW.md`](BYTEMARKET-WORKFLOW.md) | Ciclo completo: onboarding, desarrollo local, CI/CD a Docker Hub y actualización del servidor |
| [`BYTEMARKET-DEPLOY.md`](BYTEMARKET-DEPLOY.md) | Levantarlo en otra PC o servidor, sin código fuente, solo con Docker |
| [`BYTEMARKET-DECISIONES.md`](BYTEMARKET-DECISIONES.md) | Por qué el código hace lo que hace: lógica de negocio, matices y trampas conocidas |

## Cada repositorio

| Repositorio | Puerto | Función |
|---|---|---|
| [`bytemarket-eureka-server`](bytemarket-eureka-server) | 8761 | Registro de servicios |
| [`bytemarket-api-gateway`](bytemarket-api-gateway) | 8085 | Enruta por path hacia los demás |
| [`bytemarket-user-service`](bytemarket-user-service) | 8081 | Cuentas, autenticación, perfiles |
| [`bytemarket-catalog-service`](bytemarket-catalog-service) | 8082 | Productos, categorías, banners, inventario |
| [`bytemarket-order-service`](bytemarket-order-service) | 8083 | Pedidos, pagos, cupones, reportes |
| [`bytemarket-support-service`](bytemarket-support-service) | 8084 | Libro de reclamaciones |
| [`frontend-bytemarket`](frontend-bytemarket) | 3000 | Tienda y panel (Nuxt 3) |

Cada uno tiene su propio README con su API detallada.
