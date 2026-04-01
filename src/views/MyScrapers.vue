<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getStorageObject } from '../services/storageService'

// 1. Create a reactive variable to hold the scrapers
const scrapers = ref<any[]>([])
onMounted(async () => {
    // 2. Read the data from storage service
    scrapers.value = await getStorageObject<any[]>('my_scraper_data', [])
})
</script>

<template>
    <div class="my-scrapers-page">
        <div class="my-scrapers">
            My Scrapers
        </div>

        <div class="scrapers-list">
            <RouterLink v-for="scraper in scrapers" :key="scraper" class="scraper"
                :to="`/code-editor?scraper-name=${scraper}`">
                {{ scraper }}
            </RouterLink>
            <RouterLink class="add" to="/code-editor">
                +
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.my-scrapers-page {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}
</style>
