<template>
    <div class="tooltip-wrapper" @mouseenter="showTooltip" @mouseleave="hideTooltip">
        <slot />
        <transition name="tooltip-fade">
            <div v-if="show" class="tooltip" :class="placement" @mouseenter="showTooltip" @mouseleave="hideTooltip">
                {{ text }}
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{
    text: string
    placement?: 'top' | 'right' | 'bottom' | 'left'
}>(), {
    placement: 'top'
})

const show = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

function showTooltip() {
    if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
    }
    show.value = true
}

function hideTooltip() {
    hideTimeout = setTimeout(() => {
        show.value = false
    }, 100)
}
</script>

<style src="~/assets/css/tooltip.css" scoped></style>
