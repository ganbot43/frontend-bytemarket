<template>
  <SharedDocumentoLegal
    titulo="Política de privacidad"
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
  "Esta política explica qué datos te pedimos, para qué los usamos y qué puedes hacer con ellos. Solo recogemos lo necesario para venderte y entregarte un repuesto.";

const actualizado = "23 de septiembre de 2026";

const secciones: SeccionLegal[] = [
  {
    titulo: "Qué datos recopilamos",
    parrafos: [
      "Al crear una cuenta o hacer un pedido te pedimos tu nombre, correo electrónico, teléfono y dirección de entrega. Son los datos mínimos para procesar la compra y coordinar el envío.",
      "Si nos escribes por el formulario de contacto o por WhatsApp, guardamos esa conversación para poder darte seguimiento.",
      "No almacenamos datos de tarjetas: los pagos se realizan por transferencia o billetera móvil, fuera de este sitio.",
    ],
  },
  {
    titulo: "Para qué los usamos",
    parrafos: [
      "Para procesar tus pedidos, coordinar la entrega, emitir el comprobante y responder tus consultas. También para avisarte del estado de una compra.",
      "No usamos tus datos para publicidad de terceros ni te inscribimos en listas de correo sin que lo pidas.",
    ],
  },
  {
    titulo: "Con quién los compartimos",
    parrafos: [
      "Compartimos lo imprescindible con la empresa de mensajería que entrega tu pedido: nombre, dirección y teléfono.",
      "No vendemos ni cedemos tus datos a terceros. Solo los entregaríamos a una autoridad competente si la ley lo exigiera.",
    ],
  },
  {
    titulo: "Cómo los protegemos",
    parrafos: [
      "El sitio usa conexión cifrada. Las contraseñas se guardan cifradas y nadie del equipo puede leerlas.",
      "El acceso a los pedidos está restringido: solo puedes ver los tuyos desde tu cuenta, y únicamente el personal de la tienda puede consultarlos para darte soporte.",
    ],
  },
  {
    titulo: "Cuánto tiempo los conservamos",
    parrafos: [
      "Conservamos los datos de tus pedidos mientras tu cuenta siga activa y durante el plazo que exige la normativa contable y tributaria peruana. Después se eliminan o se anonimizan.",
    ],
  },
  {
    titulo: "Tus derechos",
    parrafos: [
      "Puedes acceder a tus datos, corregirlos o pedir que los eliminemos en cualquier momento. Los datos de contacto y entrega los puedes editar tú directamente desde «Mi cuenta».",
      "Para solicitar la eliminación de tu cuenta, escríbenos por WhatsApp o al correo de contacto. Ten en cuenta que los comprobantes de compra ya emitidos deben conservarse por obligación legal.",
    ],
  },
  {
    titulo: "Cookies",
    parrafos: [
      "Usamos almacenamiento local del navegador para recordar tu carrito, tus favoritos y tu sesión iniciada. Son necesarios para que la tienda funcione y no siguen tu actividad en otros sitios.",
    ],
  },
  {
    titulo: "Cambios en esta política",
    parrafos: [
      "Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha de actualización.",
    ],
  },
];

const description =
  "Qué datos recopila ByteMarket, para qué los usa, con quién los comparte y cómo ejercer tus derechos.";

useSeoMeta({
  title: "Política de privacidad — ByteMarket",
  description,
  ogTitle: "Política de privacidad — ByteMarket",
  ogDescription: description,
  ogType: "article",
  ogUrl: `${siteUrl}/privacidad`,
  ogImage: `${siteUrl}/images/logo.png`,
  twitterCard: "summary_large_image",
});
</script>
