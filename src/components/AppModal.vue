<template>
  <transition name="modal">
    <div v-if="modelValue" class="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" @click.self="$emit('update:modelValue', false)">
      <div class="modal-box bg-white rounded-2xl shadow-2xl w-full overflow-hidden" :class="sizeClass">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="font-display font-800 text-gray-800">{{ title }}</h2>
          <button @click="$emit('update:modelValue', false)" class="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div class="px-6 py-5 max-h-[70vh] overflow-y-auto">
          <slot />
        </div>
        <div v-if="$slots.footer" class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  modelValue: Boolean,
  title: String,
  size: { type: String, default: 'md' }
})
defineEmits(['update:modelValue'])
const sizeClass = computed(() => ({
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}[props.size]))
</script>
