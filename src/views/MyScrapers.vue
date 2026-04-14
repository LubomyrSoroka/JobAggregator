<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { getAllStorageObjects } from '../services/storageService'
import { MY_SCRAPERS } from '../services/storeNames'

const scrapers = ref<any[]>([])
onMounted(async () => {
    scrapers.value = await getAllStorageObjects(MY_SCRAPERS)
})
</script>

<template>
    <div class="my-scrapers-page">
        <div class="my-scrapers">
            My Scrapers
        </div>

        <div class="scrapers-list">
            <RouterLink v-for="scraper in scrapers" :key="scraper.id" class="scraper"
                :to="`/code-editor?scraper-id=${scraper.id}`">
                {{ scraper.name }}
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
