<template>

    <div class="my-scrapers">
        Search
    </div>

    <div class="scrapers-list">
        <div class="scraper" v-for="search in savedSearches" :key="search.name" @click="openSearchMenu(search.name)">
            {{ search.name }}
        </div>
        <div class="add" @click="openSearchMenu(undefined)">
            +
        </div>
    </div>

    <div v-if="showSearchWindow" class="run-menu">
        <div class="close" @click="closeSearchWindow">X</div>
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
                        <span class="scraper-name">{{ scraper }}</span>
                    </div>
                    <div v-if="scraperNames.length === 0" class="empty-state">
                        No scrapers found. Create one first!
                    </div>
                </div>
                <div class="search-config-area">
                    <div class="search-config-scroll">
                        <div class="search-params">
                            <div class="enabled-toggle">
                                <span>Enabled</span>
                                <input type="checkbox" v-model="enabled">
                            </div>

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
                            <div class="form-group">
                                <label>Prompt</label>
                                <textarea v-model="searchFilters.prompt"
                                    placeholder="e.g. Find the years of experience required of this job: ${{description}}"></textarea>
                                <small>The AI will filter your results based on this description.</small>
                            </div>
                            <div class="form-group">
                                <label>Response Schema</label>
                                <textarea v-model="searchFilters.responseSchema"
                                    placeholder='e.g. {"years_of_experience": "number"}'></textarea>
                                <small>Define the structure of the AI's response.</small>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <div class="search-actions-container">
            <div class="search-actions">
                <button class="save-button" @click="saveSearch">Save Search</button>
                <button v-if="originalName !== ''" class="save-button" @click="deleteSearch">Delete
                    Search</button>
                <button v-if="originalName !== ''" class="save-button" @click="runSearch">Run</button>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ScraperParameter, SavedSearch, ScraperConfig } from '../models'
import router from '@/router';

const savedSearches = ref<SavedSearch[]>([]);
const showSearchWindow = ref(false);
const scraperNames = ref<string[]>([]);
const parameters = ref<ScraperParameter[]>([]);
const enabled = ref(false);
const searchName = ref('');
const currentScraper = ref('');
const tempConfigs = ref<ScraperConfig[]>([]);
const originalName = ref('');
const activeTab = ref('scrapers');
const searchFilters = ref({
    prompt: '',
    responseSchema: ''
});


onMounted(() => {
    scraperNames.value = JSON.parse(localStorage.getItem('my_scraper_data') || '[]')
    savedSearches.value = JSON.parse(localStorage.getItem('my_saved_searches') || '[]')
})

const openSearchMenu = (currentSearchName?: string) => {
    showSearchWindow.value = true;
    if (currentSearchName) {
        searchName.value = currentSearchName;
        originalName.value = currentSearchName;
    } else {
        searchName.value = '';
        originalName.value = '';
    }

    activeTab.value = 'scrapers';

    // Initialize filters from saved search if it exists
    const search = savedSearches.value.find(s => s.name === currentSearchName);
    if (search && search.filters) {
        searchFilters.value = {
            prompt: search.filters.prompt || '',
            responseSchema: search.filters.responseSchema || ''
        };
    } else {
        searchFilters.value = {
            prompt: '',
            responseSchema: ''
        };
    }

    const firstScraper = scraperNames.value[0];
    if (firstScraper) {
        openSearchParams(firstScraper);
    }
}
const closeSearchWindow = () => {
    showSearchWindow.value = false;
    tempConfigs.value = [];
}
const commitCurrentScraperConfig = () => {
    if (currentScraper.value) { // this value is true if you have previously been alterting the arguments on a different scraper. (So it will only be false when you first open the menu)
        const config = tempConfigs.value.find(c => c.scraperName === currentScraper.value);
        const mappedParams = parameters.value.map(p => new ScraperParameter(p.name, p.value));
        if (config) {
            config.parameters = mappedParams;
            config.enabled = enabled.value;
        } else {
            tempConfigs.value.push(new ScraperConfig(currentScraper.value, mappedParams, enabled.value));
        }
    }
}
const openSearchParams = (scraperName: string) => {
    commitCurrentScraperConfig();

    currentScraper.value = scraperName;

    const config = tempConfigs.value.find(c => c.scraperName === scraperName);
    if (config) {
        parameters.value = config.parameters.map(p => new ScraperParameter(p.name, p.value));
        enabled.value = config.enabled;
        return;
    }

    // Check if this scraper is already in the search being edited
    const existingSearch = savedSearches.value.find(s => s.name === searchName.value);
    const defaultParams = JSON.parse(localStorage.getItem(`${scraperName}_parameters`) || '[]')

    if (existingSearch && existingSearch.scraperParameters) {
        const savedConfig = existingSearch.scraperParameters.find(c => c.scraperName === scraperName);
        if (savedConfig) {
            parameters.value = defaultParams.map((dp: any) => {
                const savedParam = savedConfig.parameters.find(sp => sp.name === dp.name);
                return new ScraperParameter(dp.name, savedParam ? savedParam.value : '');
            });
            enabled.value = savedConfig.enabled;
            return;
        }
    }

    // Fallback: load default parameters for this scraper
    parameters.value = defaultParams.map((p: any) => new ScraperParameter(p.name, ''))
    enabled.value = false;
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
    closeSearchWindow();
}
const deleteSearch = () => {
    if (!originalName.value) return;
    let search = savedSearches.value.find(s => s.name === originalName.value);
    if (search) {
        savedSearches.value = savedSearches.value.filter(s => s.name !== originalName.value);
        localStorage.setItem('my_saved_searches', JSON.stringify(savedSearches.value))
        closeSearchWindow();
    }
}
const runSearch = async () => {
    saveSearch();
    const currentSearch = savedSearches.value.find(s => s.name === searchName.value);
    let results: any[] = [];

    if (currentSearch) {
        const scraperPromises = currentSearch.scraperParameters
            .filter(config => config.enabled)
            .map(async (scraperConfig) => {
                const scraperData = JSON.parse(localStorage.getItem(scraperConfig.scraperName) || '{}');
                const code = scraperData.code;
                const parameters = scraperConfig.parameters.map(p => p.value);

                if (code) {
                    try {
                        const scraperFunction = new Function(`
                            ${code}
                            return typeof scrape !== 'undefined' ? scrape : null;
                        `)();

                        if (typeof scraperFunction === 'function') {
                            const result = await scraperFunction(...parameters);
                            const jobs = Array.isArray(result) ? result : [result];
                            // Inject the scraper name into each job object
                            return jobs.map(job => ({
                                ...job,
                                scraperSource: scraperConfig.scraperName
                            }));
                        }
                    } catch (e) {
                        console.error(`Error running scraper ${scraperConfig.scraperName}:`, e);
                        return [];
                    }
                }
                return [];
            });

        const allResults = await Promise.all(scraperPromises);
        results = allResults.flat().filter(job => job);

        if (results.length > 0 && searchFilters.value.prompt) {
            await filterJobsWithAI(results, searchFilters.value.prompt);
        }
    }

    router.push({
        name: 'ViewSearch',
        state: { results: JSON.stringify(results) }
    });
}

const filterJobsWithAI = async (jobs: any[], userPrompt: string) => {
    const openaiApiKey = localStorage.getItem('openai_api_key') || ''
    const endPoint = localStorage.getItem('end_point') || ''
    const model = localStorage.getItem('model') || ''

    if (!openaiApiKey || !endPoint) {
        console.warn("API key or Endpoint missing for AI filtering");
        return jobs;
    }

    // Parse schema once
    let schema: Record<string, string> = {};
    try {
        schema = JSON.parse(searchFilters.value.responseSchema);
    } catch (e) {
        console.error("Failed to parse response schema:", e);
    }

    const aiPromises = jobs.map(async job => {
        try {
            // Replace variables in prompt
            // Replace any ${job.key} variables found in the prompt with data from the job object
            let localizedPrompt = userPrompt.replace(/\${job\.([^}]+)}/g, (match, key) => {
                return job[key] !== undefined ? job[key] : match;
            });

            // Ensure the AI knows to return JSON if a schema exists
            if (Object.keys(schema).length > 0) {
                localizedPrompt += `\n\nImportant: Your response must be a JSON object matching this schema: ${JSON.stringify(schema)}. Do not include any other text in your response.`;
            }

            const response = await fetch(endPoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: localizedPrompt
                        }
                    ],
                    // We only use json_object if the prompt mentions JSON (which we just added)
                    // response_format: Object.keys(schema).length > 0 ? { type: "json_object" } : undefined
                })
            });

            const data = await response.json();
            if (response.status !== 200) {
                console.error("AI Processing Error for job:\n" + job.positionTitle + "\nStatus:\n" + response.status + "\nError:\n" + JSON.stringify(data));
                return job;
            }
            const content = data.choices[0].message.content.trim();

            // Attempt to find JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : content);

            // Type-aware mapping based on the schema
            for (const [key, expectedType] of Object.entries(schema)) {
                const actualValue = parsedContent[key];

                // Allow some basic type conversion (e.g. AI returns "5" but we want 5)
                if (actualValue !== undefined) {
                    if (expectedType === 'number' && typeof actualValue === 'string') {
                        const num = Number(actualValue);
                        if (!isNaN(num)) job[key] = num;
                    } else if (typeof actualValue === expectedType) {
                        job[key] = actualValue;
                    }
                }
            }
            return job;

        } catch (e) {
            console.error("AI Processing Error for job:\n" + job.positionTitle + "\nError:\n" + JSON.stringify(e));
            return job;
        }
    });

    await Promise.all(aiPromises);
}
</script>

<style scoped>
.run-menu {
    overflow: hidden !important;
    /* Allow internal containers to handle scrolling and button stickiness */
    display: flex;
    flex-direction: column;
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

.save-button:hover {
    background-color: #2563eb;
}

.search-header {
    display: flex;
    flex-direction: column;
}
</style>