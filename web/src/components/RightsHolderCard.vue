<script setup lang="ts">
import type { RightsHolderHit } from "../search/index";
import StatusBadge from "./StatusBadge.vue";

defineProps<{ hit: RightsHolderHit }>();
</script>

<template>
  <article class="card rh">
    <header class="head">
      <h3 class="name">
        {{ hit.policy.name }}
        <span class="id mono">/{{ hit.id }}</span>
      </h3>
      <StatusBadge :status="hit.policy.status" />
    </header>
    <p v-if="hit.policy.note" class="note">{{ hit.policy.note }}</p>
    <p class="meta">收录 {{ hit.trackCount }} 首曲目</p>
  </article>
</template>

<style scoped>
.card.rh {
  padding: var(--space-4) var(--space-5);
  gap: var(--space-2);
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.id {
  color: var(--color-text-tertiary);
  font-weight: 400;
  font-size: 12px;
  margin-left: var(--space-2);
}
.note {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.meta {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
