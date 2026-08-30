<script setup lang="ts">
import { computed, ref } from "vue";
import { useIssueTemplates } from "../composables/useIssueTemplates";

const dialog = ref<HTMLDialogElement | null>(null);
const issueBase = "https://github.com/TeamFlos/phira-content-policy/issues/new?template=";
const issuesUrl = "https://github.com/TeamFlos/phira-content-policy/issues";
const { templates, isLoading } = useIssueTemplates();
const groupedTemplates = computed(() => {
  const groups = new Map<
    string,
    { name: string; description: string; templates: (typeof templates.value)[number][] }
  >();
  for (const template of templates.value) {
    const groupId = template.fileName.replace(/^\d+-/, "").replace(/-(?:zh|en)(?=\.ya?ml$)/i, "");
    const group = groups.get(groupId) ?? {
      name: template.name,
      description: template.description,
      templates: [],
    };
    if (template.locale === "zh" || group.templates.length === 0) {
      group.name = template.name;
      group.description = template.description;
    }
    group.templates.push(template);
    groups.set(groupId, group);
  }
  return [...groups.values()];
});

function templateUrl(fileName: string): string {
  return `${issueBase}${encodeURIComponent(fileName)}`;
}

function open(): void {
  dialog.value?.showModal();
}

function close(): void {
  dialog.value?.close();
}

function closeOnBackdrop(event: MouseEvent): void {
  if (event.target === dialog.value) close();
}
</script>

<template>
  <button type="button" class="report-trigger" @click="open">选择汇报类型</button>

  <dialog ref="dialog" aria-labelledby="report-title" @click="closeOnBackdrop">
    <div class="dialog-panel">
      <header class="dialog-head">
        <div>
          <h2 id="report-title">选择汇报类型</h2>
          <p>选择最符合情况的模板，随后前往 GitHub 填写。</p>
          <span v-if="isLoading" class="sync-status" aria-live="polite">正在同步最新模板…</span>
        </div>
        <button type="button" class="close" aria-label="关闭汇报类型选择框" @click="close">
          ×
        </button>
      </header>

      <ul v-if="groupedTemplates.length > 0" class="report-list">
        <li v-for="report in groupedTemplates" :key="report.name" class="report-item">
          <div class="report-copy">
            <h3>{{ report.name }}</h3>
            <p>{{ report.description }}</p>
          </div>
          <div class="language-links" aria-label="模板语言">
            <a
              v-for="template in report.templates"
              :key="template.fileName"
              :href="templateUrl(template.fileName)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ template.locale === "zh" ? "中文" : template.locale === "en" ? "EN" : "打开" }}</a
            >
          </div>
        </li>
      </ul>
      <p v-else class="empty-report">
        当前没有可用模板，<a :href="issuesUrl" target="_blank" rel="noopener noreferrer"
          >前往 Issues</a
        >。
      </p>
      <p class="report-fallback">
        模板无法打开？<a :href="issuesUrl" target="_blank" rel="noopener noreferrer"
          >直接打开 Issues</a
        >。
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.report-trigger {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-border-strong);
  text-underline-offset: 2px;
}
.report-trigger:hover {
  text-decoration-color: var(--color-text);
}
dialog {
  width: min(640px, calc(100vw - 32px));
  max-height: min(720px, calc(100vh - 32px));
  padding: 0;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  color: var(--color-text);
  background: var(--color-surface);
  box-shadow: 0 24px 80px rgb(0 0 0 / 32%);
}
dialog::backdrop {
  background: rgb(2 6 23 / 64%);
  backdrop-filter: blur(3px);
}
.dialog-panel {
  padding: var(--space-5);
}
.dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.dialog-head h2 {
  font-size: 19px;
  letter-spacing: -0.01em;
}
.dialog-head p {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: 12px;
}
.sync-status {
  display: inline-block;
  margin-top: var(--space-2);
  color: var(--color-text-tertiary);
  font-size: 11px;
}
.close {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  font-size: 20px;
  line-height: 1;
}
.close:hover {
  color: var(--color-text);
  background: var(--color-border);
}
.report-list {
  display: flex;
  flex-direction: column;
  padding-top: var(--space-2);
}
.report-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}
.report-item:last-child {
  border-bottom: 0;
}
.report-copy h3 {
  font-size: 14px;
}
.report-copy p {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.language-links {
  display: flex;
  gap: var(--space-2);
}
.language-links a {
  min-width: 44px;
  padding: 6px 9px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
}
.language-links a:hover {
  border-color: var(--color-text);
  background: var(--color-text);
  color: var(--color-bg);
}
.report-fallback {
  padding-top: var(--space-3);
  color: var(--color-text-tertiary);
  font-size: 11px;
}
.report-fallback a,
.empty-report a {
  color: var(--color-text-secondary);
}

@media (max-width: 520px) {
  .report-item {
    align-items: start;
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }
}
</style>
