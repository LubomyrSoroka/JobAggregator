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
                    <div v-for="scraper in scraperNames" :key="scraper"
                        :class="['scraper-item', { 'scraper-toggle': currentScraper === scraper }]"
                        @click="openSearchParams(scraper)">
                        <input type="checkbox" v-model="enabled[scraper]" @click.stop="enableScraper(scraper)">
                        <span class="scraper-name">{{ scraper }}</span>
                    </div>
                    <div v-if="scraperNames.length === 0" class="empty-state">
                        No scrapers found. Create one first!
                    </div>
                </div>
                <div class="search-config-area">
                    <div class="search-config-scroll">
                        <div class="search-params">
                            <div class="form-group" v-for="parameter in parameters" :key="parameter.name">
                                <label>{{ parameter.name }}</label>
                                <input type="text" v-model="parameter.value">
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
                <button v-if="originalName !== ''"
                    :class="['save-button', { 'disabled-button': !Object.values(enabled).some((e: boolean) => e) }]"
                    @click="runSearch(false)">Run</button>
                <button v-if="originalName !== ''" class="save-button" @click="runSearch(true)">View Last
                    Search</button>
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
import { ScraperParameter, SavedSearch, ScraperConfig } from '../models'
import router from '@/router';
import AIFilters from '../components/AIFilters.vue'
import Filter, { filters as defaultFilters } from '../components/Filter.ts'

const showConfirmDelete = ref(false);
const savedSearches = ref<SavedSearch[]>([]);
const scraperNames = ref<string[]>([]);
const parameters = ref<ScraperParameter[]>([]);
const enabled = ref<Record<string, boolean>>({});
const searchName = ref('');
const currentScraper = ref('');
const tempConfigs = ref<ScraperConfig[]>([]);
const originalName = ref('');
const activeTab = ref('scrapers');
const searchFilters = ref<Filter[]>(defaultFilters);
const currentSearch = ref<SavedSearch | null>(null); // does this need to be a ref?

onMounted(() => {
    scraperNames.value = JSON.parse(localStorage.getItem('my_scraper_data') || '[]')
    savedSearches.value = JSON.parse(localStorage.getItem('my_saved_searches') || '[]')
    const state = window.history.state;

    if (state && state.searchName) {
        currentSearch.value = savedSearches.value.find(s => s.name === state.searchName) || null;
        currentSearch.value?.scraperParameters.forEach((scraperParameter: ScraperConfig) => {
            enabled.value[scraperParameter.scraperName] = scraperParameter.enabled;
        });
        openSearchMenu(state.searchName);
    }
})

const enableScraper = (scraperName: string) => {
    const config = tempConfigs.value.find(c => c.scraperName === scraperName)
    if (config) {
        config.enabled = true;
    }
    else {
        let mappedParams = [];
        const defaultParams = JSON.parse(localStorage.getItem(`${scraperName}`) || '{}').parameters || [];
        if (currentSearch.value && currentSearch.value.scraperParameters) {
            const savedConfig = currentSearch.value.scraperParameters.find(c => c.scraperName === scraperName);
            if (savedConfig) {
                mappedParams = defaultParams.map((dp: string) => {
                    const savedParam = savedConfig.parameters.find((sp: any) => sp.name === dp);
                    return new ScraperParameter(dp, savedParam ? savedParam.value : '');
                });
            }
        }
        else {
            mappedParams = defaultParams.map((p: string) => new ScraperParameter(p, ''));
        }
        tempConfigs.value.push(new ScraperConfig(scraperName, mappedParams, enabled.value[scraperName]));
    }
}

const openSearchMenu = (currentSearchName?: string) => {
    if (currentSearchName) {
        searchName.value = currentSearchName;
        originalName.value = currentSearchName;
    } else {
        searchName.value = '';
        originalName.value = '';
    }

    activeTab.value = 'scrapers';

    // Initialize filters from saved search if it exists
    //const search = savedSearches.value.find(s => s.name === currentSearchName);
    if (currentSearch.value && currentSearch.value.filters) {
        searchFilters.value = currentSearch.value.filters;
    }
    // is there any point to this else statement?
    else {
        searchFilters.value = defaultFilters;
    }

    const firstScraper = scraperNames.value[0];
    if (firstScraper) {
        openSearchParams(firstScraper);
    }
}

// const closeSearchWindow = () => {
//     tempConfigs.value = [];
// }

const commitCurrentScraperConfig = () => {
    if (currentScraper.value) { // this value is true if you have previously been alterting the arguments on a different scraper. (So it will only be false when you first open the menu)
        const config = tempConfigs.value.find(c => c.scraperName === currentScraper.value);
        const mappedParams = parameters.value.map(p => new ScraperParameter(p.name, p.value));
        if (config) {
            config.parameters = mappedParams;
            config.enabled = enabled.value[currentScraper.value] ?? false;
        } else {
            tempConfigs.value.push(new ScraperConfig(currentScraper.value, mappedParams, enabled.value[currentScraper.value]));
        }
    }
}

const openSearchParams = (scraperName: string) => {
    commitCurrentScraperConfig();
    currentScraper.value = scraperName;
    const config = tempConfigs.value.find(c => c.scraperName === scraperName);
    if (config) {
        parameters.value = config.parameters.map(p => new ScraperParameter(p.name, p.value));
        enabled.value[scraperName] = config.enabled;
        return;
    }
    // Check if this scraper is already in the search being edited
    //const existingSearch = savedSearches.value.find(s => s.name === searchName.value);
    const defaultParams = JSON.parse(localStorage.getItem(`${scraperName}`) || '{}').parameters || [];

    if (currentSearch.value && currentSearch.value.scraperParameters) {
        const savedConfig = currentSearch.value.scraperParameters.find(c => c.scraperName === scraperName);
        if (savedConfig) {
            parameters.value = defaultParams.map((dp: string) => {
                const savedParam = savedConfig.parameters.find((sp: any) => sp.name === dp);
                return new ScraperParameter(dp, savedParam ? savedParam.value : '');
            });
            enabled.value[scraperName] = savedConfig.enabled;
            return;
        }
    }

    // Fallback: load default parameters for this scraper
    parameters.value = defaultParams.map((p: string) => new ScraperParameter(p, ''))
    enabled.value[scraperName] = false;
}

const saveSearch = () => {
    if (!searchName.value) return;
    commitCurrentScraperConfig();
    let search = savedSearches.value.find(s => s.name === originalName.value);

    if (originalName.value && search) {
        search.name = searchName.value;
        search.scraperParameters = tempConfigs.value;
        search.filters = searchFilters.value;
    } else {
        // Create new search
        search = new SavedSearch(searchName.value, tempConfigs.value, searchFilters.value);
        savedSearches.value.push(search);
    }

    localStorage.setItem('my_saved_searches', JSON.stringify(savedSearches.value))
    //closeSearchWindow();
}

const deleteSearch = () => {
    if (!originalName.value) return;
    let search = savedSearches.value.find(s => s.name === originalName.value);
    if (search) {
        savedSearches.value = savedSearches.value.filter(s => s.name !== originalName.value);
        localStorage.setItem('my_saved_searches', JSON.stringify(savedSearches.value))
        router.push('/search');
    }
}

const runSearch = (viewSearch: boolean = false) => {
    saveSearch();
    router.push({
        name: 'ViewSearch',
        state: { searchName: searchName.value, viewSearch }
    });
}

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