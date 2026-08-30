<script setup lang="ts">
import { useAnimatedDialog } from "../composables/useAnimatedDialog";
import type { RelatedTrack } from "../search/index";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps<{
  title: string;
  triggerLabel: string;
  tracks: readonly RelatedTrack[];
}>();

const { setDialog, open, close, closeOnBackdrop, closeOnCancel, finishClose } = useAnimatedDialog();
const dialogTitleId = `track-details-dialog-${Math.random().toString(36).slice(2)}`;
</script>

<template>
  <button type="button" class="details-trigger" @click="open">
    {{ triggerLabel }}
    <span aria-hidden="true">↗</span>
  </button>

  <dialog
    :ref="setDialog"
    class="animated-dialog"
    :aria-labelledby="dialogTitleId"
    @animationend="finishClose"
    @cancel="closeOnCancel"
    @click="closeOnBackdrop"
  >
    <div class="dialog-panel">
      <header class="dialog-head">
        <div>
          <h2 :id="dialogTitleId">{{ title }}</h2>
          <p>共 {{ props.tracks.length }} 首曲目</p>
        </div>
        <button type="button" class="close" aria-label="关闭曲目列表" @click="close">×</button>
      </header>

      <ul class="track-list">
        <li
          v-for="(relatedTrack, i) in props.tracks"
          :key="`${relatedTrack.track.name}-${relatedTrack.track.artist}-${i}`"
        >
          <div class="track-copy">
            <span class="track-name">{{ relatedTrack.track.name }}</span>
            <span class="track-artist">{{ relatedTrack.track.artist }}</span>
          </div>
          <div class="track-policy">
            <StatusBadge :status="relatedTrack.composite" :note="relatedTrack.note" />
            <span v-if="!relatedTrack.track.status" class="inheritance">继承版权方</span>
            <span v-else class="inheritance">曲目自身</span>
          </div>
        </li>
      </ul>
    </div>
  </dialog>
</template>

<style scoped>
.details-trigger {
  align-self: flex-start;
  margin-top: var(--space-1);
  padding: 4px 0;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.details-trigger:hover {
  color: var(--color-text);
}
.details-trigger span {
  margin-left: var(--space-1);
  color: var(--color-text-tertiary);
}
dialog {
  width: min(720px, calc(100vw - 32px));
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
.track-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 520px;
  overflow: auto;
  padding-top: var(--space-3);
}
.track-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 9px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.track-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}
.track-name {
  overflow: hidden;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track-artist {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track-policy {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  flex: 0 0 auto;
}
.inheritance {
  color: var(--color-text-tertiary);
  font-size: 11px;
  white-space: nowrap;
}
@media (max-width: 520px) {
  .dialog-panel {
    padding: var(--space-4);
  }
  .track-list li {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-2);
  }
  .track-policy {
    align-self: stretch;
  }
}
</style>
