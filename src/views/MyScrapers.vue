<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getAllStorageObjects } from '../services/storageService'
import { MY_SCRAPERS } from '../services/storeNames'
import { supabase } from '../../utils/supabase.ts'
import AppLoader from '../components/AppLoader.vue'

const scrapers = ref<any[]>([])
const viewMyScrapers = ref(true)
const loading = ref(false);
onMounted(async () => {
    loading.value = true;
    try {
        scrapers.value = await getAllStorageObjects(MY_SCRAPERS)
    } finally {
        loading.value = false;
    }
})

watch(viewMyScrapers, async () => {
    if (viewMyScrapers.value) {
        scrapers.value = await getAllStorageObjects(MY_SCRAPERS)
    } else {
        loading.value = true;
        try {
            const { data: scrapeItems, error } = await supabase
                .from('Public Scrapers')
                .select('*')
            if (error) {
                console.error('Error fetching public scrapers:', error)
            }
            if (scrapeItems) {
                scrapers.value = scrapeItems
            }
        } finally {
            loading.value = false;
        }
    }
})
</script>

<template>
    <div class="my-scrapers-page">
        <div class="tabs">
            <div @click="viewMyScrapers = true" :class="viewMyScrapers ? 'selected' : 'not-selected'">
                My Scrapers
            </div>
            <div @click="viewMyScrapers = false" :class="!viewMyScrapers ? 'selected' : 'not-selected'">
                Public Scrapers
            </div>
        </div>

        <div v-if="loading" class="loader-wrapper">
            <AppLoader text="Loading scrapers..." />
        </div>
        <div v-else class="scrapers-list">
            <RouterLink v-for="scraper in scrapers" :key="scraper.id" class="scraper"
                :to="viewMyScrapers ? `/code-editor?scraper-id=${scraper.id}` : `/code-editor?public-scraper-id=${scraper.id}`">
                {{ scraper.name }}
            </RouterLink>
            <RouterLink v-if="viewMyScrapers" class="add" to="/code-editor">
                +
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.loader-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
}

.tabs {
    display: flex;
    gap: 16px;
    font-size: 32px;
    font-weight: 500;
    justify-content: center;
}

.selected,
.not-selected {
    border-radius: 5px;
    border: 1px solid #f0f9ff;
    border-color: #3b82f6;
    color: #3b82f6;
    padding: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.selected:hover, .not-selected:hover{
    background-color: #d1d1d1;
}

.selected {
    text-decoration: underline;
}

.not-selected {
    text-decoration: none;
}

.my-scrapers-page {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
</style>
