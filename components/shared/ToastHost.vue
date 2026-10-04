<template>
  <Teleport to="body">
    <div v-if="hasToasts" class="toast-host" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast-stack" tag="div" class="toast-stack">
        <article
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="[`toast-item--${toast.color || 'info'}`]"
          role="status"
        >
          <div class="toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path
                v-if="toast.color === 'success'"
                d="M20 6 9 17l-5-5"
                stroke="currentColor"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                v-else-if="toast.color === 'warning'"
                d="M12 9v4m0 4h.01M10.3 4.5 2.8 18a1.6 1.6 0 0 0 1.4 2.4h15.6a1.6 1.6 0 0 0 1.4-2.4L13.7 4.5a1.6 1.6 0 0 0-3.4 0Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                v-else-if="toast.color === 'error'"
                d="M15 9 9 15M9 9l6 6M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                v-else
                d="M12 17v-6m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="toast-content">
            <p class="toast-title">{{ toast.title }}</p>
            <p v-if="toast.description" class="toast-description">{{ toast.description }}</p>
          </div>

          <button class="toast-close" type="button" aria-label="Cerrar alerta" @click="remove(toast.id)">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </article>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, remove } = useAppToast()
const hasToasts = computed(() => toasts.value.length > 0)
</script>

<style scoped>
.toast-host {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 99999;
  pointer-events: none;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.toast-item {
  pointer-events: auto;
  min-width: min(92vw, 360px);
  max-width: min(92vw, 420px);
  display: flex;
  align-items: flex-start;
  gap: 0.8rem;
  padding: 0.95rem 1rem;
  border-radius: 16px;
  background: rgba(17, 17, 17, 0.96);
  color: #f5f5f5;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(14px);
}

.toast-item--success { border-color: rgba(34, 197, 94, 0.35); }
.toast-item--info { border-color: rgba(59, 130, 246, 0.35); }
.toast-item--warning { border-color: rgba(245, 158, 11, 0.35); }
.toast-item--error { border-color: rgba(239, 68, 68, 0.35); }

.toast-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.toast-item--success .toast-icon { background: rgba(34, 197, 94, 0.14); color: #22c55e; }
.toast-item--info .toast-icon { background: rgba(59, 130, 246, 0.14); color: #60a5fa; }
.toast-item--warning .toast-icon { background: rgba(245, 158, 11, 0.14); color: #f59e0b; }
.toast-item--error .toast-icon { background: rgba(239, 68, 68, 0.14); color: #f87171; }

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  color: #ffffff;
}

.toast-description {
  margin: 0.25rem 0 0;
  font-size: 0.84rem;
  line-height: 1.35;
  color: rgba(245, 245, 245, 0.78);
}

.toast-close {
  border: 0;
  background: transparent;
  color: rgba(245, 245, 245, 0.72);
  padding: 0.15rem;
  cursor: pointer;
  border-radius: 999px;
}

.toast-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.toast-stack-enter-active,
.toast-stack-leave-active {
  transition: all 180ms ease;
}

.toast-stack-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.toast-stack-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@media (max-width: 640px) {
  .toast-host {
    top: 0.75rem;
    right: 0.75rem;
    left: 0.75rem;
  }

  .toast-stack {
    align-items: stretch;
  }

  .toast-item {
    min-width: 0;
    max-width: none;
  }
}
</style>
