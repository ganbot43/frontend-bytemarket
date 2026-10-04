import "dotenv/config";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({


  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? "https://bytemarket.pe",
    name: process.env.NUXT_PUBLIC_SITE_NAME ?? "ByteMarket",
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  experimental: {
    appManifest: false,
  },
  runtimeConfig: {
    // URL del API Gateway (las rutas /api/** se reenvían desde server/api/[...path].ts)
    apiGatewayUrl: process.env.NUXT_API_GATEWAY_URL ?? "http://localhost:8085",
    // ─── Existentes (landing) ────────────────────────────────────
    recaptchaSecretKey: process.env.G_RECAPTCHA_SECRET_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    smtpSecure: process.env.SMTP_SECURE,
    smtpFrom: process.env.SMTP_FROM,
    // ─── Nuevos (ecommerce) ──────────────────────────────────────
    session: {
      password: process.env.NUXT_SESSION_PASSWORD ?? "",
    },
    // Sin conexión a base de datos a propósito: cada microservicio es dueño
    // de su esquema y el frontend solo habla con el gateway (apiGatewayUrl).
    // S3 configuration for uploads
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3RootPrefix: process.env.S3_ROOT_PREFIX ?? "bytemarket",
    public: {
      recaptchaSiteKey: process.env.G_RECAPTCHA_SITE_KEY,
      appName: process.env.NUXT_PUBLIC_APP_NAME ?? "ByteMarket SAC",
      whatsapp: process.env.NUXT_PUBLIC_WHATSAPP ?? "+51923821520",
      companyName: process.env.NUXT_PUBLIC_COMPANY_NAME || "ByteMarket SAC",
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "https://bytemarket.pe",
      siteName: process.env.NUXT_PUBLIC_SITE_NAME ?? "ByteMarket",
      watsonIntegrationId: process.env.WATSON_INTEGRATION_ID,
      watsonRegion: process.env.WATSON_REGION,
      watsonServiceInstanceId: process.env.WATSON_SERVICE_INSTANCE_ID,
    },
  },

  modules: [
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxtjs/sitemap",
    "@nuxt/ui",
    "nuxt-auth-utils",
    "nuxt-vitalizer",
    "@pinia/nuxt",
  ],
  sitemap: {
    autoLastmod: true,
    credits: false,
    exclude: ["/admin/**", "/login"],
  },
  pinia: {
    storesDirs: ["./stores/**"],
  },
  icon: {
    provider: "iconify", // Usar iconify como proveedor
  },
  vitalizer: {
    disablePrefetchLinks: false,
    disablePreloadLinks: false,
  },
  css: [
    "@fortawesome/fontawesome-svg-core/styles.css",
    "~/assets/css/transitions.css",
    "~/assets/css/tokens.css",
  ],
  imports: {
    dirs: ["composables"],
  },
  components: true,
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ["@fortawesome/free-brands-svg-icons"],
    },
    server: {
      allowedHosts: [
        "localhost",
        ".ngrok-free.app",
        "5dd2-190-43-41-72.ngrok-free.app",
        ".trycloudflare.com",
        "octagonal-unspacious-kaylee.ngrok-free.dev",
      ],
    },
    cacheDir: ".vite-cache",
  },
  app: {
    head: {
      htmlAttrs: { lang: "es" },
      title: "ByteMarket | Repuestos y Accesorios para Celulares en Perú",
      meta: [
        { charset: "utf-8" },
        {
          name: "description",
          content:
            "ByteMarket: repuestos y accesorios de alta calidad para celulares en Perú. Pantallas, baterías, cases, cargadores y protectores con garantía comprobada.",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: "ByteMarket" },
        { name: "theme-color", content: "#E31E24" },
        {
          name: "keywords",
          content:
            "repuestos de celulares, accesorios para celulares, pantallas, baterías, cases, cargadores, protectores de pantalla, Lima, Perú",
        },
        {
          property: "og:title",
          content: "ByteMarket | Repuestos y Accesorios para Celulares en Perú",
        },
        {
          property: "og:description",
          content:
            "ByteMarket: repuestos y accesorios premium para celulares, seleccionados y probados. Alta calidad con garantía comprobada y al precio justo.",
        },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "ByteMarket" },
        { property: "og:locale", content: "es_PE" },
        {
          property: "og:image",
          content: "https://bytemarket.pe/images/logo.png",
        },
        { property: "og:image:alt", content: "Logo de ByteMarket" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:title",
          content: "ByteMarket | Repuestos y Accesorios para Celulares en Perú",
        },
        {
          name: "twitter:description",
          content:
            "Repuestos y accesorios de alta calidad para celulares en Lima, Peru. Pantallas, baterias, cases y mas.",
        },
        {
          name: "twitter:image",
          content: "https://bytemarket.pe/images/logo.png",
        },
        { name: "robots", content: "index, follow" },
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          sizes: "96x96",
          href: "/images/logo.png",
        },
        { rel: "icon", type: "image/webp", href: "/images/logo.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap",
        },
      ],
    },
    pageTransition: {
      name: "page",
      mode: "out-in",
    },
  },
  ssr: true,

  fonts: {
    defaults: {},
  },
});
