# Ciclo de Vida del Desarrollo (Flujo de Trabajo ByteMarket)

Este documento detalla el ciclo completo de vida del software para **ByteMarket**. Explica paso a paso cómo se pasa desde escribir código en tu máquina local (Mac, Windows o Linux), hasta actualizar la aplicación en el servidor de producción.

A diferencia de un proyecto de un solo backend, ByteMarket son **siete repositorios**: seis microservicios Spring Boot y un frontend Nuxt. Cada uno tiene su propia imagen en Docker Hub y su propio pipeline.

---

## 🐣 Fase 0: Onboarding (Nuevo Desarrollador)

Si acabas de configurar una computadora nueva, este es el primer paso para tener todo el código y levantar la aplicación en tu entorno local.

1. **Crear la carpeta de espacio de trabajo:** Abre tu consola y crea la carpeta `ByteMarket`.

2. **Clonar los siete repositorios** dentro de ella:
   ```bash
   mkdir ByteMarket && cd ByteMarket
   git clone https://github.com/ganbot43/bytemarket-eureka-server.git
   git clone https://github.com/ganbot43/bytemarket-api-gateway.git
   git clone https://github.com/ganbot43/bytemarket-user-service.git
   git clone https://github.com/ganbot43/bytemarket-catalog-service.git
   git clone https://github.com/ganbot43/bytemarket-order-service.git
   git clone https://github.com/ganbot43/bytemarket-support-service.git
   git clone https://github.com/ganbot43/frontend-bytemarket.git
   ```

3. **Estructura OBLIGATORIA de la carpeta:**
   Hay **un solo `.env` para todo el backend** y vive en la raíz, junto a los `docker-compose`. El frontend tiene el suyo aparte porque sus claves son de Nuxt.
   ```text
   📂 ByteMarket/
    ├── 📂 bytemarket-eureka-server/
    ├── 📂 bytemarket-api-gateway/
    ├── 📂 bytemarket-user-service/
    ├── 📂 bytemarket-catalog-service/
    ├── 📂 bytemarket-order-service/
    ├── 📂 bytemarket-support-service/
    ├── 📂 frontend-bytemarket/
    │    └── 📄 .env                  <-- Config de Nuxt (sesión, SMTP, marca)
    ├── 📄 .env                       <-- Config del backend (MySQL, JWT, S3)
    ├── 📄 docker-compose.yml         <-- Docker-compose de desarrollo
    ├── 📄 docker-compose.prod.yml    <-- Docker-compose de producción
    └── 📄 BYTEMARKET-WORKFLOW.md
   ```

   > Los servicios encuentran ese `.env` de la raíz gracias al archivo
   > `src/main/resources/.env.properties` que cada uno trae, con
   > `directory=..`. Antes había un `.env` por servicio y el `JWT_SECRET`
   > estaba copiado en seis sitios: si al rotarlo se escapaba uno, ese
   > servicio devolvía 401 sin dejar rastro en el log.

4. **Crear los dos archivos de configuración:**
   ```bash
   cp .env.example .env
   cp frontend-bytemarket/.env.example frontend-bytemarket/.env
   ```
   Rellena los valores. El más importante es `JWT_SECRET`: una cadena larga y aleatoria.

5. **Construir el proyecto local (Build):**
   Docker lee el código de los siete repos y compila cada imagen.
   ```bash
   docker compose build
   ```
   > ⏳ **La primera vez tarda entre 10 y 20 minutos.** Compila seis proyectos Maven dentro de sus contenedores, así que descarga las dependencias seis veces. Los builds siguientes son mucho más rápidos porque Docker reutiliza capas.

6. **Encender el proyecto local (Run):**
   ```bash
   docker compose up -d
   ```
   Dale un minuto a Java para arrancar. La tienda y el panel quedan en **http://localhost:3000**.

   | Rol | Correo | Contraseña |
   |---|---|---|
   | Admin | `admin@bytemarket.com` | `admin123` |
   | Superadmin | `owner@bytemarket.com` | `admin123` |
   | Cliente | `cliente@bytemarket.com` | `cliente123` |

   > La base arranca vacía y **se siembra sola**: cada servicio crea su esquema y mete los datos de ejemplo (usuarios, categorías, productos, métodos de pago y cupones) la primera vez.

---

## 💻 Fase 1: Desarrollo Local (En tu computadora)

### Opción A: Desarrollar con Docker (Todo encendido a la vez)

1. **Editar el código** en tu IDE.
2. **Reconstruir solo lo que tocaste** y volver a levantar:
   ```bash
   docker compose up -d --build catalog-service
   ```
   Sin el nombre al final reconstruye los siete, que casi nunca hace falta.

### Opción B: Desarrollar Manualmente SIN Docker (Solo Spring Boot)

Cuando estás programando no quieres levantar todo Docker, sino correr un servicio para depurarlo rápido.

1. **Levanta solo la base de datos:**
   ```bash
   docker compose up -d mysql
   ```
   Queda publicada en el **3308** del host, no en el 3306, para que conviva con un MySQL que ya tengas instalado.

2. **Levanta Eureka**, que los demás necesitan para registrarse:
   ```bash
   docker compose up -d eureka
   ```

3. **Corre el servicio que estás tocando:** dale al botón ▶️ de *Run As → Spring Boot App* en Eclipse, o desde la consola:
   ```bash
   cd bytemarket-catalog-service
   ./mvnw spring-boot:run
   ```
   > Funciona sin configurar nada en Eclipse: el directorio de trabajo es la carpeta del proyecto y `.env.properties` apunta al `.env` de la raíz.
   >
   > ⚠️ El `.env` trae `DB_PORT=3306`. Si usas el MySQL del compose desde fuera de Docker, cámbialo a **3308** mientras dure la sesión, o levanta tu MySQL local en el 3306.

4. **El frontend:**
   ```bash
   cd frontend-bytemarket
   npm install
   npm run dev
   ```

### 3. Guardar en la Nube (Control de Versiones)

Cada servicio es **su propio repositorio**, así que un cambio que cruce varios son varios commits:
```bash
cd bytemarket-catalog-service
git add .
git commit -m "Mi cambio"
git push
```
La rama por defecto es `main`.

---

## 📦 Fase 2: Empaquetado (Subir a Docker Hub de forma automática vía CI/CD)

Cada repositorio trae su propio pipeline en `.github/workflows/docker-publish.yml`. Al hacer `push` a `main`, GitHub Actions:

* Compila la imagen para la plataforma `linux/amd64`.
* Hace login en Docker Hub con los secretos `DOCKER_NAME` y `DOCKER_TOKEN`.
* Publica la imagen con su etiqueta.

| Repositorio | Imagen publicada |
|---|---|
| `bytemarket-eureka-server` | `ganbito/bytemarket-eureka-server:latest` |
| `bytemarket-api-gateway` | `ganbito/bytemarket-api-gateway:latest` |
| `bytemarket-user-service` | `ganbito/bytemarket-user-service:latest` |
| `bytemarket-catalog-service` | `ganbito/bytemarket-catalog-service:latest` |
| `bytemarket-order-service` | `ganbito/bytemarket-order-service:latest` |
| `bytemarket-support-service` | `ganbito/bytemarket-support-service:latest` |
| `frontend-bytemarket` | `ganbito/bytemarket-frontend:latest` |

> 🔑 **Configuración previa, una sola vez por repositorio.** En GitHub, *Settings → Secrets and variables → Actions*, crea `DOCKER_NAME` (tu usuario de Docker Hub) y `DOCKER_TOKEN` (un *Access Token* generado en Docker Hub, **no** tu contraseña).
>
> ⚠️ `linux/amd64` no es un capricho: los servidores de nube son Intel/AMD. Si construyeras las imágenes en un Mac con Apple Silicon saldrían `arm64` y allá no arrancarían.

### Publicar a mano la primera vez

Si aún no has configurado los secretos y quieres subir las imágenes desde tu máquina:
El nombre de la imagen local no coincide con el de Docker Hub, así que hay
que etiquetarlas una por una:

```bash
docker login
docker compose build

docker tag bytemarket-eureka:latest          ganbito/bytemarket-eureka-server:latest
docker tag bytemarket-gateway:latest         ganbito/bytemarket-api-gateway:latest
docker tag bytemarket-user-service:latest    ganbito/bytemarket-user-service:latest
docker tag bytemarket-catalog-service:latest ganbito/bytemarket-catalog-service:latest
docker tag bytemarket-order-service:latest   ganbito/bytemarket-order-service:latest
docker tag bytemarket-support-service:latest ganbito/bytemarket-support-service:latest
docker tag bytemarket-frontend:latest        ganbito/bytemarket-frontend:latest

docker push ganbito/bytemarket-eureka-server:latest
docker push ganbito/bytemarket-api-gateway:latest
docker push ganbito/bytemarket-user-service:latest
docker push ganbito/bytemarket-catalog-service:latest
docker push ganbito/bytemarket-order-service:latest
docker push ganbito/bytemarket-support-service:latest
docker push ganbito/bytemarket-frontend:latest
```
> En un Mac con Apple Silicon añade `--platform linux/amd64` al construir, o las imágenes no servirán en el servidor.

---

## 🚀 Fase 3: Actualizar Producción (CD)

Publicar la imagen en Docker Hub **no la pone a funcionar en ningún sitio**: el servidor sigue con la versión vieja hasta que alguien la baje. Ese último tramo es el CD.

### Automático

Cada workflow trae un segundo job, `deploy`, que entra por SSH al servidor y actualiza **solo su propio servicio**. Se dispara en cuanto el `build-and-push` termina bien.

**Está desactivado por defecto.** Mientras no exista un servidor, el job se salta sin dar error. Para encenderlo, en cada repositorio:

1. *Settings → Secrets and variables → Actions → Variables*: crea `DEPLOY_ENABLED` con el valor `true`.
2. En *Secrets*, añade:

   | Secreto | Qué es |
   |---|---|
   | `SERVER_HOST` | IP o dominio del servidor |
   | `SERVER_USER` | Usuario con el que entras por SSH |
   | `SERVER_SSH_KEY` | La clave **privada** completa, incluidas las líneas `BEGIN`/`END` |
   | `SERVER_PATH` | Carpeta donde está el `docker-compose.prod.yml` |
   | `SERVER_PORT` | Opcional, solo si el SSH no va por el 22 |

### Por qué no puede romper nada

Este proyecto son siete repos actualizando una misma carpeta del servidor, así que el riesgo de pisarse es real. El job está acotado a propósito:

| Garantía | Cómo |
|---|---|
| Solo toca su servicio | `--no-deps` recrea únicamente ese contenedor |
| No apaga el resto | Nunca ejecuta `down` |
| No borra la base de datos | Nunca usa `-v`; MySQL ni aparece en el script |
| No pisa la configuración | No escribe ningún `.env`; los del servidor se quedan como están |
| No despliega algo roto | `needs: build-and-push` — si la imagen falla, no se despliega |
| No trabaja a ciegas | Si falta el `docker-compose.prod.yml`, corta con error en vez de crear contenedores sueltos |

Cada repositorio sabe **su** imagen y **su** servicio del compose, que no siempre se llaman igual:

| Repositorio | Imagen en Docker Hub | Servicio en el compose |
|---|---|---|
| `bytemarket-eureka-server` | `ganbito/bytemarket-eureka-server` | `eureka` |
| `bytemarket-api-gateway` | `ganbito/bytemarket-api-gateway` | `gateway` |
| `bytemarket-user-service` | `ganbito/bytemarket-user-service` | `user-service` |
| `bytemarket-catalog-service` | `ganbito/bytemarket-catalog-service` | `catalog-service` |
| `bytemarket-order-service` | `ganbito/bytemarket-order-service` | `order-service` |
| `bytemarket-support-service` | `ganbito/bytemarket-support-service` | `support-service` |
| `frontend-bytemarket` | `ganbito/bytemarket-frontend` | `frontend` |

> ⚠️ Los tres primeros y el frontend **no se llaman igual en las tres columnas**. Si alguna vez editas un workflow a mano, comprueba esta tabla: en la versión anterior, `support-service` publicaba sobre `ganbito/user-service` y habría machacado la imagen de otro servicio.

### Manual

Si prefieres no automatizarlo, o el servidor no es accesible desde internet (una laptop, por ejemplo), es lo mismo a mano:

```bash
ssh usuario@IP-DEL-SERVIDOR
cd /ruta/del/proyecto
docker compose -f docker-compose.prod.yml pull catalog-service
docker compose -f docker-compose.prod.yml up -d --no-deps catalog-service
```

Docker detecta la imagen más nueva, apaga el contenedor viejo y enciende el nuevo. MySQL ni se entera: su volumen sigue intacto.

> Para la guía completa de instalación en una máquina nueva, mira **[BYTEMARKET-DEPLOY.md](BYTEMARKET-DEPLOY.md)**.
