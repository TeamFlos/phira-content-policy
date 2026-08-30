<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

const showTop = ref(false);
const showBottom = ref(false);
let updateFrame: number | undefined;
let resizeObserver: ResizeObserver | undefined;

function updateVisibility(): void {
  updateFrame = undefined;
  const scrollTop = window.scrollY;
  const viewportHeight = window.innerHeight;
  const pageHeight = document.documentElement.scrollHeight;
  const remaining = pageHeight - scrollTop - viewportHeight;
  const revealDistance = Math.max(240, viewportHeight * 0.35);
  const hasScrollablePage = pageHeight - viewportHeight > 160;

  showTop.value = hasScrollablePage && scrollTop > revealDistance;
  showBottom.value = hasScrollablePage && remaining > revealDistance;
}

function scheduleVisibilityUpdate(): void {
  if (updateFrame !== undefined) return;
  updateFrame = window.requestAnimationFrame(updateVisibility);
}

function scrollTo(top: number): void {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  window.scrollTo({ top, behavior });
}

function scrollToTop(): void {
  scrollTo(0);
}

function scrollToBottom(): void {
  scrollTo(document.documentElement.scrollHeight);
}

onMounted(() => {
  updateVisibility();
  window.addEventListener("scroll", scheduleVisibilityUpdate, { passive: true });
  window.addEventListener("resize", scheduleVisibilityUpdate);
  resizeObserver = new ResizeObserver(scheduleVisibilityUpdate);
  resizeObserver.observe(document.documentElement);
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", scheduleVisibilityUpdate);
  window.removeEventListener("resize", scheduleVisibilityUpdate);
  resizeObserver?.disconnect();
  if (updateFrame !== undefined) window.cancelAnimationFrame(updateFrame);
});
</script>

<template>
  <div class="scroll-actions" aria-label="页面滚动快捷操作">
    <Transition name="scroll-action">
      <button
        v-if="showTop"
        type="button"
        class="scroll-button"
        aria-label="返回页面顶部"
        title="返回顶部"
        @click="scrollToTop"
      >
        <span aria-hidden="true">↑</span>
      </button>
    </Transition>
    <Transition name="scroll-action">
      <button
        v-if="showBottom"
        type="button"
        class="scroll-button"
        aria-label="前往页面底部"
        title="前往底部"
        @click="scrollToBottom"
      >
        <span aria-hidden="true">↓</span>
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.scroll-actions {
  position: fixed;
  z-index: 30;
  right: max(var(--space-5), env(safe-area-inset-right));
  bottom: max(var(--space-5), env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}
.scroll-button {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid var(--color-border-strong);
  border-radius: 50%;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-surface) 92%, transparent);
  box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
  font-size: 18px;
  line-height: 1;
  pointer-events: auto;
  backdrop-filter: blur(8px);
}
.scroll-button:hover {
  border-color: var(--color-text);
  color: var(--color-bg);
  background: var(--color-text);
}
.scroll-button:active {
  transform: translateY(1px);
}
.scroll-action-enter-active,
.scroll-action-leave-active {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}
.scroll-action-enter-from,
.scroll-action-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 620px) {
  .scroll-actions {
    right: max(var(--space-3), env(safe-area-inset-right));
    bottom: max(var(--space-3), env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-action-enter-active,
  .scroll-action-leave-active {
    transition: none;
  }
}
</style>
