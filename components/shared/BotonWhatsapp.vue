<template>
  <a
    v-if="config.public.whatsapp"
    :href="`https://wa.me/${config.public.whatsapp}`"
    target="_blank"
    rel="noopener noreferrer"
    class="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
    aria-label="Contactar por WhatsApp"
  >
    <UIcon name="i-mdi-whatsapp" class="w-6 h-6" />
  </a>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
</script>
