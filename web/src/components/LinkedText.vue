<script setup lang="ts">
import { computed } from "vue";
import { openLink } from "../utils/externalLinks";
import { parseLinkedText } from "../utils/linkedText";

const props = defineProps<{ text: string }>();
const segments = computed(() => parseLinkedText(props.text));

function openRequestedLink(event: Event, href: string, label: string): void {
  event.preventDefault();
  const anchor = event.currentTarget;
  openLink({
    href,
    label,
    sourceDialog:
      anchor instanceof HTMLAnchorElement
        ? anchor.closest<HTMLDialogElement>("dialog[open]")
        : null,
    target: anchor instanceof HTMLAnchorElement ? anchor.target || "_self" : "_self",
  });
}

function handleClick(event: MouseEvent, href: string, label: string): void {
  event.preventDefault();
  event.stopPropagation();
  openRequestedLink(event, href, label);
}
</script>

<template>
  <template v-for="(segment, index) in segments" :key="index">
    <a
      v-if="segment.href"
      class="linked-text-link"
      :href="segment.href"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="`${segment.text}（在新标签页打开）`"
      @click="handleClick($event, segment.href, segment.text)"
    >
      {{ segment.text }}&#8288;<svg
        class="external-link-icon"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M9 2.5h4.5V7" />
        <path d="m13.25 2.75-6 6" />
        <path d="M11.5 8.5v3A2 2 0 0 1 9.5 13.5h-5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h3" />
      </svg>
    </a>
    <template v-else>{{ segment.text }}</template>
  </template>
</template>

<style scoped>
.external-link-icon {
  width: 0.9em;
  height: 0.9em;
  margin-left: 0.2em;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
  vertical-align: -0.08em;
}
</style>
