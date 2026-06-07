<script setup lang="ts">
import type { SearchResults } from "../search/index";
import TrackHitCard from "./TrackHitCard.vue";
import RightsHolderCard from "./RightsHolderCard.vue";
import ArtistCard from "./ArtistCard.vue";

defineProps<{
  results: SearchResults;
  stats: { tracks: number; rightsHolders: number; artists: number };
}>();
</script>

<template>
  <!-- empty: opening state -->
  <section v-if="results.isEmpty" class="state empty">
    <div class="stats">
      <div class="stat">
        <span class="stat-num">{{ stats.tracks }}</span>
        <span class="stat-label">曲目</span>
      </div>
      <div class="stat">
        <span class="stat-num">{{ stats.rightsHolders }}</span>
        <span class="stat-label">版权方</span>
      </div>
      <div class="stat">
        <span class="stat-num">{{ stats.artists }}</span>
        <span class="stat-label">艺人</span>
      </div>
    </div>
    <p class="hint">
      输入<b>曲名</b>或<b>作者</b>查曲目；输入<b>版权方</b>或<b>艺人</b>名查策略条目。
    </p>
  </section>

  <!-- not found -->
  <section v-else-if="!results.hasResults" class="state notfound">
    <p class="big">未找到相关策略记录</p>
    <p class="warning">
      <span class="warning-dot" aria-hidden="true">!</span>
      <span class="warning-text">
        <b>未命中不意味着可用</b>。仅说明数据库尚未收录，请回审核群确认或自行考据后再行决定。
      </span>
    </p>
  </section>

  <!-- results -->
  <section v-else class="state results">
    <section v-if="results.tracks.length > 0" class="group">
      <header class="group-head">
        <h2>曲目命中</h2>
        <span class="count">{{ results.tracks.length }}</span>
      </header>
      <ul class="list">
        <li
          v-for="(t, i) in results.tracks"
          :key="`${t.origin.kind}-${t.track.name}-${t.track.artist}-${i}`"
        >
          <TrackHitCard :hit="t" />
        </li>
      </ul>
    </section>

    <section v-if="results.rightsHolders.length > 0" class="group">
      <header class="group-head">
        <h2>版权方命中</h2>
        <span class="count">{{ results.rightsHolders.length }}</span>
      </header>
      <ul class="list compact">
        <li v-for="rh in results.rightsHolders" :key="rh.id">
          <RightsHolderCard :hit="rh" />
        </li>
      </ul>
    </section>

    <section v-if="results.artists.length > 0" class="group">
      <header class="group-head">
        <h2>艺人命中</h2>
        <span class="count">{{ results.artists.length }}</span>
      </header>
      <ul class="list compact">
        <li v-for="a in results.artists" :key="a.id">
          <ArtistCard :hit="a" />
        </li>
      </ul>
    </section>
  </section>
</template>

<style scoped>
.state {
  padding-top: var(--space-4);
  padding-bottom: var(--space-12);
}

/* empty */
.empty .stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  padding: var(--space-6) 0;
  border-bottom: 1px solid var(--color-border);
}
.stat {
  display: flex;
  flex-direction: column;
  align-items: baseline;
  gap: var(--space-1);
}
.stat-num {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.hint {
  padding: var(--space-5) 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  max-width: 60ch;
}
.hint b {
  font-weight: 600;
  color: var(--color-text);
}

/* notfound */
.notfound {
  padding: var(--space-10) 0;
}
.notfound .big {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}
.warning {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-restricted-border);
  background: var(--color-restricted-bg);
  border-radius: var(--radius-md);
  color: var(--color-restricted);
  font-size: 13px;
  line-height: 1.7;
  max-width: 60ch;
}
.warning-text {
  flex: 1 1 auto;
  min-width: 0;
}
.warning b {
  color: var(--color-restricted);
  font-weight: 700;
}
.warning-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-restricted);
  color: var(--color-restricted-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex: 0 0 auto;
  margin-top: 2px;
}

/* results */
.results {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}
.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.group-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}
.group-head h2 {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.count {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
}
.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.list.compact {
  gap: var(--space-2);
}
</style>
