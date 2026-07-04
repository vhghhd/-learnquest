<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 animate-pop-in">
      <div v-if="$slots.header" class="px-6 py-4 border-b border-rule">
        <slot name="header" />
      </div>
      <div class="p-6">
        <slot />
      </div>
      <div v-if="$slots.footer" class="px-6 py-4 border-t border-rule flex justify-end gap-3">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

defineProps<Props>()
defineEmits<{
  close: []
}>()
</script>
