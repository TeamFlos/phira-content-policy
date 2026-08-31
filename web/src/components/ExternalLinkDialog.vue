<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useAnimatedDialog } from "../composables/useAnimatedDialog";
import {
  EXTERNAL_LINK_REQUEST_EVENT,
  type ExternalLinkRequest,
  openLink,
} from "../utils/externalLinks";

interface PendingLink {
  href: string;
  label: string;
  target: string;
}

const pendingLink = ref<PendingLink | null>(null);
let suspendedDialog: HTMLDialogElement | null = null;
const destinationLabel = computed(() => pendingLink.value?.label || "外部链接");
const {
  setDialog,
  open: openDialog,
  close,
  closeOnBackdrop,
  closeOnCancel,
  finishClose,
} = useAnimatedDialog();

function showExternalLink(request: ExternalLinkRequest): void {
  let url: URL;
  try {
    url = new URL(request.href, window.location.href);
  } catch {
    return;
  }

  if (!(["http:", "https:"] as const).includes(url.protocol as "http:" | "https:")) return;
  if (url.origin === window.location.origin) return;

  pendingLink.value = {
    href: url.href,
    label: request.label.replace(/\u2060/g, "").trim(),
    target: request.target || "_self",
  };
  if (request.sourceDialog?.open) {
    suspendedDialog = request.sourceDialog;
    suspendedDialog.close();
  }
  openDialog();
}

function handleExternalLinkRequest(event: Event): void {
  showExternalLink((event as CustomEvent<ExternalLinkRequest>).detail);
}

function handleDocumentClick(event: MouseEvent): void {
  if (event.defaultPrevented) return;

  const element = event.target instanceof Element ? event.target : null;
  const anchor = element?.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return;
  if (anchor.dataset.externalConfirmed === "true" || anchor.hasAttribute("download")) return;

  const result = openLink({
    href: anchor.href,
    label:
      anchor.dataset.externalLabel?.replace(/\u2060/g, "").trim() ||
      anchor.textContent?.replace(/\u2060/g, "").trim() ||
      "",
    sourceDialog: anchor.closest<HTMLDialogElement>("dialog[open]"),
    target: anchor.target || "_self",
  });
  if (result !== "invalid") event.preventDefault();
}

function clearPendingLink(): void {
  pendingLink.value = null;
  const dialog = suspendedDialog;
  suspendedDialog = null;
  if (dialog?.isConnected && !dialog.open) dialog.showModal();
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  window.addEventListener(EXTERNAL_LINK_REQUEST_EVENT, handleExternalLinkRequest);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  window.removeEventListener(EXTERNAL_LINK_REQUEST_EVENT, handleExternalLinkRequest);
  if (suspendedDialog?.isConnected && !suspendedDialog.open) suspendedDialog.showModal();
  suspendedDialog = null;
});
</script>

<template>
  <dialog
    :ref="setDialog"
    class="animated-dialog external-link-dialog"
    aria-labelledby="external-link-title"
    aria-describedby="external-link-description"
    @animationend="finishClose"
    @cancel="closeOnCancel"
    @click="closeOnBackdrop"
    @close="clearPendingLink"
  >
    <div class="dialog-panel">
      <header class="dialog-head">
        <span class="notice-icon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path d="M10 6.25v4.5" />
            <path d="M10 14h.01" />
            <circle cx="10" cy="10" r="8" />
          </svg>
        </span>
        <div class="dialog-copy">
          <h2 id="external-link-title">即将离开本站</h2>
          <p id="external-link-description">
            你将前往第三方网站。站外内容不由本项目维护，请留意内容时效性与账户安全。
          </p>
        </div>
        <button type="button" class="close" aria-label="关闭站外链接提醒" @click="close">×</button>
      </header>

      <div v-if="pendingLink" class="destination">
        <span class="destination-caption">即将访问</span>
        <strong>{{ destinationLabel }}</strong>
        <span class="destination-url mono">{{ pendingLink.href }}</span>
      </div>

      <footer class="dialog-actions">
        <button type="button" class="action secondary" autofocus @click="close">取消</button>
        <a
          v-if="pendingLink"
          class="action primary"
          :href="pendingLink.href"
          :target="pendingLink.target"
          rel="noopener noreferrer"
          data-external-confirmed="true"
          @click="close"
        >
          继续访问
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M9 2.5h4.5V7" />
            <path d="m13.25 2.75-6 6" />
            <path d="M11.5 8.5v3A2 2 0 0 1 9.5 13.5h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3" />
          </svg>
        </a>
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
dialog {
  width: min(520px, calc(100vw - 32px));
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--space-3);
}
.notice-icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--color-restricted-border);
  border-radius: 50%;
  color: var(--color-restricted);
  background: var(--color-restricted-bg);
}
.notice-icon svg {
  width: 20px;
  height: 20px;
  stroke-width: 1.7;
  stroke-linecap: round;
}
.dialog-copy h2 {
  font-size: 19px;
  letter-spacing: -0.01em;
}
.dialog-copy p {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: 12px;
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
.destination {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-5);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.destination-caption {
  color: var(--color-text-tertiary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.destination strong {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.destination-url {
  margin-top: var(--space-1);
  overflow-wrap: anywhere;
  color: var(--color-text-tertiary);
  font-size: 11px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
}
.action {
  display: inline-flex;
  min-width: 92px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
}
.action:hover {
  border-color: var(--color-text);
}
.action.primary {
  border-color: var(--color-text);
  color: var(--color-bg);
  background: var(--color-text);
}
.action.secondary {
  color: var(--color-text-secondary);
  background: var(--color-surface);
}
.action svg {
  width: 13px;
  height: 13px;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

@media (max-width: 460px) {
  .dialog-head {
    grid-template-columns: auto 1fr;
  }
  .close {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }
  .dialog-copy {
    grid-column: 1 / -1;
  }
  .dialog-actions {
    flex-direction: column-reverse;
  }
  .action {
    width: 100%;
  }
}
</style>
