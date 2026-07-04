<template>
  <button
    :class="[
      'px-4 py-2 rounded-lg font-medium transition-all duration-200',
      variantClasses,
      sizeClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-accent text-white hover:bg-accent-dark'
    case 'secondary':
      return 'bg-bg2 text-ink hover:bg-rule'
    case 'outline':
      return 'border-2 border-accent text-accent hover:bg-accent hover:text-white'
    case 'ghost':
      return 'text-ink hover:bg-bg2'
    default:
      return ''
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm'
    case 'lg':
      return 'px-6 py-3 text-lg'
    default:
      return 'px-4 py-2'
  }
})
</script>
