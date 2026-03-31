<script setup lang="ts">
import { RouterView } from 'vue-router'
import Profile from './components/Profile.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-content">
        <div class="logo">JobAggregator</div>
        <Profile />
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-header {
  flex: 0 0 60px;
  /* Fixed height for header, or omit for dynamic */
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  z-index: 100;
  padding: 0 20px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  max-width: 90%;
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
  flex: 1;
  overflow: hidden;
  /* Crucial for internal scrollbars in views */
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
