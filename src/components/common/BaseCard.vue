<template>
  <div class="bg-white rounded-xl shadow-sm border border-rule overflow-hidden">
    <div v-if="$slots.header" class="px-4 py-3 border-b border-rule">
      <slot name="header" />
    </div>
    <div class="p-4">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 py-3 border-t border-rule bg-bg2">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
