<script setup lang="ts">
import { ref } from "vue";
import type { RightsHolderHit } from "../search/index";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{ hit: RightsHolderHit }>();
const expanded = ref(false);
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
    <button
      type="button"
      class="details-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? "收起曲目" : "查看旗下曲目" }}
      <span aria-hidden="true">{{ expanded ? "↑" : "↓" }}</span>
    </button>
    <ul v-if="expanded" class="track-list">
      <li v-for="track in props.hit.tracks" :key="`${track.name}-${track.artist}`">
        <span class="track-name">{{ track.name }}</span>
        <span class="track-artist">{{ track.artist }}</span>
        <StatusBadge :status="track.status ?? hit.policy.status" />
      </li>
    </ul>
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
.details-toggle {
  align-self: flex-start;
  margin-top: var(--space-1);
  padding: 4px 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.details-toggle:hover {
  color: var(--color-text);
}
.details-toggle span {
  margin-left: var(--space-1);
  color: var(--color-text-tertiary);
}
.track-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 280px;
  overflow: auto;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.track-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 0.7fr) auto;
  align-items: center;
  gap: var(--space-2);
  padding: 5px 6px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
}
.track-list li:last-child {
  border-bottom: 0;
}
.track-name {
  color: var(--color-text);
}
.track-artist {
  overflow: hidden;
  color: var(--color-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 540px) {
  .track-list li {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .track-artist {
    grid-column: 1;
    grid-row: 2;
  }
  .track-list .badge {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
