<template>
  <svg
    class="trend-indicator"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="tone === 'positive'">
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </template>

    <template v-else-if="tone === 'warning'">
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </template>

    <template v-else-if="tone === 'water'">
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </template>

    <path v-else d="M5 12h14" />
  </svg>
</template>

<script setup>
defineProps({
  tone: {
    type: String,
    default: "neutral",
    validator: value => ["positive", "warning", "neutral", "water"].includes(value),
  },
  size: {
    type: [Number, String],
    default: 14,
  },
});
</script>

<style scoped>
.trend-indicator {
  display: inline-block;
  flex: 0 0 auto;
  overflow: visible;
  vertical-align: middle;
}
</style>
