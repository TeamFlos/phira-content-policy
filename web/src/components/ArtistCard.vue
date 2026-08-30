<script setup lang="ts">
import { ref } from "vue";
import type { ArtistHit } from "../search/index";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{ hit: ArtistHit }>();
const expanded = ref(false);

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
</script>

<template>
  <article class="card artist">
    <header class="head">
      <h3 class="name">
        {{ hit.artist.name }}
        <span class="id mono">/{{ hit.id }}</span>
      </h3>
      <StatusBadge :status="hit.artist.status" />
    </header>
    <p v-if="hit.artist.reason" class="reason">
      <span class="reason-label">原因</span>
      <span>{{ hit.artist.reason }}</span>
    </p>
    <p v-if="hit.artist.note" class="note">{{ hit.artist.note }}</p>
    <p v-if="hit.trackCount > 0" class="meta">关联 {{ hit.trackCount }} 首收录曲目</p>
    <button
      v-if="hit.tracks.length > 0"
      type="button"
      class="details-toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? "收起曲目" : "查看关联曲目" }}
      <span aria-hidden="true">{{ expanded ? "↑" : "↓" }}</span>
    </button>
    <ul v-if="expanded" class="track-list">
      <li v-for="track in props.hit.tracks" :key="`${track.name}-${track.artist}`">
        <span class="track-name">{{ track.name }}</span>
        <span class="track-artist">{{ track.artist }}</span>
      </li>
    </ul>
    <ul v-if="hit.artist.references && hit.artist.references.length > 0" class="refs">
      <li v-for="(r, i) in hit.artist.references" :key="i">
        <a v-if="isHttpUrl(r)" :href="r" target="_blank" rel="noopener noreferrer">{{ r }}</a>
        <span v-else>{{ r }}</span>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.card.artist {
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
.reason {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  gap: var(--space-2);
}
.reason-label {
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
}
.note {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.meta {
  color: var(--color-text-tertiary);
  font-size: 12px;
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
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
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
  color: var(--color-text-secondary);
}
.refs {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding-top: var(--space-1);
  border-top: 1px dashed var(--color-border);
  margin-top: var(--space-1);
}
.refs a {
  color: var(--color-text-secondary);
}
</style>
