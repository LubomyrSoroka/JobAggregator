<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

// 1. Create a reactive variable to hold the scrapers
const scrapers = ref<any[]>([])
onMounted(() => {
    // 2. Read the string from localStorage
    const savedData = localStorage.getItem('my_scraper_data')
    //const savedData = fetch('http://localhost:3000/scrapers').then(response => response.json())


    if (savedData) {
        // 3. Convert that string back into a JavaScript array
        scrapers.value = JSON.parse(savedData)
    }
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
