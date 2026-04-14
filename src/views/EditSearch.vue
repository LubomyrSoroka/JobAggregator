<template>
    <div class="run-menu">
        <div class="search-header">
            <div class="header-info">
                <span class="header-tag">{{ originalName === '' ? 'New Search' : 'Editing Search' }}</span>
                <input type="text" class="search-name-input" placeholder="Name your search..." v-model="searchName">
            </div>
            <p class="menu-subtitle">Configure scrapers and filters for this search</p>
            <div class="menu-tabs">
                <div :class="['menu-tab', { active: activeTab === 'scrapers' }]" @click="activeTab = 'scrapers'">
                    Scrapers
                </div>
                <div :class="['menu-tab', { active: activeTab === 'filters' }]" @click="activeTab = 'filters'">
                    Filters
                </div>
            </div>
        </div>
        <div class="add-new-search-content">
            <!-- Scrapers Tab Content -->
            <template v-if="activeTab === 'scrapers'">
                <div class="scraper-items">
                    <div v-for="scraper in scrapersArray" :key="scraper.id"
                        :class="['scraper-item', { 'scraper-toggle': currentScraper === scraper }]"
                        @click="openSearchParams(scraper.id)">
                        <input type="checkbox" v-model="enabled[scraper.id]" @click.stop="enableScraper(scraper.id)">
                        <span class="scraper-name">{{ scraper.name }}</span>
                    </div>
                    <div v-if="scrapersArray.length === 0" class="empty-state">
                        No scrapers found. Create one first!
                    </div>
                </div>
                <div class="search-config-area">
                    <div class="search-config-scroll">
                        <div class="search-params">
                            <div class="form-group" v-for="(value, name) in parameters" :key="name">
                                <label>{{ name }}</label>
                                <input type="text" v-model="parameters[name]">
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <!-- Filters Tab Content -->
            <template v-if="activeTab === 'filters'">
                <div class="search-config-area">
                    <div class="search-config-scroll">
                        <div class="search-params">
                            <AIFilters :filters="searchFilters" title="AI Enhancements" id-prefix="search" />
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <div class="search-actions-container">
            <div class="search-actions">
                <button :class="['save-button', { 'disabled-button': searchName === '' }]" @click="saveSearch">Save
                    Search</button>
                <button v-if="originalName !== ''" class="save-button" @click="showConfirmDelete = true">Delete
                    Search</button>

                <RouterLink v-if="originalName !== ''" custom v-slot="{ navigate }"
                    :to="`/view-search?search-id=${currentSearch?.id}`">
                    <button :disabled="!Object.values(enabled).some((e: boolean) => e)"
                        :class="['save-button', { 'disabled-button': !Object.values(enabled).some((e: boolean) => e) }]"
                        @click="navigate">Run</button>
                </RouterLink>

                <RouterLink v-if="originalName !== ''" custom v-slot="{ navigate }" class="save-button"
                    :to="`/view-search?search-id=${currentSearch?.id}&last-search=true`">
                    <button @click="navigate">View Last Search</button>
                </RouterLink>
            </div>
        </div>
    </div>
    <div class='dimmed-background' v-if='showConfirmDelete'>
        <div class='confirm-delete-content'>
            <h2>Confirm Delete</h2>
            <p>Are you sure you want to delete this search?</p>
            <div class='confirm-delete-buttons'>
                <button class='cancel-button' @click='showConfirmDelete = false'>Cancel</button>
                <button class='delete-button' @click='deleteSearch'>Delete</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SavedSearch, ScraperConfig } from '../models'
import type { ScraperParameter } from '../models'
import router from '@/router';
import AIFilters from '../components/AIFilters.vue'
import Filter, { filters as defaultFilters } from '../components/Filter.ts'
import { getStorageObject, createStorageObject, updateStorageObject, removeStorageObject, getAllStorageObjects } from '../services/storageService'
import { MY_SCRAPERS, MY_SEARCHES } from '../services/storeNames.ts'

const showConfirmDelete = ref(false);
const scrapersArray = ref<any[]>([]);
const scrapers = ref<Record<number, any>>({});
const parameters = ref<ScraperParameter>({});
const enabled = ref<Record<number, boolean>>({});
const searchName = ref('');
const currentScraper = ref<any>(null);
const tempConfigs = ref<Record<number, ScraperConfig>>({});
const originalName = ref('');
const activeTab = ref('scrapers');
const searchFilters = ref<Filter[]>(defaultFilters);
const currentSearch = ref<SavedSearch | null>(null);

onMounted(async () => {
    scrapersArray.value = await getAllStorageObjects(MY_SCRAPERS)
    scrapers.value = Object.fromEntries(scrapersArray.value.map((s: any) => [s.id, s]));
    const urlParams = new URLSearchParams(window.location.search);
    const searchId = Number(urlParams.get('search-id'));

    // can just make the tempconfig automatically include all scrapers. Then the rest of the code would be much cleaner...
    scrapersArray.value.forEach((scraper: any) => {
        tempConfigs.value[scraper.id] = new ScraperConfig(scraper.id, Object.fromEntries(scraper.parameters.map((p: string) => [p, ''])), false);
        enabled.value[scraper.id] = false;
    })

    if (searchId) {
        currentSearch.value = await getStorageObject(MY_SEARCHES, searchId)
        searchName.value = currentSearch.value?.name || '';
        originalName.value = currentSearch.value?.name || '';

        Object.values(currentSearch.value?.scraperConfigs || {}).forEach((scraperConfig: ScraperConfig) => {
            enabled.value[scraperConfig.scraperId] = scraperConfig.enabled;
            let mappedParameters: ScraperParameter = {};
            scrapers.value[scraperConfig.scraperId].parameters.forEach((p: string) => {
                mappedParameters[p] = scraperConfig.parameters[p] || '';
            });
            const tempConfig = tempConfigs.value[scraperConfig.scraperId];
            if (tempConfig) {
                tempConfig.parameters = mappedParameters;
                tempConfig.enabled = scraperConfig.enabled;
            }

        });
    }
    openSearchMenu();
})

const enableScraper = async (scraperId: number) => {
    const config = tempConfigs.value[scraperId]
    // if a config already exists, then just modify it
    if (config) {
        config.enabled = !config.enabled;
    }
    else {
        throw new Error('Scraper config not found');
    }
}

const openSearchMenu = () => {
    if (currentSearch.value) {
        searchName.value = currentSearch.value.name;
    } else {
        searchName.value = '';
    }

    // you could run this only when the user clicks on filters...
    // Initialize filters from saved search if it exists
    if (currentSearch.value && currentSearch.value.filters) {
        searchFilters.value = currentSearch.value.filters;
    }
    // is there any point to this else statement?
    else {
        searchFilters.value = defaultFilters;
    }

    const firstScraper = scrapersArray.value[0];
    if (firstScraper) {
        openSearchParams(firstScraper.id);
    }
}

const commitCurrentScraperConfig = () => {
    if (currentScraper.value) { // this value is true if you have previously been alterting the arguments on a different scraper. (So it will only be false when you first open the menu)
        const config = tempConfigs.value[currentScraper.value.id]

        const mappedParams: ScraperParameter = { ...parameters.value };
        if (config) {
            config.parameters = mappedParams;
            config.enabled = enabled.value[currentScraper.value.id] ?? false;
        }
        else {
            throw new Error('Scraper config not found');
        }
    }
}

const openSearchParams = async (scraperId: number) => {
    commitCurrentScraperConfig();
    currentScraper.value = scrapers.value[scraperId];
    const config = tempConfigs.value[scraperId]
    if (config) {
        parameters.value = { ...config.parameters };
        enabled.value[scraperId] = config.enabled;
        //return;
    }
    else {
        throw new Error('Scraper config not found');
    }
}

const saveSearch = async () => {
    if (!searchName.value) return;
    commitCurrentScraperConfig();
    if (!currentSearch.value || !currentSearch.value.id) {
        currentSearch.value = new SavedSearch(searchName.value, tempConfigs.value, searchFilters.value);
        // We pass id: undefined so IndexedDB generates a new auto-incremented ID
        const id = await createStorageObject(MY_SEARCHES, currentSearch.value);
        currentSearch.value.id = id;
    }
    else {
        currentSearch.value.name = searchName.value;
        currentSearch.value.scraperConfigs = tempConfigs.value;
        currentSearch.value.filters = searchFilters.value;
        updateStorageObject(MY_SEARCHES, currentSearch.value.id, currentSearch.value);
    }
}

const deleteSearch = async () => {
    if (!currentSearch.value || !currentSearch.value.id) return;
    await removeStorageObject(MY_SEARCHES, currentSearch.value.id);
    router.push('/search');
}

// const runSearch = async (viewSearch: boolean = false) => {
//     await saveSearch();
//     router.push({
//         name: 'ViewSearch',
//         state: { searchId: currentSearch.value?.id, searchName: searchName.value, viewSearch: viewSearch }
//     });
// }

</script>

<style scoped>
.run-menu {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 20px;
    background-color: white;
    min-height: 0;
    /* Prevents container from expanding beyond parent */
}

.add-new-search-content {
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex: 1;
    overflow: hidden;
    /* Prevent parent from growing indefinitely */
    min-height: 0;
}

.menu-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
}

.search-header {
    margin-bottom: 20px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 5px;
}

.menu-tabs {
    display: flex;
    gap: 20px;
    margin-top: 15px;
}

.menu-tab {
    padding: 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.menu-tab:hover {
    color: #3b82f6;
}

.menu-tab.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
}

.header-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header-tag {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #3b82f6;
    margin-bottom: 2px;
}

.search-name-input {
    font-size: 28px;
    font-weight: 700;
    border: none;
    padding: 2px 8px;
    /* Extra padding for the hover background */
    margin: 0 -8px;
    /* Pull it back to keep alignment */
    color: #1a1a1a;
    background: transparent;
    width: 100%;
    border-radius: 6px;
    transition: background 0.2s ease;
}

.search-name-input:hover {
    background: #f1f5f9;
}

.search-name-input:focus {
    outline: none;
    border-bottom: 2px solid #3b82f6;
    margin-bottom: -2px;
    /* Prevent layout shift */
}

.search-name-input::placeholder {
    color: #cbd5e1;
}

.menu-subtitle {
    margin: 0 0 10px 0;
    color: #666;
    font-size: 14px;
}

.scraper-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 250px;
    overflow-y: auto;
    padding-right: 5px;
    min-height: 0;
}

.scraper-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.scraper-icon {
    font-size: 20px;
}

.scraper-name {
    font-weight: 500;
    color: #1a1a1a;
}

.scraper-toggle {
    background-color: #3b82f6;
    border-color: #2563eb;
    color: white;
}

.scraper-toggle .scraper-name {
    color: white;
}

.empty-state {
    text-align: center;
    padding: 40px;
    color: #888;
    background: #f9f9f9;
    border-radius: 12px;
    border: 1px dashed #ccc;
}

.search-config-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 15px;
    min-height: 0;
    /* Ensures the item can shrink and use its scrollbar */
}

.search-config-scroll {
    flex: 1;
    overflow-y: auto;
    padding-right: 5px;
}

.search-params {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.search-params input[type="text"] {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 14px;
}

.enabled-toggle {
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    font-weight: 500;
    color: #444;
}


.search-actions-container {
    margin-top: auto;
    padding-top: 15px;
}

.search-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    /* Align button to the right, or remove for center/left */
    padding-top: 15px;
    border-top: 1px solid #eee;
}

.save-button {
    padding: 10px 24px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    width: auto;
    /* Ensure it doesn't take up full width */
}

.disabled-button {
    background-color: #94a3b8;
    cursor: not-allowed;
    transition: none !important;
}

.disabled-button:hover {
    background-color: #94a3b8 !important;
}

.save-button:hover {
    background-color: #2563eb;
}

.search-header {
    display: flex;
    flex-direction: column;
}
</style>