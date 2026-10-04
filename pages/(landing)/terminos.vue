<template>
  <SharedDocumentoLegal
    titulo="Términos y condiciones"
    :entrada="entrada"
    :actualizado="actualizado"
    :secciones="secciones"
  />
</template>

<script setup lang="ts">
import type { SeccionLegal } from "~/components/shared/DocumentoLegal.vue";

definePageMeta({ layout: "landing" });

const runtimeConfig = useRuntimeConfig();
const siteUrl = String(runtimeConfig.public.siteUrl || "https://bytemarket.pe").replace(/\/$/, "");

const entrada =
  "Al comprar en ByteMarket o usar este sitio aceptas las condiciones que se describen a continuación. Están escritas para que se entiendan; si algo no te queda claro, escríbenos antes de comprar.";

/* Fecha fija, no calculada: un documento legal debe decir cuándo
   cambió de verdad, no la fecha en que se abre la página. */
const actualizado = "23 de septiembre de 2026";

const secciones: SeccionLegal[] = [
  {
    titulo: "Aceptación de los términos",
    parrafos: [
      "Al acceder a este sitio, crear una cuenta o realizar un pedido, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguno de ellos, no utilices nuestros servicios.",
    ],
  },
  {
    titulo: "Productos y compatibilidad",
    parrafos: [
      "Publicamos el tipo de repuesto y los modelos a los que corresponde. Aun así, la responsabilidad de verificar la compatibilidad antes de comprar es compartida: si tienes dudas, escríbenos el modelo exacto de tu equipo y te lo confirmamos sin compromiso.",
      "Las fotografías son referenciales. Pueden existir diferencias menores de tono o acabado entre lotes del mismo repuesto.",
    ],
  },
  {
    titulo: "Precios, stock y pedidos",
    parrafos: [
      "Los precios se muestran en soles e incluyen IGV. El costo de envío no está incluido y se coordina contigo al confirmar el pedido.",
      "El stock mostrado es el que tenemos al momento de la consulta. Un pedido queda confirmado cuando verificamos el pago; si una pieza se agota antes de esa confirmación, te avisamos y te devolvemos el importe o te ofrecemos una alternativa.",
    ],
  },
  {
    titulo: "Pagos",
    parrafos: [
      "Aceptamos los medios de pago que aparecen en el checkout. El pedido se despacha una vez confirmado el pago; para ello necesitamos que nos envíes la constancia por WhatsApp.",
    ],
  },
  {
    titulo: "Envíos y entregas",
    parrafos: [
      "Enviamos a todo el Perú. Los plazos dependen del destino y del servicio de mensajería, y se te informan al coordinar el envío.",
      "Es responsabilidad del comprador proporcionar una dirección y un teléfono de contacto correctos. Los costos de un reenvío por datos erróneos corren por cuenta del comprador.",
    ],
  },
  {
    titulo: "Garantía y cambios",
    parrafos: [
      "Los repuestos tienen garantía por defecto de fábrica. Si una pieza llega fallada o deja de funcionar por un defecto propio, la cambiamos.",
      "La garantía no cubre daños por instalación incorrecta, golpes, humedad, manipulación por terceros ni desgaste por uso normal. Recomendamos que la instalación la realice un técnico.",
      "Para tramitar un cambio, escríbenos con el código de tu pedido.",
    ],
  },
  {
    titulo: "Propiedad intelectual",
    parrafos: [
      "Los textos, fotografías y elementos gráficos de este sitio pertenecen a ByteMarket. No pueden copiarse, distribuirse ni modificarse sin autorización previa por escrito.",
    ],
  },
  {
    titulo: "Limitación de responsabilidad",
    parrafos: [
      "ByteMarket responde por el producto vendido según la garantía descrita. No asumimos responsabilidad por daños indirectos derivados del uso o de la imposibilidad de uso de los repuestos, ni por trabajos de instalación realizados por terceros.",
    ],
  },
  {
    titulo: "Modificaciones",
    parrafos: [
      "Podemos actualizar estos términos cuando sea necesario. Los cambios se publican en esta página con su fecha de actualización y rigen para los pedidos realizados a partir de ese momento.",
    ],
  },
];

const description =
  "Condiciones de compra, garantía, envíos y responsabilidades aplicables en ByteMarket.";

useSeoMeta({
  title: "Términos y condiciones — ByteMarket",
  description,
  ogTitle: "Términos y condiciones — ByteMarket",
  ogDescription: description,
  ogType: "article",
  ogUrl: `${siteUrl}/terminos`,
  ogImage: `${siteUrl}/images/logo.png`,
  twitterCard: "summary_large_image",
});
</script>
