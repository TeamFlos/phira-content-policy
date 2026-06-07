<script setup lang="ts">
import type { Status } from "../data/schema";

defineProps<{ status: Status }>();

const labels: Record<Status, string> = {
  forbidden: "禁止",
  restricted: "受限",
  free: "可用",
};
</script>

<template>
  <span class="badge" :class="`status-${status}`">
    <span class="dot" aria-hidden="true" />
    <span class="text">{{ labels[status] }}</span>
  </span>
</template>

<style scoped>
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
