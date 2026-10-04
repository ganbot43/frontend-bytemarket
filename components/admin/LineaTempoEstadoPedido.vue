<template>
  <div class="timeline">
    <div v-if="!logs.length" class="timeline-empty">
      <div class="timeline-empty__icon">
        <Inbox class="w-5 h-5 text-current" stroke-width="1.4" />
      </div>
      <span>Sin eventos registrados</span>
    </div>

    <div
      v-for="(log, idx) in sortedLogs"
      :key="log.id ?? idx"
      class="tl-item"
      :class="{ 'tl-item--last': idx === sortedLogs.length - 1 }"
    >
      <!-- Track -->
      <div class="tl-track">
        <div class="tl-dot" :class="`tl-dot--${log.status}`">
          <component :is="statusIcon(log.status)" class="w-3 h-3" stroke-width="2" />
        </div>
        <div v-if="idx < sortedLogs.length - 1" class="tl-line" />
      </div>

      <!-- Card de contenido -->
      <div
        class="tl-card"
        :class="{ 'tl-card--first': idx === sortedLogs.length - 1 }"
      >
        <!-- Fila superior: badge + tiempo relativo -->
        <div class="tl-card__header">
          <AdminEtiquetaEstadoPedido :status="log.status" />
          <span
            class="tl-relative"
            :class="idx === sortedLogs.length - 1 ? 'tl-relative--recent' : ''"
          >
            {{ formatRelativeTime(log.createdAt) }}
          </span>
        </div>

        <!-- Timestamp completo -->
        <div class="tl-timestamp">
          <Clock class="w-2.5 h-2.5 text-current" stroke-width="1.8" />
          {{ formatDateTimeCompact(log.createdAt) }}
        </div>

        <!-- Autor -->
        <!-- <div v-if="log.changedBy" class="tl-author">
          <div class="tl-author__avatar">{{ initials(log.changedBy) }}</div>
          <span>{{ log.changedBy }}</span>
        </div> -->

        <!-- Nota -->
        <div v-if="log.note" class="tl-note">
          <MessageSquare class="w-3 h-3 text-current shrink-0 mt-px" stroke-width="1.5" />
          <span>{{ log.note }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Clock, FileText, CheckCircle, Package, Truck, XCircle, Inbox, MessageSquare } from "lucide-vue-next";

const props = defineProps<{
  logs: Array<{
    id?: number;
    status: string;
    note?: string;
    createdAt: string;
    changedBy?: string;
  }>;
}>();

const { getTimeValue, formatRelativeTime, formatDateTimeCompact } =
  useFormatDateTime();

const sortedLogs = computed(() =>
  [...props.logs].sort(
    (a, b) => getTimeValue(a.createdAt) - getTimeValue(b.createdAt),
  ),
);

function initials(name: unknown) {
  if (!name || typeof name !== "string") return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function statusIcon(status: string) {
  const map: Record<string, any> = {
    pending: Clock,
    voucher_sent: FileText,
    payment_validated: CheckCircle,
    in_preparation: Package,
    delivered: Truck,
    cancelled: XCircle,
  };
  return map[status] ?? Clock;
}
</script>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
}

/* ── Empty ── */
.timeline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 2rem 0;
  color: var(--sp-text-muted);
  font-size: var(--sp-text-xs);
  font-weight: 500;
}

.timeline-empty__icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sp-text-soft);
}

/* ── Item row ── */
.tl-item {
  display: flex;
  gap: 10px;
  padding-bottom: 10px;
}
.tl-item--last {
  padding-bottom: 0;
}

/* ── Track ── */
.tl-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 26px;
}

.tl-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid transparent;
  box-shadow: 0 0 0 3px var(--sp-surface-solid);
}

.tl-dot--pending {
  background: #fefce8;
  color: #92400e;
  border-color: #fde68a;
}
.tl-dot--voucher_sent {
  background: #eff6ff;
  color: #1e40af;
  border-color: #bfdbfe;
}
.tl-dot--payment_validated {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}
.tl-dot--in_preparation {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}
.tl-dot--delivered {
  background: #f0fdf4;
  color: #14532d;
  border-color: #86efac;
}
.tl-dot--cancelled {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}

.tl-line {
  width: 1px;
  flex: 1;
  min-height: 10px;
  margin-top: 4px;
  background: var(--sp-border);
}

/* ── Card ── */
.tl-card {
  flex: 1;
  min-width: 0;
  background: var(--sp-surface-muted);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  padding: 9px 11px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 2px;
}

.tl-card--first {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-solid);
  box-shadow: var(--sp-shadow-xs);
}

/* Header: badge + tiempo relativo */
.tl-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}

/* Tiempo relativo */
.tl-relative {
  font-size: 10px;
  font-weight: 600;
  color: var(--sp-text-soft);
  white-space: nowrap;
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  padding: 1px 7px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.tl-relative--recent {
  background: var(
    --sp-primary-soft,
    color-mix(in srgb, var(--sp-primary) 10%, transparent)
  );
  border-color: var(
    --sp-primary-border,
    color-mix(in srgb, var(--sp-primary) 25%, transparent)
  );
  color: var(--sp-primary);
}

/* Timestamp completo */
.tl-timestamp {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--sp-text-muted);
  font-variant-numeric: tabular-nums;
}

/* Autor con avatar de iniciales */
.tl-author {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 1px;
}

.tl-author__avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  font-size: 8px;
  font-weight: 700;
  color: var(--sp-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: -0.02em;
}

.tl-author span {
  font-size: 10px;
  color: var(--sp-text-muted);
  font-weight: 500;
}

/* Nota interna */
.tl-note {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  font-size: 10px;
  color: var(--sp-text-muted);
  background: var(--sp-surface-subtle);
  border-left: 2px solid var(--sp-border-strong);
  border-radius: 0;
  padding: 5px 8px;
  line-height: 1.5;
}
</style>
