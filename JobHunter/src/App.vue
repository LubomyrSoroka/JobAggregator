<script setup lang="ts">
import { RouterView } from 'vue-router'
import Profile from './components/Profile.vue'
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo">JobHunter</div>
      <Profile />
    </div>
  </header>
  <main class="app-main">
    <RouterView />
  </main>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  z-index: 100;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: #3b82f6;
}

.app-main {
  margin-top: 60px;
  padding: 20px;
}
</style>
