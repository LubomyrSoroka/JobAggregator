<template>
    <Transition name="slide-up">
        <div v-if='display' class='save-message'>
            {{ message }}
        </div>
    </Transition>
</template>

<style>
.save-message{
    position: fixed;
    bottom: 20px;
    left: 20px;
    background-color: white;
    color: black;
    padding: 10px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    z-index: 99999999999;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
    border-left: 10px solid green;
    font-style: italic;

}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(30px);
}

</style>

<script setup lang="ts">
import { ref } from 'vue';

const display = ref(false);
const props = defineProps({
    message: {
        type: String,
        required: true
    }
})

let timeout: number | undefined;

const show = () => {
    display.value = true;
    if (timeout) clearTimeout(timeout);
    timeout = window.setTimeout(() => {
        display.value = false;
    }, 3000);
}

defineExpose({ show });

</script>