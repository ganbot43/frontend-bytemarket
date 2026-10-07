# Guía de Despliegue en Producción (Windows / Otro PC) — ByteMarket

Esta guía explica cómo levantar **ByteMarket** completo en cualquier computadora nueva sin instalar Java, Node ni MySQL, y **sin el código fuente**. Solo necesitas Docker.

Las siete imágenes ya están construidas en Docker Hub; esta máquina solo las descarga y las enciende.

## Requisitos Previos

1. Instalar **Docker Desktop** (Windows/Mac) o **Docker Engine** (Linux).
2. Crear una carpeta vacía y colocar dentro solo estos **3 archivos**:
   - `docker-compose.prod.yml`
   - `.env` *(credenciales del backend: MySQL, JWT, S3, SMTP)*
   - `.env.frontend` *(credenciales de Nuxt: sesión, reCAPTCHA, marca)*

**Estructura OBLIGATORIA de la carpeta:**
Los dos `.env` van "sueltos" exactamente en la misma carpeta que el `.yml`.
```text
📂 carpeta-produccion/
 ├── 📄 docker-compose.prod.yml   <-- El archivo de despliegue
 ├── 📄 .env                      <-- AQUÍ (Justo al lado)
 └── 📄 .env.frontend             <-- Y este también
```

> Si no tienes los `.env`, copia las plantillas `.env.example` y `.env.frontend.example` del proyecto y rellena los valores. El `JWT_SECRET` debe ser una cadena larga y aleatoria, **la misma** para todo (el compose se la pasa a los cuatro servicios que la necesitan).

---

## Pasos para Encender el Proyecto

### PASO 1: Descargar las Imágenes

Abre tu consola (PowerShell, CMD o Terminal) en la carpeta donde tienes los archivos. Puedes bajarlas todas de golpe:

```bash
docker compose -f docker-compose.prod.yml pull
```

O una por una, si prefieres ver el avance de cada pieza:

```bash
docker compose -f docker-compose.prod.yml pull mysql
docker compose -f docker-compose.prod.yml pull eureka
docker compose -f docker-compose.prod.yml pull user-service
docker compose -f docker-compose.prod.yml pull catalog-service
docker compose -f docker-compose.prod.yml pull order-service
docker compose -f docker-compose.prod.yml pull support-service
docker compose -f docker-compose.prod.yml pull gateway
docker compose -f docker-compose.prod.yml pull frontend
```

> 📦 Son unos **4 GB** en total. Con una conexión normal, entre 5 y 15 minutos.

### PASO 2: Encender el Proyecto

Una vez descargadas todas las piezas:

```bash
docker compose -f docker-compose.prod.yml up -d
```
*(El `-d` significa "detached": se ejecuta en segundo plano.)*

**No hace falta encenderlos en orden.** El compose ya sabe que MySQL y Eureka van primero, los cuatro de negocio después, el gateway cuando esos estén sanos y el frontend al final. Él solo espera lo que haga falta.

### PASO 3: Darles tiempo de respirar (¡Importante!)

Los servicios están hechos en Java (Spring Boot), que es pesado al arrancar, y MySQL tarda unos 40 segundos en crear su base de datos interna la primera vez.

**Regla de oro:** dales **1 a 2 minutos** la primera vez. Los arranques siguientes rondan los 30 segundos.

### PASO 4: Verificar

```bash
docker compose -f docker-compose.prod.yml ps
```

Deberías ver **ocho** contenedores, siete de ellos en estado `healthy`:

| Contenedor | Puerto | Qué es |
|---|---|---|
| `bytemarket-frontend` | 3000 | Tienda y panel |
| `bytemarket-gateway` | 8085 | Entrada de la API |
| `bytemarket-eureka` | 8761 | Registro de servicios |
| `bytemarket-user` | — | Cuentas y login |
| `bytemarket-catalog` | — | Productos e inventario |
| `bytemarket-order` | — | Pedidos y cupones |
| `bytemarket-support` | — | Reclamaciones |
| `bytemarket-mysql` | 3308 | Base de datos |

¡Listo! Abre tu navegador en **http://localhost:3000**.

| Rol | Correo | Contraseña |
|---|---|---|
| Admin | `admin@bytemarket.com` | `admin123` |
| Superadmin | `owner@bytemarket.com` | `admin123` |
| Cliente | `cliente@bytemarket.com` | `cliente123` |

> 🌱 **La base se siembra sola.** No hace falta importar ningún `.sql`: cada servicio crea su esquema al arrancar y mete los datos de ejemplo (usuarios, categorías, productos, métodos de pago y cupones) si la encuentra vacía.

---

## 🛠️ Comandos de Administración Útiles

Asegúrate de estar en la carpeta donde está tu archivo `.yml`.

* **Apagar todo el proyecto** *(sin borrar la base de datos)*:
  ```bash
  docker compose -f docker-compose.prod.yml down
  ```

* **Encender todo el proyecto:**
  ```bash
  docker compose -f docker-compose.prod.yml up -d
  ```

* **Reiniciar todo** *(útil si algo se quedó colgado)*:
  ```bash
  docker compose -f docker-compose.prod.yml restart
  ```

* **Ver si están encendidos:**
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```

* **Ver el registro de errores (Logs) de un servicio:**
  ```bash
  docker compose -f docker-compose.prod.yml logs -f catalog-service
  ```

* **Actualizar a la última versión publicada:**
  ```bash
  docker compose -f docker-compose.prod.yml pull
  docker compose -f docker-compose.prod.yml up -d
  ```

* **Entrar a la base de datos:**
  ```bash
  docker exec -it bytemarket-mysql mysql -uroot -p
  ```

---

## Solución de Problemas (Troubleshooting)

**1. "Al entrar a la tienda sale error 503"**
* **Por qué pasa:** el gateway arrancó pero todavía no ha refrescado su copia del registro de Eureka, que baja cada 30 segundos.
* **Solución:** espera medio minuto y recarga. Se arregla solo; no reinicies nada.

**2. "Un servicio se apaga (Exited) la primera vez"**
* **Por qué pasa:** arrancó antes de que MySQL terminara de crear su base interna.
* **Solución:** vuelve a lanzar `docker compose -f docker-compose.prod.yml up -d`. Como MySQL ya terminó, esta vez se queda encendido.

**3. "El puerto 3000 (o el 8085) ya está en uso"**
* **Por qué pasa:** hay otra cosa escuchando ahí en esa máquina.
* **Solución:** cambia el número de la **izquierda** en el `docker-compose.prod.yml`. Por ejemplo `"3001:3000"` deja la tienda en el 3001. El de la derecha es el puerto interno del contenedor y no se toca.

**4. "Todo arranca pero al iniciar sesión da 401"**
* **Por qué pasa:** falta el `.env` o el `JWT_SECRET` está vacío. El servicio que firma el token y los que lo verifican no coinciden.
* **Solución:** revisa que el `.env` esté junto al `.yml` y que `JWT_SECRET` tenga un valor. Luego `down` y `up -d`.

**5. "exec format error" en los logs de un servicio**
* **Por qué pasa:** la imagen se construyó para `arm64` (Mac con Apple Silicon) y el servidor es Intel/AMD.
* **Solución:** reconstruirla con `--platform linux/amd64`. El pipeline de GitHub Actions ya lo hace así; esto solo ocurre si alguien subió una imagen a mano desde un Mac.

**6. "No encuentro los datos que tenía antes"**
* **Por qué pasa:** se ejecutó `down -v`, que borra el volumen `mysql-data`.
* **Solución:** no hay vuelta atrás salvo que tengas copia. Usa siempre `down` a secas; el `-v` solo cuando quieras empezar de cero a propósito.
