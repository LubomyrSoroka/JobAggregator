<template>
    <div class="stats-view">
        <div class="stats-card">
            <h2 class="stats-title">Jobs by Years of Experience</h2>
            <div v-if="jobs.length > 0" class="chart-container">
                <div :style="{ minWidth: chartData.minWidth }">
                    <VueApexCharts width="100%" height="450" :options="chartData.options" :series="chartData.series">
                    </VueApexCharts>
                </div>
            </div>
            <h2 class="stats-title">Hiring Platform</h2>
            <div v-if="jobs.length > 0" class="chart-container">
                <div :style="{ minWidth: hiringPlatformData.minWidth }">
                    <VueApexCharts width="100%" height="450" :options="hiringPlatformData.options"
                        :series="hiringPlatformData.series">
                    </VueApexCharts>
                </div>
            </div>
            <h2 class="stats-title">Keywords</h2>
            <div v-if="jobs.length > 0" class="chart-container">
                <div :style="{ minWidth: keywordData.minWidth }">
                    <VueApexCharts width="100%" height="450" :options="keywordData.options"
                        :series="keywordData.series">
                    </VueApexCharts>
                </div>
            </div>
            <h2 class="stats-title">Salary Range</h2>
            <div v-if="jobs.length > 0" class="chart-container">
                <div :style="{ minWidth: salaryData.minWidth }">
                    <VueApexCharts width="100%" height="450" :options="salaryData.options" :series="salaryData.series">
                    </VueApexCharts>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { calculateYearlySalary, parseNumeric } from '@/components/salary'

const props = defineProps<{
    jobs: any[]
}>()

const chartData = computed(() => {
    const counts: Record<number, number> = {}

    // Use a Map to deduplicate by description for statistics
    const seenDescriptions = new Set<string>()
    props.jobs.forEach(job => {
        if (!job || !job.description) {
            // If no description, treat as unique for stats
        } else {
            const desc = job.description.toString().trim()
            if (seenDescriptions.has(desc)) return
            seenDescriptions.add(desc)
        }

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
        minWidth: (categories.length * 70) + 'px',
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
    const counts: Record<string, number> = {}
    const platformLabels: Record<string, string> = {
        'workday': 'Workday',
        'indeed': 'Indeed',
        'jobbank.gc.ca': 'Job Bank',
        'bamboohr': 'BambooHR',
        'other': "Other",
        'taleo': "Taleo",
        'greenhouse': "Greenhouse",
        'ashby': "Ashby",
        'smartrecruiters': "SmartRecruiters",
        'workable': "Workable",
        'ultipro': "Ultipro",
        'rippling': "Rippling",
        'lever': "Lever",
    }

    const seenDescriptions = new Set<string>()
    props.jobs.forEach(job => {
        if (job.description) {
            const desc = job.description.toString().trim()
            if (seenDescriptions.has(desc)) return
            seenDescriptions.add(desc)
        }

        const link = (job.applyLink || job.url || '').toLowerCase()
        // Extract domain part safely (handles https:// and paths)
        const domain = link.split('//').pop()?.split('/')[0].replace(/^www\./, '') || ''
        let found = false;
        Object.keys(platformLabels).forEach(platform => {
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
        minWidth: (categories.length * 90) + 'px',
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
const keywordData = computed(() => {
    const counts: Record<string, number> = {}
    props.jobs.forEach(job => {
        if (job.keywords) {
            job.keywords.forEach((keyword: string) => {
                counts[keyword] = (counts[keyword] || 0) + 1
            })
        }
    })
    const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const top50 = sortedCounts.slice(0, 50)
    return {
        minWidth: (top50.length * 90) + 'px',
        series: [{
            name: 'Jobs',
            data: top50.map(item => item[1])
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
                categories: top50.map(item => item[0]),
                position: 'bottom',
                axisBorder: { show: false },
                axisTicks: { show: false },
                title: {
                    text: 'Keywords',
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

const salaryData = computed(() => {
    const counts: Record<string, number> = {}
    const binSize = 10000;
    props.jobs.forEach(job => {
        let salaryValue = null;
        if (job.salaryRange === 'not specified')
            counts['not specified'] = (counts['not specified'] || 0) + 1
        else if (job.salaryType !== "yearly" && job.salaryRange) {
            salaryValue = calculateYearlySalary(job);
        } else if (job.salaryRange) {
            salaryValue = parseNumeric(job.salaryRange);
        }

        if (salaryValue != null && salaryValue[0] != null) {
            const bin = Math.floor(salaryValue[0] / binSize) * binSize;
            counts[bin] = (counts[bin] || 0) + 1
        }
    })

    const categories = Object.keys(counts)
    return {
        minWidth: (categories.length * 100) + 'px',
        series: [{
            name: 'Jobs',
            data: Object.values(counts)
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
                categories: Object.keys(counts).map(key => key === 'not specified' ? key : key + "-" + (parseInt(key) + binSize)),
                position: 'bottom',
                axisBorder: { show: false },
                axisTicks: { show: false },
                title: {
                    text: 'Salary',
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

</script>

<style scoped>
.stats-view {
    padding: 20px;
}

.stats-card {
    background: white;
    padding: 30px;
    border-radius: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
}

.stats-title {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 25px;
}

.chart-container {
    margin-bottom: 40px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 10px;
    /* Space for the scrollbar */
}
</style>
