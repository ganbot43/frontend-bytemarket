<template>
  <!-- ── Desktop: sidebar estático en el layout ── -->
  <aside class="sp-sidebar sp-sidebar--static">
    <AdminContenidoBarraLateral :user="user" />
  </aside>

  <!-- ── Mobile: botón hamburguesa + drawer teleportado ── -->
  <Teleport to="body">
    <Transition name="sp-sidebar-overlay">
      <div
        v-if="drawerOpen"
        class="sp-sidebar-overlay"
        @click="drawerOpen = false"
      />
    </Transition>
    <Transition name="sp-sidebar-drawer">
      <aside v-if="drawerOpen" class="sp-sidebar sp-sidebar--drawer">
        <AdminContenidoBarraLateral :user="user" @close="drawerOpen = false" />
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { user } = useUserSession();
const drawerOpen = ref(false);

defineExpose({ openDrawer: () => (drawerOpen.value = true) });
</script>
