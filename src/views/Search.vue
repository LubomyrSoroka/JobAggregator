<template>
    <div class="search-view-container">
        <div class="my-scrapers">
            Search
        </div>

        <div class="scrapers-list">
            <router-link class="scraper" v-for="search in savedSearches" :key="search.name"
                :to="{ name: 'EditSearch', state: { searchName: search.name } }">
                {{ search.name }}
            </router-link>
            <router-link class="add" :to="{ name: 'EditSearch', state: { searchName: undefined } }">
                +
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SavedSearch } from '../models'
import router from '@/router';
import { getStorageObject } from '../services/storageService'

const savedSearches = ref<SavedSearch[]>([]);
const scraperNames = ref<string[]>([]);

onMounted(async () => {
    scraperNames.value = await getStorageObject<string[]>('my_scraper_data', [])
    savedSearches.value = await getStorageObject<SavedSearch[]>('my_saved_searches', [])
})

</script>

<style scoped>
.search-view-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}
</style>