<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, useId } from "vue";
import type { Status } from "../data/schema";

const props = defineProps<{ status: Status; note?: string }>();
const trigger = ref<HTMLElement | null>(null);
const tooltip = ref<HTMLElement | null>(null);
const tooltipId = useId();
const isTooltipVisible = ref(false);
let hideTimer: ReturnType<typeof setTimeout> | undefined;

const labels: Record<Status, string> = {
  forbidden: "禁止",
  restricted: "受限",
  free: "可用",
};

function clearHideTimer(): void {
  if (hideTimer !== undefined) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
}

function positionTooltip(): void {
  const anchor = trigger.value;
  const popup = tooltip.value;
  if (!anchor || !popup || !isTooltipVisible.value) return;

  const anchorRect = anchor.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const viewportInset = 12;
  const gap = 8;
  const maxLeft = Math.max(viewportInset, window.innerWidth - popupRect.width - viewportInset);
  const maxTop = Math.max(viewportInset, window.innerHeight - popupRect.height - viewportInset);
  const left = Math.min(Math.max(anchorRect.right - popupRect.width, viewportInset), maxLeft);
  const preferredTop = anchorRect.top - popupRect.height - gap;
  const top = Math.min(
    Math.max(preferredTop >= viewportInset ? preferredTop : anchorRect.bottom + gap, viewportInset),
    maxTop,
  );

  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(top)}px`;
}

function showTooltip(): void {
  clearHideTimer();
  const popup = tooltip.value;
  if (!props.note || !popup) return;

  if (!isTooltipVisible.value) {
    isTooltipVisible.value = true;
    try {
      popup.showPopover();
    } catch {
      // Older browsers still render the fixed-position fallback.
    }
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
  }
  void nextTick(positionTooltip);
}

function hideTooltip(): void {
  clearHideTimer();
  if (!isTooltipVisible.value) return;
  isTooltipVisible.value = false;
  const popup = tooltip.value;
  try {
    popup?.hidePopover();
  } catch {
    // The fallback may not implement the Popover API.
  }
  window.removeEventListener("resize", positionTooltip);
  window.removeEventListener("scroll", positionTooltip, true);
}

function scheduleHide(): void {
  clearHideTimer();
  hideTimer = setTimeout(hideTooltip, 180);
}

onBeforeUnmount(hideTooltip);
</script>

<template>
  <span
    ref="trigger"
    class="badge-wrap"
    :class="{ 'has-tooltip': props.note }"
    :tabindex="props.note ? 0 : undefined"
    :aria-describedby="props.note ? tooltipId : undefined"
    :aria-label="props.note ? `${labels[status]}：${props.note}` : undefined"
    @pointerenter="showTooltip"
    @pointerleave="scheduleHide"
    @focus="showTooltip"
    @blur="scheduleHide"
  >
    <span class="badge" :class="`status-${status}`">
      <span class="dot" aria-hidden="true" />
      <span class="text">{{ labels[status] }}</span>
    </span>
    <span
      v-if="props.note"
      :id="tooltipId"
      ref="tooltip"
      class="tooltip"
      :class="{ 'is-visible': isTooltipVisible }"
      popover="manual"
      role="tooltip"
      @pointerenter="clearHideTimer"
      @pointerleave="scheduleHide"
    >
      {{ props.note }}
    </span>
  </span>
</template>

<style scoped>
.badge-wrap {
  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
}
.badge-wrap:focus-visible {
  outline: 2px solid var(--color-text);
  outline-offset: 3px;
  border-radius: 999px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.6;
  white-space: nowrap;
  border: 1px solid transparent;
}
.tooltip {
  position: fixed;
  inset: auto;
  z-index: 1000;
  width: min(320px, calc(100vw - 24px));
  margin: 0;
  padding: 8px 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  color: var(--color-text);
  background: var(--color-surface-elevated);
  box-shadow: 0 8px 24px rgb(0 0 0 / 22%);
  font-size: 12px;
  font-weight: 400;
  line-height: 1.55;
  text-align: left;
  white-space: normal;
  user-select: text;
  visibility: hidden;
  opacity: 0;
  pointer-events: auto;
  transform: translateY(3px);
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}
.tooltip.is-visible {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex: 0 0 auto;
}
.status-forbidden {
  color: var(--color-forbidden);
  background: var(--color-forbidden-bg);
  border-color: var(--color-forbidden-border);
}
.status-restricted {
  color: var(--color-restricted);
  background: var(--color-restricted-bg);
  border-color: var(--color-restricted-border);
}
.status-free {
  color: var(--color-free);
  background: var(--color-free-bg);
  border-color: var(--color-free-border);
}
</style>
