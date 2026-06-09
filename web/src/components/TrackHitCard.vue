<script setup lang="ts">
import { computed } from "vue";
import type { TrackHit } from "../search/index";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{ hit: TrackHit }>();

const isRH = computed(() => props.hit.origin.kind === "rights_holder");
const matchedLabel = computed(() => {
  const map = { name: "曲名", artist: "作者", alias: "别名" } as const;
  return props.hit.matchedOn.map((m) => map[m]).join(" + ");
});
const compositeLabel = computed(() => {
  const map = { forbidden: "禁止", restricted: "受限", free: "可用" } as const;
  return map[props.hit.composite];
});
</script>

<template>
  <article class="card track">
    <header class="head">
      <div class="title-row">
        <h3 class="name" :title="hit.track.name">{{ hit.track.name }}</h3>
        <span class="matched-on">命中 {{ matchedLabel }}</span>
      </div>
      <p class="artist">{{ hit.track.artist }}</p>
    </header>

    <p class="composite" aria-label="综合判定">
      <span class="composite-label">综合判定</span>
      <span class="composite-value" :class="`status-${hit.composite}`">
        <span class="composite-dot" aria-hidden="true" />
        {{ compositeLabel }}
      </span>
    </p>

    <ul class="dims">
      <li class="dim">
        <span class="dim-label">曲目自身</span>
        <template v-if="hit.track.status">
          <StatusBadge :status="hit.track.status" />
          <p v-if="hit.track.note" class="dim-note">{{ hit.track.note }}</p>
        </template>
        <span v-else class="dim-inherit">继承版权方</span>
      </li>

      <li v-if="isRH && hit.origin.kind === 'rights_holder'" class="dim">
        <span class="dim-label">所属版权方</span>
        <StatusBadge :status="hit.origin.policy.status" />
        <span class="dim-id mono">{{ hit.origin.id }}</span>
        <p v-if="hit.origin.policy.note" class="dim-note">{{ hit.origin.policy.note }}</p>
      </li>
      <li v-else class="dim">
        <span class="dim-label">所属版权方</span>
        <span class="dim-empty">独立曲目（无归属版权方）</span>
      </li>

      <li v-if="hit.linkedArtists.length === 0" class="dim">
        <span class="dim-label">关联艺人</span>
        <span class="dim-empty">未声明</span>
      </li>
      <li v-for="la in hit.linkedArtists" v-else :key="la.id" class="dim">
        <span class="dim-label">关联艺人</span>
        <template v-if="la.artist">
          <StatusBadge :status="la.artist.status" />
          <span class="dim-name-row">
            <span class="dim-id">{{ la.artist.name }}</span>
            <span class="dim-id mono">/{{ la.id }}</span>
          </span>
          <p v-if="la.artist.note" class="dim-note">{{ la.artist.note }}</p>
        </template>
        <template v-else>
          <span class="dim-empty">数据库未收录</span>
          <span class="dim-name-row">
            <span class="dim-id mono">/{{ la.id }}</span>
          </span>
        </template>
      </li>
    </ul>
  </article>
</template>

<style scoped>
.card.track {
  padding: var(--space-5);
  gap: var(--space-4);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.name {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
  line-height: 1.3;
}
.artist {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.matched-on {
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex: 0 0 auto;
}

.composite {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding-bottom: var(--space-3);
  border-bottom: 1px dashed var(--color-border);
}
.composite-label {
  color: var(--color-text-secondary);
}
.composite-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}
.composite-value.status-forbidden {
  color: var(--color-forbidden);
}
.composite-value.status-restricted {
  color: var(--color-restricted);
}
.composite-value.status-free {
  color: var(--color-free);
}
.composite-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.dims {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.dim {
  display: grid;
  grid-template-columns: 88px auto 1fr;
  align-items: baseline;
  gap: var(--space-2) var(--space-3);
}
.dim-label {
  color: var(--color-text-tertiary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dim-id {
  color: var(--color-text-secondary);
  font-size: 13px;
}
.dim-name-row {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.dim-inherit {
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.dim-empty {
  color: var(--color-text-tertiary);
  font-style: italic;
  font-size: 13px;
}
.dim-note {
  grid-column: 2 / -1;
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

@media (max-width: 540px) {
  .dim {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .dim-note {
    grid-column: 1;
  }
}
</style>
