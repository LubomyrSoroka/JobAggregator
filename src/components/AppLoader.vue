<template>
  <div :class="size === 'small' ? 'loader-container-small' : 'loader-container'">
    <div :class="size === 'small' ? 'loader-small' : 'loader'"></div>
    <div v-if="text" class="loader-text">{{ text }}</div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
  size?: 'small';
}>()
</script>

<style scoped>

.loader-container, .loader-container-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.loader-container{
  padding: 20px;
}
.loader-container-small{
  padding: 0px;
}

.loader, .loader-small {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

.loader{
  width: 40px;
  height: 40px;
}

.loader-small{
  width: 20px;
  height: 20px;
}

.loader-text {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
