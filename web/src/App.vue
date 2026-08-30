<script setup lang="ts">
import { computed, ref } from "vue";
import BrowseControls from "./components/BrowseControls.vue";
import ReportDialog from "./components/ReportDialog.vue";
import SearchBar from "./components/SearchBar.vue";
import ResultsPanel from "./components/ResultsPanel.vue";
import { useSearch } from "./composables/useSearch";
import { policyIndex } from "./search/policyIndex";
import type { ResultKind, SearchOptions, SortMode } from "./search/index";
import type { Status } from "./data/schema";

const query = ref("");
const browse = ref(false);
const kind = ref<ResultKind>("all");
const status = ref<Status | "all">("all");
const sort = ref<SortMode>("count");
const options = computed<SearchOptions>(() => ({
  browse: browse.value,
  kind: kind.value,
  status: status.value,
  sort: sort.value,
}));
const results = useSearch(query, options);
const hasFilters = computed(
  () => kind.value !== "all" || status.value !== "all" || sort.value !== "count",
);

function clearFilters(): void {
  kind.value = "all";
  status.value = "all";
  sort.value = "count";
}
</script>

<template>
  <div class="app">
    <main class="container">
      <header class="page-head">
        <h1 class="page-title">Phira 内容策略</h1>
        <p class="tagline">查曲目、版权方、艺人在 Phira 上是否可用。</p>
      </header>

      <SearchBar v-model="query" />
      <BrowseControls
        v-model:kind="kind"
        v-model:status="status"
        v-model:sort="sort"
        :active="browse"
        :has-filters="hasFilters"
        @activate="browse = true"
        @toggle="browse = !browse"
        @clear="clearFilters"
      />

      <ResultsPanel :results="results" :stats="policyIndex.stats" />
    </main>

    <footer class="container site-foot">
      <p>数据有误，或想补充内容？<ReportDialog />。</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.page-head {
  padding: var(--space-10) 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-4);
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}
.tagline {
  margin-top: var(--space-2);
  font-size: 14px;
  color: var(--color-text-secondary);
}
.site-foot {
  margin-top: auto;
  padding: var(--space-6) var(--space-5);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.7;
}
</style>
