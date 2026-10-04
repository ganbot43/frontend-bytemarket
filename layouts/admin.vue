<template>
  <div class="smart-panel-admin admin-shell">
    <div class="admin-shell__sidebar">
      <AdminBarraLateral ref="sidebarRef" />
    </div>
    <div class="admin-shell__content">
      <AdminBarraSuperior class="admin-shell__topbar" />
      <main class="admin-shell__main">
        <slot />
      </main>
      <footer class="admin-shell__footer">
        <p class="admin-footer-text">
          Desarrollada por
          <a
            href="https://smartcsperu.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="admin-footer-brand"
          >
            Smart CS
          </a>
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarRef = ref<{ openDrawer: () => void } | null>(null)
provide('sidebarRef', {
  openDrawer: () => sidebarRef.value?.openDrawer(),
})

import '~/assets/css/admin-panel.css'
</script>
