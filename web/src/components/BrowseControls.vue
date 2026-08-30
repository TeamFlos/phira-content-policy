<script setup lang="ts">
import type { ResultKind, SortMode } from "../search/index";
import type { Status } from "../data/schema";

const props = defineProps<{ active: boolean; hasFilters: boolean }>();
const emit = defineEmits<{ activate: []; toggle: []; clear: [] }>();
const kind = defineModel<ResultKind>("kind", { required: true });
const status = defineModel<Status | "all">("status", { required: true });
const sort = defineModel<SortMode>("sort", { required: true });

function activate(): void {
  emit("activate");
}
</script>

<template>
  <section class="browse-controls" aria-label="筛选与排序">
    <div class="selects">
      <label>
        <span>范围</span>
        <select v-model="kind" @change="activate">
          <option value="all">全部内容</option>
          <option value="tracks">曲目</option>
          <option value="rightsHolders">版权方</option>
          <option value="artists">艺人</option>
        </select>
      </label>

      <label>
        <span>判定</span>
        <select v-model="status" @change="activate">
          <option value="all">全部状态</option>
          <option value="forbidden">禁止</option>
          <option value="restricted">受限</option>
          <option value="free">可用</option>
        </select>
      </label>

      <label>
        <span>排序</span>
        <select v-model="sort" @change="activate">
          <option value="count">收录最多</option>
          <option value="countAsc">收录最少</option>
          <option value="name">A–Z</option>
          <option value="nameDesc">Z–A</option>
          <option value="addedAt">最新添加</option>
          <option value="addedAtAsc">最早添加</option>
          <option value="severity" :disabled="status !== 'all'">禁止优先</option>
          <option value="severityAsc" :disabled="status !== 'all'">可用优先</option>
        </select>
      </label>
    </div>

    <div class="actions">
      <button
        type="button"
        class="clear-filters"
        :disabled="!props.hasFilters"
        @click="emit('clear')"
      >
        清除筛选
      </button>
      <button type="button" class="browse-toggle" :aria-pressed="active" @click="emit('toggle')">
        {{ active ? "收起浏览" : "浏览策略库" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.browse-controls {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.selects {
  display: flex;
  align-items: end;
  gap: var(--space-2);
  flex-wrap: wrap;
}
label {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
label > span {
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
select {
  min-height: 34px;
  padding: 6px 30px 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
select:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text);
}
.browse-toggle {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 6px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface);
  font-size: 12px;
  font-weight: 600;
}
.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
}
.clear-filters {
  min-height: 34px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  font-size: 12px;
}
.clear-filters:not(:disabled):hover {
  border-color: var(--color-border);
  color: var(--color-text);
  background: var(--color-surface);
}
.clear-filters:disabled {
  cursor: default;
  opacity: 0.55;
}
.browse-toggle:hover,
.browse-toggle[aria-pressed="true"] {
  background: var(--color-text);
  border-color: var(--color-text);
  color: var(--color-bg);
}

@media (max-width: 620px) {
  .browse-controls {
    align-items: stretch;
    flex-direction: column;
  }
  .actions {
    justify-content: space-between;
  }
  .selects {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  select {
    width: 100%;
    padding-right: 6px;
  }
}
</style>
