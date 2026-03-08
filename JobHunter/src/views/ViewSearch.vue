<template>
    <div class="view-search-container">
        <header class="view-header">
            <div class="back-button" @click="$router.push('/search')">
                <span class="icon">←</span> Back to Searches
            </div>
            <div class="tabs">
                <div @click="viewSearch = true" :class="viewSearch ? 'selected' : 'not-selected'">Search Results</div>
                <div @click="viewSearch = false" :class="!viewSearch ? 'selected' : 'not-selected'">Stats</div>
            </div>
        </header>
        <div v-if="viewSearch">

            <div class="results-count">{{ jobs.length }} Jobs Found</div>
            <div class="sort">
                <span class="sort-label">Sort by:</span>
                <select v-model="sortDirection" @change="sortJobs">
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                </select>
                <select v-model="sortPriority" @change="sortJobs">
                    <option v-for="p in priorityOptions" :value="p">{{ p }}</option>
                </select>
                <select v-model="sortOrder[sortPriority - 1]" @change="sortJobs">
                    <option v-for="option in sortOptions" :value="option">{{ option }}</option>
                </select>
            </div>
            <div v-if="aiFiltering" class="ai-progress-banner">
                <div class="mini-loader"></div>
                <span>AI is enhancing your results with missing data... Filtering Job: {{ amountFiltered }}/{{
                    jobs.length }}</span>
            </div>

            <div v-if="loading" class="loading-state">
                <div class="loader"></div>
                <p>Processing results...</p>
            </div>

            <div v-else-if="jobs.length === 0" class="empty-state">
                <div class="empty-icon">📭</div>
                <h2>No jobs found</h2>
                <p>Try adjusting your search parameters or enabling more scrapers.</p>
                <button class="primary-button" @click="$router.push('/search')">Go Back</button>
            </div>

            <!-- Job Details Sidebar Overlay -->
            <div v-if="selectedJob" class="job-overlay" @click="closeJobCard"></div>
            <div :class="['job-full', { 'active': selectedJob }]">
                <div v-if="selectedJob" class="job-full-content">
                    <button class="close-sidebar" @click="closeJobCard">✕</button>
                    <div class="job-full-header">
                        <div class="job-full-title">{{ selectedJob.positionTitle }}</div>
                        <div class="job-full-company">{{ selectedJob.company }}</div>
                    </div>
                    <div class="job-full-meta">
                        <div class="job-full-meta-item" v-if="selectedJob.location">
                            <span class="meta-label">Location:</span> {{ selectedJob.location }}
                        </div>
                        <div class="job-full-meta-item" v-if="selectedJob.salaryRange">
                            <span class="meta-label">Salary:</span> {{ selectedJob.salaryRange }} {{
                                selectedJob.salaryType
                            }}
                        </div>
                        <div class="job-full-meta-item" v-if="selectedJob.datePosted">
                            <span class="meta-label">Posted:</span> {{ selectedJob.datePosted }}
                        </div>
                        <div class="job-full-meta-item" v-if="selectedJob.yearsOfExperience">
                            <span class="meta-label">Experience:</span> {{ selectedJob.yearsOfExperience }}
                        </div>
                    </div>
                    <hr class="divider">
                    <div class="job-full-description" v-html="selectedJob.description"></div>
                    <div class="job-full-footer">
                        <a v-if="selectedJob.applyLink || selectedJob.url"
                            :href="selectedJob.applyLink || selectedJob.url" target="_blank"
                            class="primary-button apply-large">
                            Apply for this position
                        </a>
                        <a v-if="selectedJob.company" :href="getLinkedInSearchUrl(selectedJob.company)" target="_blank"
                            class="find-employees">
                            Find Employees Who Work Here
                        </a>
                    </div>
                </div>
            </div>

            <!-- Main Grid remains visible -->
            <div v-if="!loading && jobs.length > 0" class="job-grid">
                <div v-for="(job, index) in jobs" :key="index" class="job-card">
                    <div class="job-content" @click="openJobCard(job)">
                        <div v-if="job.image" class="job-image">
                            <img :src="job.image" :alt="job.company">
                        </div>
                        <div class="job-header" :class="{ 'with-image': job.image }">
                            <div class="job-title-row">
                                <h3 class="job-title">{{ job.positionTitle || 'Untitled Position' }}</h3>
                                <span v-if="job.scraperSource" class="scraper-badge">{{ job.scraperSource }}</span>
                            </div>
                            <div class="job-company">{{ job.company || 'Unknown Company' }}</div>
                        </div>

                        <div class="job-meta">
                            <div v-if="job.location" class="meta-item">
                                {{ job.location }}
                            </div>
                            <div v-if="job.salaryRange" class="meta-item">
                                {{ job.salaryRange }} {{ job.salaryType }}
                            </div>
                            <div v-if="job.salaryType !== 'yearly' && getYearlyEstimate(job)"
                                class="meta-item yearly-estimate">
                                {{ getYearlyEstimate(job) }} / year
                            </div>
                            <div v-if="job.datePosted" class="meta-item">
                                {{ job.datePosted }}
                            </div>
                            <div v-if="job.yearsOfExperience" class="meta-item">
                                {{ job.yearsOfExperience }}
                            </div>
                        </div>

                        <div v-if="job.description" class="job-description" v-html="job.description"></div>

                        <div class="job-footer">
                            <a v-if="job.applyLink || job.url" :href="job.applyLink || job.url" target="_blank"
                                class="apply-button">
                                Apply Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="!viewSearch" class="stats-view">
            <div class="stats-card">
                <h2 class="stats-title">Jobs by Years of Experience</h2>
                <div v-if="jobs.length > 0" class="chart-container">
                    <VueApexCharts width="100%" height="450" :options="chartData.options" :series="chartData.series">
                    </VueApexCharts>
                </div>
                <h2 class="">Hiring Platform</h2>
                <VueApexCharts width="100%" height="450" :options="hiringPlatformData.options"
                    :series="hiringPlatformData.series">
                </VueApexCharts>
                <div>

                </div>

                <!-- <div v-else class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p>Load some jobs to see experience distributions!</p>
                </div> -->
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { SavedSearch, ScraperConfig, ScraperParameter } from '../models'
import VueApexCharts from 'vue3-apexcharts'

const viewSearch = ref(true)
const route = useRoute()
const jobs = ref<any[]>([])
const loading = ref(true)
const aiFiltering = ref(false)
const selectedJob = ref<any>(null)
const sortOptions = ref([
    'experience',
    'salary',
    'date',
])

const sortOrder = ref(['experience', 'salary'])
const priorityOptions = ref([1, 2])
const sortPriority = ref(1)
const sortDirection = ref('asc')
const amountFiltered = ref(0)

const chartData = computed(() => {
    const counts: Record<number, number> = {}

    jobs.value.forEach(job => {
        const exp = job.yearsOfExperience
        // If it's a number, take the ceiling. If it's undefined/null, skip it.
        if (exp !== null && exp !== undefined) {
            const val = typeof exp === 'string' ? parseFloat(exp) : exp
            if (!isNaN(val)) {
                const ceiling = Math.ceil(val)
                if (ceiling >= 0) {
                    counts[ceiling] = (counts[ceiling] || 0) + 1
                }
            }
        }
    })

    const categories = Object.keys(counts).map(Number).sort((a, b) => a - b)
    const seriesData = categories.map(cat => counts[cat])

    return {
        series: [{
            name: 'Jobs',
            data: seriesData
        }],
        options: {
            chart: {
                type: 'bar' as const,
                toolbar: { show: false },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            plotOptions: {
                bar: {
                    borderRadius: 10,
                    columnWidth: '60%',
                    distributed: true,
                    dataLabels: { position: 'top' }
                }
            },
            dataLabels: {
                enabled: true,
                offsetY: -20,
                style: { fontSize: '12px', colors: ["#304758"] }
            },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            xaxis: {
                categories: categories.map(cat => `${cat} yr${cat === 1 ? '' : 's'}`),
                position: 'bottom',
                axisBorder: { show: false },
                axisTicks: { show: false },
                title: {
                    text: 'Hiring Platform',
                    style: { color: '#64748b', fontWeight: 600 }
                }
            },
            yaxis: {
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    show: true,
                    formatter: (val: number) => Math.floor(val).toString()
                },
                title: {
                    text: 'Number of Matching Jobs',
                    style: { color: '#64748b', fontWeight: 600 }
                }
            },
            grid: {
                borderColor: '#f1f5f9',
                strokeDashArray: 4
            },
            tooltip: { theme: 'light' },
            theme: { palette: 'palette1' }
        }
    }
})

const hiringPlatformData = computed(() => {
    const platforms = ['workday', 'indeed', 'jobbank.gc.ca', 'bamboohr', "other"]
    const counts: Record<string, number> = {}
    const platformLabels: Record<string, string> = {
        'workday': 'Workday',
        'indeed': 'Indeed',
        'jobbank.gc.ca': 'Job Bank',
        'bamboohr': 'BambooHR',
        'other': "Other"
    }

    jobs.value.forEach(job => {
        const link = (job.applyLink || job.url || '').toLowerCase()
        // Extract domain part safely (handles https:// and paths)
        const domain = link.split('//').pop()?.split('/')[0].replace(/^www\./, '') || ''
        let found = false;
        platforms.forEach(platform => {
            // Checks if platform is in the domain part specifically
            if (domain.includes(platform)) {
                counts[platform] = (counts[platform] || 0) + 1
                found = true;
            }
        })
        if (!found)
            counts["other"] = (counts["other"] || 0) + 1;

    })

    const categories = Object.keys(counts)
    const seriesData = categories.map(cat => counts[cat])
    const readableCategories = categories.map(cat => platformLabels[cat] || cat)

    return {
        series: [{
            name: 'Jobs',
            data: seriesData
        }],
        options: {
            chart: {
                type: 'bar' as const,
                toolbar: { show: false },
                animations: { enabled: true, easing: 'easeinout', speed: 800 }
            },
            plotOptions: {
                bar: {
                    borderRadius: 10,
                    columnWidth: '60%',
                    distributed: true,
                    dataLabels: { position: 'top' }
                }
            },
            dataLabels: {
                enabled: true,
                offsetY: -20,
                style: { fontSize: '12px', colors: ["#304758"] }
            },
            colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            xaxis: {
                categories: readableCategories,
                position: 'bottom',
                axisBorder: { show: false },
                axisTicks: { show: false },
                title: {
                    text: 'Hiring Platform',
                    style: { color: '#64748b', fontWeight: 600 }
                }
            },
            yaxis: {
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    show: true,
                    formatter: (val: number) => Math.floor(val).toString()
                },
                title: {
                    text: 'Number of Jobs',
                    style: { color: '#64748b', fontWeight: 600 }
                }
            },
            grid: {
                borderColor: '#f1f5f9',
                strokeDashArray: 4
            },
            tooltip: { theme: 'light' },
            theme: { palette: 'palette1' }
        }
    }
})

function parseNumeric(val: any): number[] | null {
    if (typeof val === 'number') return [val];
    if (!val || typeof val !== 'string') return null;
    const cleaned = val.replace(/[^0-9.-]/g, '');
    if (cleaned.includes('-')) {
        const parts = cleaned.split('-').map(p => parseFloat(p)).filter(p => !isNaN(p));
        if (parts.length === 0) return null;
        //return parts.reduce((a, b) => a + b, 0) / parts.length;
        return parts;
    }
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : [parsed];
}

function calculateYearlySalary(job: any): number[] | null {
    const baseVal = parseNumeric(job.salaryRange);
    if (baseVal === null) return null;

    const type = (job.salaryType || '').toLowerCase();
    // 40 hours per week * 52 weeks per year = 2080 hours per year
    if (type === 'hourly') return baseVal.map(value => value * 2080);
    if (type === 'week' || type === 'weekly') return baseVal.map(value => value * 52);
    if (type === 'month' || type === 'monthly') return baseVal.map(value => value * 12);
    return baseVal; // Assume yearly if unspecified or already yearly
}

const getYearlyEstimate = (job: any) => {
    const yearly = calculateYearlySalary(job);
    if (yearly === null || yearly[0] === undefined) return '';
    const type = (job.salaryType || '').toLowerCase();
    if (['yearly', 'annual', 'year'].includes(type)) return `≈ $${Math.round(yearly[0]).toLocaleString()} ${yearly[1] ? '- $' + Math.round(yearly[1]).toLocaleString() : ''}`;
    return `≈ $${Math.round(yearly[0]).toLocaleString()} ${yearly[1] ? '- $' + Math.round(yearly[1]).toLocaleString() : ''}`;
}

const sortJobs = () => {
    const getVal = (job: any, criterion: string | undefined) => {
        if (!criterion) return null;
        if (criterion === 'experience') return parseNumeric(job.yearsOfExperience)
        if (criterion === 'salary') return calculateYearlySalary(job)?.[0] // use the lower bound of the salary for sorting
        if (criterion === 'date') return job.datePosted
        return null
    }

    const compareBy = (a: any, b: any, criterion: string | undefined) => {
        if (!criterion) return 0;
        const valA = getVal(a, criterion)
        const valB = getVal(b, criterion)

        const isNilA = valA === undefined || valA === null;
        const isNilB = valB === undefined || valB === null;

        if (isNilA && isNilB) return 0;
        if (isNilA) return sortDirection.value === 'asc' ? 1 : -1;
        if (isNilB) return sortDirection.value === 'asc' ? -1 : 1;

        if (valA === valB) return 0;
        return sortDirection.value === 'asc' ? ((valA as number) - (valB as number)) : ((valB as number) - (valA as number));
    }

    jobs.value.sort((a, b) => {
        const primary = Array.isArray(sortOrder.value) ? sortOrder.value[0] : sortOrder.value;
        let result = compareBy(a, b, primary);

        if (result === 0 && Array.isArray(sortOrder.value) && sortOrder.value[1]) {
            result = compareBy(a, b, sortOrder.value[1]);
        }

        return result;
    })
}

const openJobCard = (job: any) => {
    selectedJob.value = job
}

const getLinkedInSearchUrl = (company: string) => {
    const query = `site:linkedin.com/in "${company}"`
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

const closeJobCard = () => {
    selectedJob.value = null
}

const executeSearch = async (searchName: string) => {
    loading.value = true
    const savedSearches: SavedSearch[] = JSON.parse(localStorage.getItem('my_saved_searches') || '[]')
    const currentSearch = savedSearches.find(s => s.name === searchName)

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
                            const scraperResults = Array.isArray(result) ? result : [result];
                            return scraperResults.map(job => ({
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
        let combinedResults = allResults.flat().filter(job => job);

        // Display initial results immediately
        jobs.value = combinedResults
        sortJobs()
        loading.value = false

        if (combinedResults.length > 0 && (currentSearch.filters?.getMissingYearsOfExperience || currentSearch.filters?.getMissingSalary)) {
            aiFiltering.value = true
            try {
                await filterJobsWithAI(combinedResults, currentSearch.filters);
                // Sort again after AI adds more data to ensure accuracy
                sortJobs()
            } finally {
                aiFiltering.value = false
            }
        }
    } else {
        loading.value = false
    }
}

const filterJobsWithAI = async (jobList: any[], filters: any) => {
    const openaiApiKey = localStorage.getItem('openai_api_key') || ''
    const endPoint = localStorage.getItem('end_point') || ''
    const model = localStorage.getItem('model') || ''
    amountFiltered.value = 0;
    if (!openaiApiKey || !endPoint) {
        console.warn("API key or Endpoint missing for AI filtering");
        return;
    }

    const aiPromises = jobList.map(async job => {
        try {
            let localizedPrompt = '';
            if (filters.getMissingYearsOfExperience && filters.getMissingSalary)
                localizedPrompt = ` Read the following job description and determine how many years of experience are required or preferred and the salary of the job.
                Return the answer in JSON format with three keys: "yearsOfExperience", "salary" and "salaryType".
                If the description gives a range of years of experience (e.g. 3-5 years), return the lower bound of the range (3 in this case).
                If there are multiple different requirements for years of experience, return the highest value. (E.g. 2-3 years in Python and 1 year in QA then return 2)
                You may output decimal values for years of experience. For example, if a job asks for 6 months of experience, then return 0.5.
                If no specific number is mentioned, return null.
                If the description gives a range of salary (e.g. 100000-120000), return the whole range as a string. If it gives a single number, return that number as a string.
                For the salary type, if the salary type is weekly, return "weekly" if the salary type is hourly, return "hourly" if the salary type is yearly, return "yearly".
                If no specific number is mentioned, return null.
                e.g.
                {
                    "yearsOfExperience": 3,
                    "salary": "100000-120000",
                    "salaryType": "yearly"
                }
                Job Description:
                ${job.description}`;
            else if (filters.getMissingYearsOfExperience)
                localizedPrompt = ` Read the following job description and determine how many years of experience are required or preferred.
                Return the answer in JSON format with a single key "yearsOfExperience" and a float value.
                If the description gives a range of years of experience (e.g. 3-5 years), return the lower bound of the range (3 in this case).
                If there are multiple different requirements for years of experience, return the highest value. (E.g. 2-3 years in Python and 1 year in QA then return 2)
                You may output decimal values for years of experience. For example, if a job asks for 6 months of experience, then return 0.5.
                If no specific number is mentioned, return null.
                e.g.
                {
                    "yearsOfExperience": 3
                }
                Job Description:
                ${job.description}`;
            else if (filters.getMissingSalary)
                localizedPrompt = ` Read the following job description and determine the salary of the job.
                Return the answer in JSON format with two keys: "salary" and "salaryType".
                If the description gives a range of salary (e.g. 100000-120000), return the whole range as a string.
                For the salary type, if the salary type is weekly, return "weekly" if the salary type is hourly, return "hourly" if the salary type is yearly, return "yearly" and if it is none of the above, return null.
                If no specific number is mentioned, return null.
                e.g.
                {
                    "salary": "100000-120000",
                    "salaryType": "yearly"
                }
                Job Description:
                ${job.description}`;

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
                    ]
                })
            });

            if (response.status === 200) {
                const data = await response.json();
                const content = data.choices[0].message.content.trim();
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                const parsedContent = JSON.parse(jsonMatch ? jsonMatch[0] : content);

                let keys = []
                if (filters.getMissingYearsOfExperience)
                    keys.push("yearsOfExperience");
                if (filters.getMissingSalary) {
                    keys.push("salary");
                    keys.push("salaryType")
                }
                keys.forEach(key => {
                    if (parsedContent && key in parsedContent) {
                        job[key] = parsedContent[key];
                    }
                });
            }
            return job;
        } catch (e) {
            console.error("AI Error:", e);
            return job;
        } finally {
            amountFiltered.value++;
        }
    });

    await Promise.all(aiPromises);
}

onMounted(async () => {
    try {
        const state = window.history.state
        if (state?.searchName) {
            await executeSearch(state.searchName)
        } else if (state?.results) {
            const parsedResults = JSON.parse(state.results)
            jobs.value = Array.isArray(parsedResults) ? parsedResults : []
            loading.value = false
        } else {
            loading.value = false
        }
    } catch (e) {
        console.error('Failed to parse search results:', e)
        loading.value = false
    }
})
</script>

<style scoped>
.tabs {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 30px;
    margin-top: 10px;
}

.tabs div {
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
}

.not-selected {
    font-size: 24px;
    font-weight: 600;
    color: #94a3b8;
}

.not-selected:hover {
    color: #64748b;
}

/* Job Sidebar Overlay */
.job-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    z-index: 1000;
}

.job-full {
    position: fixed;
    top: 0;
    right: -70%;
    /* Start hidden off-screen */
    width: 70%;
    height: 100vh;
    background: white;
    z-index: 1001;
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.1);
    transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
}

.job-full.active {
    right: 0;
}

.job-full-content {
    padding: 60px 40px;
    height: 100%;
    overflow-y: auto;
    position: relative;
}

.close-sidebar {
    position: absolute;
    top: 20px;
    left: 20px;
    background: #f1f5f9;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: #475569;
}

.close-sidebar:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.job-full-header {
    margin-bottom: 30px;
}

.job-full-title {
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 12px;
}

.job-full-company {
    font-size: 20px;
    color: #3b82f6;
    font-weight: 600;
}

.job-full-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 30px;
}

.job-full-meta-item {
    font-size: 15px;
    color: #475569;
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
}

.meta-label {
    font-weight: 700;
    color: #64748b;
    margin-right: 4px;
    font-size: 13px;
    text-transform: uppercase;
}

.divider {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 30px 0;
}

.job-full-description {
    font-size: 16px;
    line-height: 1.8;
    color: #334155;
    word-break: break-word;
}

.job-full-description :deep(*) {
    position: static !important;
    height: auto !important;
    width: auto !important;
    max-width: 100% !important;
}


.job-full-footer {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid #e2e8f0;
}

.apply-large {
    width: 100%;
    padding: 18px !important;
    font-size: 18px !important;
    text-align: center;
    background: #3b82f6;
}

.view-search-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}

.view-header {
    margin-bottom: 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
    font-size: 14px;
}

.back-button:hover {
    color: #3b82f6;
}

.selected {
    font-size: 32px;
    font-weight: 800;
    margin: 0;
    color: #1e293b;
    position: relative;
}

.selected::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 40px;
    height: 4px;
    background: #3b82f6;
    border-radius: 2px;
}

.results-count {
    font-size: 16px;
    color: #64748b;
    font-weight: 500;
}

.job-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
}

.job-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    position: relative;
}

.job-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
    border-color: #3b82f6;
}

.job-image {
    position: absolute;
    top: 24px;
    left: 24px;
    width: 60px;
    height: 60px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 6px;
    z-index: 2;
}

.job-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.job-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex: 1;
}

.job-header {
    margin-bottom: 16px;
}

.job-header.with-image {
    padding-left: 75px;
    /* Space for the logo */
}

.job-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 4px;
}

.job-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    line-height: 1.4;
    flex: 1;
}

.scraper-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    background: #f1f5f9;
    color: #64748b;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
}

.job-company {
    font-size: 16px;
    color: #3b82f6;
    font-weight: 600;
}

.job-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;
}

.meta-item {
    font-size: 13px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.job-description {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
    margin-bottom: 16px;
    /* Line Clamping */
    display: -webkit-box;
    -webkit-line-clamp: 4;
    line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    pointer-events: none;
}

.job-description :deep(*) {
    display: inline !important;
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    width: auto !important;
    font-size: inherit !important;
    line-height: inherit !important;
    font-weight: inherit !important;
}

.job-footer {
    display: flex;
    justify-content: flex-end;
    margin-top: auto;
}

.apply-button {
    background: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.2s;
}

.apply-button:hover {
    background: #2563eb;
}

.loading-state,
.empty-state {
    text-align: center;
    padding: 80px 20px;
}

.empty-icon {
    font-size: 64px;
    margin-bottom: 24px;
}

.loader {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.primary-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 20px;
}

.ai-progress-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 12px 20px;
    border-radius: 12px;
    margin-top: 10px;
    color: #0369a1;
    font-size: 14px;
    font-weight: 500;
    animation: fadeIn 0.3s ease-out;
}

.mini-loader {
    width: 16px;
    height: 16px;
    border: 2px solid #bae6fd;
    border-top: 2px solid #0369a1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.stats-view {
    padding: 20px 0;
    animation: fadeIn 0.4s ease-out;
}

.stats-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.stats-title {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 30px;
}

.chart-container {
    background: #ffffff;
    border-radius: 12px;
}
</style>