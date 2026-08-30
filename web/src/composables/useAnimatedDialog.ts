import { onBeforeUnmount, ref, type ComponentPublicInstance } from "vue";

const closeFallbackMs = 240;

export function useAnimatedDialog() {
  const dialog = ref<HTMLDialogElement | null>(null);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  function setDialog(element: Element | ComponentPublicInstance | null): void {
    dialog.value = element instanceof HTMLDialogElement ? element : null;
  }

  function clearCloseTimer(): void {
    if (closeTimer !== undefined) {
      clearTimeout(closeTimer);
      closeTimer = undefined;
    }
  }

  function finishClose(event?: AnimationEvent): void {
    const element = dialog.value;
    if (!element?.classList.contains("is-closing")) return;
    if (event && event.target !== element) return;

    clearCloseTimer();
    element.classList.remove("is-closing");
    element.close();
  }

  function open(): void {
    const element = dialog.value;
    if (!element || element.open) return;
    clearCloseTimer();
    element.classList.remove("is-closing");
    element.showModal();
  }

  function close(): void {
    const element = dialog.value;
    if (!element?.open || element.classList.contains("is-closing")) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.close();
      return;
    }

    element.classList.add("is-closing");
    closeTimer = setTimeout(() => finishClose(), closeFallbackMs);
  }

  function closeOnBackdrop(event: MouseEvent): void {
    if (event.target === dialog.value) close();
  }

  function closeOnCancel(event: Event): void {
    event.preventDefault();
    close();
  }

  onBeforeUnmount(() => {
    clearCloseTimer();
    dialog.value?.close();
  });

  return { setDialog, open, close, closeOnBackdrop, closeOnCancel, finishClose };
}
