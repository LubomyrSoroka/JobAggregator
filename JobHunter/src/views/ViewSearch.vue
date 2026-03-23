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
            <div class="control-panel">
                <div class="panel-main">
                    <div class="results-info">
                        <span class="results-label">Search Results</span>
                        <div class="results-badge">{{ displayedJobs.length }} {{ 'Job ' + (displayedJobs.length === 1 ?
                            'Card' : 'Cards') }} Displayed</div>
                        <div class="new-jobs-badge">{{ jobs.length }} {{ jobs.length === 1 ? 'Job' :
                            'Jobs'
                            }} in total</div>
                        <div v-if="newJobCount !== null" class="new-jobs-badge">{{ newJobCount }} New {{
                            newJobCount === 1 ? 'Job' : 'Jobs'
                            }} Since Last
                            Search</div>
                        <div v-if="repostCount !== null" class="new-jobs-badge">{{ repostCount }} Reposted {{
                            repostCount === 1 ? 'Job' : 'Jobs'
                            }} </div>
                        <div v-if="irrelevantCount !== null" class="new-jobs-badge">{{ irrelevantCount }} Irrelevant
                            {{
                                irrelevantCount === 1 ? 'Job' : 'Jobs'
                            }} Found
                        </div>
                    </div>

                    <div class="panel-actions">
                        <div class="control-group sort-group">
                            <span class="control-label">Sort By</span>
                            <div class="select-wrapper">
                                <select v-model="sortDirection" @change="sortJobs" class="styled-select direction">
                                    <option value="asc">↑ Asc</option>
                                    <option value="desc">↓ Desc</option>
                                </select>
                                <select v-model="sortPriority" @change="sortJobs" class="styled-select priority">
                                    <option v-for="p in priorityOptions" :value="p">P{{ p }}</option>
                                </select>
                                <select v-model="sortOrder[sortPriority - 1]" @change="sortJobs"
                                    class="styled-select target">
                                    <option v-for="option in sortOptions" :value="option">{{ option }}</option>
                                </select>
                            </div>
                        </div>

                        <div class="control-group filter-group">
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="savedOnly">
                                <span class="slider"></span>
                                <span class="toggle-label">
                                    Saved Only
                                </span>
                            </label>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="latestSearchOnly">
                                <span class="slider"></span>
                                <span class="toggle-label">
                                    Latest Search Only
                                </span>
                            </label>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="noReposts">
                                <span class="slider"></span>
                                <span class="toggle-label">
                                    No Reposts
                                </span>
                            </label>
                            <label class="toggle-switch">
                                <input type="checkbox" v-model="relevantOnly">
                                <span class="slider"></span>
                                <span class="toggle-label">
                                    Relevant Only
                                </span>
                            </label>
                        </div>

                        <div class="control-group ai-trigger-group">
                            <button @click="showAiModal = true" class="ai-trigger-button">
                                AI Enhancer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- AI Modal -->
            <div v-if="showAiModal" class="ai-modal">
                <div class="close" @click="showAiModal = false">✕</div>
                <div class="search-header">
                    <div class="header-info">
                        <span class="header-tag">AI Enhancements</span>
                        <h2 class="modal-title">Tune Search with AI</h2>
                    </div>
                </div>

                <div class="ai-modal-content">
                    <AIFilters :filters="aiFilters" id-prefix="view-modal" />

                    <button class="primary-button ai-run-button large" @click="() => { runAI(); showAiModal = false; }"
                        :disabled="aiFiltering || aiFilters.every((filter: Filter) => !filter.value)">
                        <span v-if="aiFiltering" class="inline-loader"></span>
                        {{ aiFiltering ? 'Processing...' : 'Run AI Analysis' }}
                    </button>
                </div>
            </div>


            <div v-if="aiFiltering" class="ai-progress-banner">
                <div class="mini-loader"></div>
                <span>AI is enhancing your results with missing data... Filtering Job: {{ amountFiltered }}/{{
                    displayedJobs.length }}</span>
            </div>

            <div v-if="aiError" class="ai-error-banner">
                <span class="error-icon">⚠️</span>
                <span class="error-message">{{ aiError }}</span>
                <button class="close-error" @click="aiError = null">✕</button>
            </div>

            <div v-if="loading && jobs.length === 0" class="loading-state">
                <div class="loader"></div>
                <p>Processing results...</p>
            </div>
            <div v-else-if="loading && jobs.length > 0" class="ai-progress-banner">
                <div class="mini-loader"></div>
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
                        <a v-if="selectedJob.website" :href="selectedJob.website" target="_blank"
                            class="job-full-company">{{ selectedJob.company }}</a>
                        <div v-else class="job-full-company">{{ selectedJob.company }}</div>
                    </div>
                    <div class="job-full-meta">
                        <div v-for="(meta, mIndex) in getJobMeta(selectedJob)" :key="mIndex"
                            :class="['job-full-meta-item', { 'found-through-ai': meta.isAi }]">
                            <span class="meta-label">{{ meta.label }}:</span> {{ meta.value }}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <label class="keywords-label">Keywords:</label>
                        <div class="keywords-container">
                            <div v-for="(keyword, index) in selectedJob.keywords" :key="index" class="keyword-item">
                                {{ keyword }}
                            </div>
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
                            class="primary-button">
                            Find Employees
                        </a>
                        <a v-if="selectedJobLink" class="primary-button" :href="selectedJobLink" target="_blank">
                            View Job on Original Site
                        </a>

                    </div>
                </div>
            </div>

            <!-- Main Grid remains visible -->
            <div v-if="displayedJobs.length > 0" class="job-grid">
                <div v-for="(jobCard, jobCardIndex) in displayedJobs" :key="jobCard[0]?.url || jobCardIndex"
                    :class="['job-card', { 'job-ai-processed': jobCard[0]?.aiProcessed }]">

                    <div v-for="(job, index) in jobCard" :key="job.url || index" class="job-content"
                        @click="openJobCard(job)" v-show="index === (jobCard.currentIndex || 0)">
                        <div v-if="job.image" class="job-image">
                            <img :src="job.image" :alt="job.company">
                        </div>
                        <div class="job-header" :class="{ 'with-image': job.image }">
                            <div class="job-title-row">
                                <h3 class="job-title" :title="job.positionTitle">{{ job.positionTitle || `Untitled
                                    Position` }}</h3>
                                <div class="badges-row">
                                    <span v-if="jobCard.length > 1" class="version-badge">
                                        {{ Number(index) + 1 }} / {{ jobCard.length }}
                                    </span>
                                    <span v-if="job.scraperSource" class="scraper-badge">{{ job.scraperSource
                                    }}</span>
                                </div>
                            </div>
                            <a v-if="job.website" :href="job.website" :title="job.company" target="_blank"
                                class="job-full-company" @click.stop>{{
                                    job.company }}</a>
                            <div v-else :title="job.company" class="job-full-company">{{ job.company }}</div>
                        </div>

                        <div class="job-meta">
                            <div v-for="(meta, mIndex) in getJobMeta(job)" :key="mIndex"
                                :class="['meta-item', { 'found-through-ai': meta.isAi }]">
                                {{ meta.value }}
                            </div>
                        </div>

                        <div v-if="job.requirementsSummary" class="job-description">
                            {{ job.requirementsSummary }}
                        </div>
                        <div v-else-if="job.description" class="job-description" v-html="job.description"></div>

                        <div class="job-footer">
                            <button v-if="!job.saved" class="save-button" @click.stop="saveJob(job)">
                                Save
                            </button>
                            <button v-if="job.saved" class="unsave-button" @click.stop="unsaveJob(job)">
                                Unsave
                            </button>
                            <a v-if="job.applyLink || job.url" :href="job.applyLink || job.url" target="_blank"
                                class="apply-button" @click.stop>
                                Apply Now
                            </a>
                        </div>
                        <div v-if="jobCard.length > 1" class="navigation-controls">
                            <div v-if="(jobCard.currentIndex || 0) < jobCard.length - 1" class="arrow-right"
                                @click.stop="jobCard.currentIndex = (jobCard.currentIndex || 0) + 1">
                                <ChevronRight :size="20" />
                            </div>
                            <div v-if="(jobCard.currentIndex || 0) > 0" class="arrow-left"
                                @click.stop="jobCard.currentIndex = (jobCard.currentIndex || 0) - 1">
                                <ChevronLeft :size="20" />
                            </div>
                        </div>
                    </div>
                </div>
                <Transition name="scroll-fade">
                    <div v-if="showScrollUpButton" class="scroll-up-button" @click="scrollToTop">
                        <ChevronUp :size="20" />
                    </div>
                </Transition>
            </div>
        </div>
        <JobStats v-if="!viewSearch" :jobs="jobs" />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { SavedSearch, ScraperConfig, ScraperParameter } from '../models'
import AIFilters from '../components/AIFilters.vue'
import JobStats from '../components/JobStats.vue'
import { ChevronRight, ChevronLeft, ChevronUp } from 'lucide-vue-next'
import Filter, { filters as defaultFilters } from '@/components/Filter'
import { parseNumeric, calculateYearlySalary } from '@/components/salary'

const repostCount = ref(0);
const viewSearch = ref(true)
const scraperCache = new Map<string, any>()

const route = useRoute()
const jobs = ref<any[]>([])
const loading = ref(true)
const aiFiltering = ref(false)
const selectedJob = ref<any>(null)
const selectedJobLink = computed(() => getJobLink(selectedJob.value))

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
const aiError = ref<string | null>(null)
const savedOnly = ref(false)
const noReposts = ref(true)
const relevantOnly = ref(true);
const latestSearchOnly = ref(true)
const showAiModal = ref(false)
const newJobCount = ref<number | null>(null)
const aiFilters = ref<Filter[]>(defaultFilters)
const showScrollUpButton = ref(false)

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
}
const irrelevantCount = computed(() => {
    return jobs.value.filter(job => !(job.isRelevantJob ?? true)).length
})

const saveJob = (job: any) => {
    job.saved = true
}

const unsaveJob = (job: any) => {
    job.saved = false
}

const runAI = async () => {
    if (jobs.value.length === 0) return
    aiFiltering.value = true
    try {
        await filterJobsWithAI(jobs.value, aiFilters.value)
        sortJobs()
        const state = window.history.state
        if (state && state.searchName) {
            localStorage.setItem(`jobs_${state.searchName}`, JSON.stringify(jobs.value))
        }
    } finally {
        aiFiltering.value = false
    }
}

const displayedJobs = computed(() => {
    let filteredJobs = jobs.value;
    if (savedOnly.value) {
        filteredJobs = filteredJobs.filter(job => job.saved)
    }
    if (latestSearchOnly.value) {
        filteredJobs = filteredJobs.filter(job => job.fromLatestSearch)
    }
    if (noReposts.value) {
        filteredJobs = filteredJobs.filter(job => job.reposted == null)
    }
    if (relevantOnly.value) {
        filteredJobs = filteredJobs.filter(job => job.isRelevantJob ?? true)
    }
    return getDuplicates(filteredJobs)
})



const formatMoney = (val: number) => {
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// assume job type is yearly
const cleanSalary = (job: any) => {
    if (job.salaryRange === 'not specified') return 'not specified';
    const parts = parseNumeric(job.salaryRange);
    if (parts === null || parts[0] === undefined) return '';
    const type = (job.salaryType || '').toLowerCase();
    const useDecimals = type === 'hourly';

    const format = (val: number) => {
        return useDecimals ? formatMoney(val) : Math.round(val).toLocaleString();
    }
    return `$${format(parts[0])} ${parts[1] ? '- $' + format(parts[1]) : ''}`;
}

const getYearlyEstimate = (job: any) => {
    const yearly = calculateYearlySalary(job);
    if (yearly === null || yearly[0] === undefined) return '';
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

    jobs.value.sort((a: any, b: any) => {
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

const getJobMeta = (job: any) => {
    const meta = [];

    if (job.location) {
        meta.push({
            label: 'Location',
            value: job.location,
            isAi: job.foundThroughAI?.includes('location')
        });
    }

    if (job.salaryRange) {
        meta.push({
            label: 'Salary',
            value: `${cleanSalary(job)} ${job.salaryType || ''}`.trim(),
            isAi: job.foundThroughAI?.includes('salaryRange')
        });
    }

    const yearly = getYearlyEstimate(job);
    if (job.salaryType && job.salaryType !== 'yearly' && yearly) {
        meta.push({
            label: 'Estimate',
            value: `${yearly} yearly`,
            isAi: job.foundThroughAI?.includes('salaryRange')
        });
    }

    if (job.datePosted) {
        meta.push({
            label: 'Posted',
            value: Array.isArray(job.datePosted) ? job.datePosted[0] : job.datePosted,
            isAi: job.foundThroughAI?.includes('datePosted')
        });
    }

    if (job.yearsOfExperience === 'not specified' || job.yearsOfExperience === 0 || job.yearsOfExperience) {
        const val = typeof job.yearsOfExperience === 'number' ? `${job.yearsOfExperience}y exp` : job.yearsOfExperience;
        meta.push({
            label: 'Experience',
            value: val,
            isAi: job.foundThroughAI?.includes('yearsOfExperience')
        });
    }

    if (job.reposted) {
        meta.push({
            label: 'Reposts',
            value: `${job.reposted}x reposted`,
            isAi: false
        });
    }
    if (job.requiresSchoolEnrollment != null) {
        meta.push({
            label: 'Requires School Enrollment',
            value: job.requiresSchoolEnrollment,
            isAi: job.foundThroughAI?.includes('requiresSchoolEnrollment')
        });
    }
    if (job.prefersLocalCandidates != null) {
        meta.push({
            label: 'Prefers Local Candidates',
            value: job.prefersLocalCandidates,
            isAi: job.foundThroughAI?.includes('prefersLocalCandidates')
        });
    }

    return meta;
}

const executeSearch = async (searchName: string, viewSearch: boolean) => {
    loading.value = true
    const savedSearches: SavedSearch[] = JSON.parse(localStorage.getItem('my_saved_searches') || '[]')
    const currentSearch = savedSearches.find(s => s.name === searchName)
    const oldJobs = localStorage.getItem(`jobs_${searchName}`) || '[]';

    if (viewSearch || !currentSearch) {
        jobs.value = JSON.parse(oldJobs);
        loading.value = false;
    }
    else {
        jobs.value = JSON.parse(oldJobs).map((job: any) => { job.fromLatestSearch = false; return job; });
        currentSearch.scraperParameters
            .filter(config => config.enabled)
            .forEach(async (scraperConfig) => {
                if (!scraperCache.has(scraperConfig.scraperName)) {
                    scraperCache.set(scraperConfig.scraperName, JSON.parse(localStorage.getItem(scraperConfig.scraperName) || '{}'))
                }
                const scraperData = scraperCache.get(scraperConfig.scraperName);
                const code = scraperData.code;
                const parameters = scraperConfig.parameters.map(p => p.value);

                if (code) {
                    try {
                        const scraperFunction = new Function(`
                            ${code}
                            return typeof scrape !== 'undefined' ? scrape : null;
                        `)();

                        if (typeof scraperFunction === 'function') {
                            const oldJobsMap = new Map<string, any>();

                            jobs.value.forEach((job: any) => {
                                let key = JSON.stringify(job);
                                if (job.id && job.scraperSource) {
                                    key = JSON.stringify({ id: job.id, scraperSource: job.scraperSource });
                                } else {
                                    key = JSON.stringify({ title: job.title, company: job.company, description: job.description });
                                }
                                oldJobsMap.set(key, job);
                            });

                            for await (let job of scraperFunction(...parameters)) {
                                job = getExisingDataOneJob(job, oldJobsMap);
                                if (job) {
                                    job = await filterJobWithAI(job, currentSearch.filters);
                                    jobs.value.push(job);
                                }
                            }
                            loading.value = false;
                            localStorage.setItem(`jobs_${searchName}`, JSON.stringify(jobs.value))
                        }
                    } catch (e) {
                        console.error(`Error running scraper ${scraperConfig.scraperName}:`, e);
                    }
                }
            });
    }
}

const getExisingDataOneJob = (job: any, oldJobsMap: Map<string, any>) => {
    let key = null;
    let hasId = false;
    if (job.id && job.scraperSource) {
        key = JSON.stringify({ id: job.id, scraperSource: job.scraperSource });
        hasId = true;
    } else {
        key = JSON.stringify({ title: job.title, company: job.company, description: job.description });
    }

    const oldJob = oldJobsMap.get(key);
    if (oldJob) {
        // this is supposed to check whether the job is a repost. This would only work if the job doesn't have an id
        if (!hasId && (Array.isArray(oldJob.datePosted) && !oldJob.datePosted.includes(job.datePosted)) || (!Array.isArray(oldJob.datePosted) && oldJob.datePosted !== job.datePosted)) {
            oldJob.reposted = (oldJob.reposted || 0) + 1;
            repostCount.value++;
            oldJob.datePosted = Array.isArray(oldJob.datePosted) ? [...oldJob.datePosted, job.datePosted] : [oldJob.datePosted, job.datePosted];
            oldJob.fromLatestSearch = true;
        } else {
            oldJob.fromLatestSearch = true;
            if (oldJob.reposted > 0)
                repostCount.value++;
        }
        return null;

    } else {
        if (hasId) {
            key = JSON.stringify({ title: job.title, company: job.company, description: job.description });

            const oldJob = oldJobsMap.get(key);
            if ((Array.isArray(oldJob.datePosted) && !oldJob.datePosted.includes(job.datePosted)) || (!Array.isArray(oldJob.datePosted) && oldJob.datePosted !== job.datePosted)) {
                oldJob.reposted = (oldJob.reposted || 0) + 1;
                repostCount.value++;
                oldJob.datePosted = Array.isArray(oldJob.datePosted) ? [...oldJob.datePosted, job.datePosted] : [oldJob.datePosted, job.datePosted];
                oldJob.fromLatestSearch = true;
            }
            return null;

        }
        job.fromLatestSearch = true;
        newJobCount.value = newJobCount.value ? newJobCount.value + 1 : 1;
        return job;
    }
}

const getDuplicates = (jobList: any[]) => {
    const seen = new Set();
    const groupedResults: any[] = [];
    for (const job of jobList) {
        if (!job || !job.description) {
            const group: any = reactive([job]);
            group.currentIndex = 0;
            groupedResults.push(group);
            continue;
        }

        const key = job.description.toString().trim();
        if (seen.has(key)) {
            const group = groupedResults.find(g => g[0]?.description?.toString().trim() === key);
            if (group) {
                group.push(job);
            } else {
                const group: any = reactive([job]);
                group.currentIndex = 0;
                groupedResults.push(group);
            }
        } else {
            seen.add(key);
            const group: any = reactive([job]);
            group.currentIndex = 0;
            groupedResults.push(group);
        }
    }
    return groupedResults;
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

    // Group jobs by description to avoid redundant AI calls for duplicate postings
    const grouped = getDuplicates(jobList);

    const aiPromises = grouped.map(async group => {
        const firstJob = group[0];
        if (!firstJob) return group;
        if (firstJob.aiProcessed) return group;
        if (firstJob.fromLatestSearch === false) return group;
        try {
            let localizedPrompt = 'From the job title and description, determine the following and answer in JSON format:';
            let number = 1;
            const exampleJson: any = {}
            filters.forEach((filter: Filter) => {
                if (filter.value && filter.outputs.some((output: string) => !firstJob[output])) {
                    localizedPrompt += number++ + `. ${filter.prompt}`;
                    Object.keys(filter.exampleJson).forEach(key => {
                        exampleJson[key] = filter.exampleJson[key];
                    })
                }
            })
            localizedPrompt += '\n\nExample JSON output:\n\n' + JSON.stringify(exampleJson) + "\n\n" + firstJob.description;

            if (number !== 1) {
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

                    let keys: string[] = []
                    filters.forEach((filter: Filter) => {
                        if (filter.value && filter.outputs.some((output: string) => !firstJob[output])) {
                            keys.push(...filter.outputs);
                        }
                    })

                    group.forEach((job: any) => {
                        job.aiProcessed = true;
                        keys.forEach(key => {
                            if (parsedContent && key in parsedContent) {
                                job[key] = parsedContent[key];
                                job["foundThroughAI"] = job["foundThroughAI"] || []
                                if (!job["foundThroughAI"].includes(key)) {
                                    job["foundThroughAI"].push(key)
                                }
                            }
                        });
                    });
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData.error?.message || response.statusText;
                    aiError.value = `AI Error (${response.status}): ${errorMessage}`;
                    console.error(`AI Error (${response.status}):`, errorMessage);
                }
            }
            else {
                group.forEach((job: any) => job.aiProcessed = true);
            }

            return group;
        } catch (e: any) {
            aiError.value = `AI connection failed: ${e.message || 'Unknown error'}`;
            console.error("AI Error:", e);
            return group;
        } finally {
            amountFiltered.value++;
        }
    });

    await Promise.all(aiPromises);
}
const filterJobWithAI = async (job: any, filters: Filter[]) => {
    const openaiApiKey = localStorage.getItem('openai_api_key') || ''
    const endPoint = localStorage.getItem('end_point') || ''
    const model = localStorage.getItem('model') || ''
    try {
        let localizedPrompt = 'From the job title and description, determine the following and answer in JSON format:';
        let number = 1;
        const exampleJson: any = {}
        filters.forEach((filter: Filter) => {
            if (filter.value && filter.outputs.some((output: string) => !job[output])) {
                localizedPrompt += number++ + `. ${filter.prompt}`;
                Object.keys(filter.exampleJson).forEach(key => {
                    exampleJson[key] = filter.exampleJson[key];
                })
            }
        })
        localizedPrompt += '\n\nExample JSON output:\n\n' + JSON.stringify(exampleJson) + "\n\n" + job.description;

        if (number !== 1) {
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

                let keys: string[] = []
                filters.forEach((filter: Filter) => {
                    if (filter.value && filter.outputs.some((output: string) => !job[output])) {
                        keys.push(...filter.outputs);
                    }
                })

            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;
                aiError.value = `AI Error (${response.status}): ${errorMessage}`;
                console.error(`AI Error (${response.status}):`, errorMessage);
            }
        }

        return job;
    } catch (e: any) {
        aiError.value = `AI connection failed: ${e.message || 'Unknown error'}`;
        console.error("AI Error:", e);
        return job;
    } finally {
        amountFiltered.value++;
    }
}

const getJobLink = (job: any) => {
    if (!job || !job.scraperSource || !job.id) return ''
    if (!scraperCache.has(job.scraperSource)) {
        scraperCache.set(job.scraperSource, JSON.parse(localStorage.getItem(job.scraperSource) || '{}'))
    }
    const scraperData = scraperCache.get(job.scraperSource)
    let url = scraperData?.jobLinkTemplate?.replace('{id}', job.id) || ''
    if (url && !url.startsWith('http') && !url.startsWith('//')) {
        url = 'https://' + url
    }
    return url
}
onMounted(async () => {
    try {
        const state = window.history.state
        if (state?.searchName) {
            await executeSearch(state.searchName, state?.viewSearch)
        } else {
            loading.value = false
        }
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                showScrollUpButton.value = true
            } else {
                showScrollUpButton.value = false
            }
        })
    } catch (e) {
        console.error('Failed to parse search results:', e)
        loading.value = false
    }
})
</script>

<style scoped>
.scroll-up-button {
    position: fixed;
    bottom: 50px;
    right: 50px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
    z-index: 1000;
    background-color: #3b82f6;
    color: #ffffff;
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px;
    width: 50px;
    height: 50px;
}

.scroll-up-button:hover {
    transform: scale(1.1);
}

/* Button Animation */
.scroll-fade-enter-active,
.scroll-fade-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-fade-enter-from,
.scroll-fade-leave-to {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
}

.arrow-right {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
}

.job-card:hover .arrow-right {
    transform: translateY(-50%) translateX(4px);
}

.arrow-left {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
    z-index: 2;
}

.job-card:hover .arrow-left {
    transform: translateY(-50%) translateX(-4px);
}

.tabs {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 30px;
    margin-top: 10px;
}

.ai-error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 20px;
    color: #991b1b;
    font-size: 14px;
    font-weight: 500;
}

.error-icon {
    font-size: 18px;
}

.error-message {
    flex: 1;
}

.close-error {
    background: none;
    border: none;
    color: #991b1b;
    cursor: pointer;
    font-size: 16px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.2s;
}

.close-error:hover {
    opacity: 1;
}

.badges-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.version-badge {
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
}

.arrow-right,
.arrow-left {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    width: 32px;
    height: 32px;
    z-index: 10;
}

.arrow-right:hover,
.arrow-left:hover {
    background: white;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
    text-decoration: none;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    pointer-events: auto;
    white-space: pre-line;
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
    position: relative;
}

.meta-label {
    font-weight: 700;
    color: #64748b;
    margin-right: 4px;
    font-size: 13px;
    text-transform: uppercase;
}

.keywords-label {
    font-weight: 700;
    color: #64748b;
    margin-right: 4px;
    font-size: 13px;
    text-transform: uppercase;
}

.keywords-container {
    display: flex;
    flex-wrap: wrap;
}

.keyword-item {
    padding: 8px 16px;
    background: #f8fafc;
    border-radius: 4px;
    margin-right: 4px;
    margin-bottom: 4px;
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
    display: flex;
    flex-direction: row;
    gap: 10px;
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
    flex: 1;
    overflow-y: auto;
    width: 90%;
    padding: 20px 0px;
    margin: auto;
    display: flex;
    flex-direction: column;
}

.view-header {
    margin-bottom: 24px;
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
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
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

.job-ai-processed {
    background-color: #f0f9ff;
    /* A very light, clean sky blue */
    border-color: #bae6fd;
    /* A slightly darker blue border to define the edge */
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
    padding: 18px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
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
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
    pointer-events: auto;
    white-space: pre-line;
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
    gap: 6px;
    margin-bottom: 20px;
}

.meta-item {
    font-size: 10px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;
}

.found-through-ai {
    background: #fef2f2 !important;
    border: 1px solid #fee2e2 !important;
}

.found-through-ai::after {
    content: '';
    position: absolute;
    top: -3px;
    right: -3px;
    width: 8px;
    height: 8px;
    background: #ef4444;
    border-radius: 50%;
    border: 1.5px solid white;
    box-shadow: 0 0 4px rgba(239, 68, 68, 0.3);
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
    white-space: pre-line;
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
    flex-direction: row;
    gap: 10px;
}

.save-button {
    background-color: #3b82f6;
    color: white;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.2s;
    cursor: pointer;
    border: none;
}

.save-button:hover {
    background: #2563eb;
}

.unsave-button {
    background-color: #ef4444;
    color: white;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    transition: background 0.2s;
    cursor: pointer;
    border: none;
}

.unsave-button:hover {
    background: #dc2626;
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

.control-panel {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.panel-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

.results-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.results-label {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    color: #64748b;
    letter-spacing: 0.5px;
}

.results-badge {
    font-size: 20px;
    font-weight: 800;
    color: #1e293b;
}

.new-jobs-badge {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.panel-actions {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.control-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
}

.select-wrapper {
    display: flex;
    gap: 2px;
    background: #f1f5f9;
    padding: 2px;
    border-radius: 10px;
}

.styled-select {
    border: none;
    background: transparent;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}

.styled-select:focus {
    outline: none;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.styled-select.direction {
    width: 85px;
}

.styled-select.priority {
    width: 60px;
}

.styled-select.target {
    width: 110px;
}

.ai-trigger-button {
    background: #f5f3ff;
    border: 1px solid #ddd6fe;
    color: #7c3aed;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    align-self: flex-end;
}

.ai-trigger-button:hover {
    background: #ede9fe;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.1);
}

.modal-title {
    font-size: 24px;
    font-weight: 800;
    color: #1e293b;
    margin: 8px 0;
}


.ai-modal {
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 20px;
    background-color: white;
    border-radius: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    width: 50%;
    height: 50%;
    margin: auto;
}

.ai-modal-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 10px 0;
}

.ai-run-button.large {
    padding: 16px;
    font-size: 16px;
    margin-top: 0;
}

/* Toggle Switch */
.toggle-switch {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: relative;
    width: 44px;
    height: 24px;
    background-color: #cbd5e1;
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked+.slider {
    background-color: #3b82f6;
}

input:checked+.slider:before {
    transform: translateX(20px);
}

.toggle-label {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
}

.panel-ai {
    border-top: 1px solid #f1f5f9;
    padding-top: 24px;
}

.ai-run-button {
    margin-top: 12px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.inline-loader {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
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