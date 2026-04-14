<template>
    <div class="search-view-container">
        <div class="my-scrapers">
            Search
        </div>

        <div class="scrapers-list">
            <router-link class="scraper" v-for="search in savedSearches" :key="search.id"
                :to="{ name: 'EditSearch', query: { 'search-id': search.id } }">
                {{ search.name }}
            </router-link>
            <router-link class="add" :to="{ name: 'EditSearch', query: { 'search-id': undefined } }">
                +
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SavedSearch } from '../models'
import { getAllStorageObjects } from '../services/storageService'
import { MY_SEARCHES } from '../services/storeNames'

const savedSearches = ref<SavedSearch[]>([]);

onMounted(async () => {
    savedSearches.value = await getAllStorageObjects(MY_SEARCHES)
})

</script>

<style scoped>
.search-view-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
}
</style>