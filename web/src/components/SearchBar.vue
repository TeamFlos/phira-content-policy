<script setup lang="ts">
import { onMounted, ref } from "vue";

const model = defineModel<string>({ required: true });
const inputEl = ref<HTMLInputElement | null>(null);

function clear(): void {
  model.value = "";
  inputEl.value?.focus();
}

onMounted(() => inputEl.value?.focus());
</script>

<template>
  <div class="searchbar">
    <div class="field">
      <span class="prefix" aria-hidden="true">⌕</span>
      <input
        ref="inputEl"
        v-model="model"
        type="search"
        placeholder="输入曲名、版权方或艺人名…"
        autocomplete="off"
        spellcheck="false"
        aria-label="搜索内容策略"
      />
      <button
        v-if="model.length > 0"
        type="button"
        class="clear"
        aria-label="清除搜索"
        @click="clear"
      >
        清除
      </button>
    </div>
  </div>
</template>

<style scoped>
.searchbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: var(--space-4) 0;
  background: var(--color-bg);
}
.field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    border-color 120ms ease,
    box-shadow 120ms ease;
}
.field:focus-within {
  border-color: var(--color-text);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-text) 10%, transparent);
}
.prefix {
  color: var(--color-text-tertiary);
  font-size: 16px;
  line-height: 1;
  flex: 0 0 auto;
}
input {
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 15px;
  font-weight: 500;
  min-width: 0;
}
input::placeholder {
  color: var(--color-text-tertiary);
  font-weight: 400;
}
.clear {
  flex: 0 0 auto;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition:
    color 200ms ease,
    background 200ms ease;
}
.clear:hover {
  color: var(--color-text);
  background: var(--color-border);
}
input::-webkit-search-cancel-button {
  display: none;
}
</style>
