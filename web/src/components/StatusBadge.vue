<script setup lang="ts">
import type { Status } from "../data/schema";

const props = defineProps<{ status: Status; note?: string }>();

const labels: Record<Status, string> = {
  forbidden: "禁止",
  restricted: "受限",
  free: "可用",
};
</script>

<template>
  <span
    class="badge-wrap"
    :class="{ 'has-tooltip': props.note }"
    :tabindex="props.note ? 0 : undefined"
    :title="props.note || undefined"
    :aria-label="props.note ? `${labels[status]}：${props.note}` : undefined"
  >
    <span class="badge" :class="`status-${status}`">
      <span class="dot" aria-hidden="true" />
      <span class="text">{{ labels[status] }}</span>
    </span>
    <span v-if="props.note" class="tooltip" role="tooltip">{{ props.note }}</span>
  </span>
</template>

<style scoped>
.badge-wrap {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
}
.badge-wrap:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 3px;
  border-radius: 999px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.6;
  white-space: nowrap;
  border: 1px solid transparent;
}
.tooltip {
  position: absolute;
  z-index: 20;
  right: 0;
  bottom: calc(100% + 8px);
  width: min(320px, 60vw);
  padding: 8px 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface-elevated);
  box-shadow: 0 8px 24px rgb(0 0 0 / 22%);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.55;
  opacity: 0;
  pointer-events: none;
  transform: translateY(3px);
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}
.badge-wrap:hover .tooltip,
.badge-wrap:focus-visible .tooltip {
  opacity: 1;
  transform: translateY(0);
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: 0 0 auto;
}
.status-forbidden {
  color: var(--color-forbidden);
  background: var(--color-forbidden-bg);
  border-color: var(--color-forbidden-border);
}
.status-restricted {
  color: var(--color-restricted);
  background: var(--color-restricted-bg);
  border-color: var(--color-restricted-border);
}
.status-free {
  color: var(--color-free);
  background: var(--color-free-bg);
  border-color: var(--color-free-border);
}
</style>
