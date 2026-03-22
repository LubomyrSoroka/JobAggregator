<template>
    <RouterLink to="/" class="back-button">Back</RouterLink>
    <div class="code-editor">
        <div @click="error = ''">
            Scraper Name
        </div>
        <div v-if="error" class="error">
            {{ error }}
        </div>
        <input v-model="scraperName" placeholder="Enter your scraper name...">
        <div class="code-area">
            <div>Code</div>
            <textarea v-model="code" placeholder="Enter your code here..."></textarea>
        </div>
        <div>Credits</div>
        <input v-model="credits" placeholder="Enter your credits...">
        <div>Job URL</div>
        <input v-model="jobLinkTemplate" placeholder="e.g. indeed.com/viewjob?jk={id}">
        <div class="buttons">
            <button @click="saveScraper">Save</button>
            <button @click="openRunMenu">Run</button>
            <button @click="confirmDelete = true">Delete</button>
        </div>
        <div v-if="output" class="output">
            <div>Output Count: {{ outputCount }}</div>
            <div>Output</div>
            <textarea readonly v-model="output"></textarea>
        </div>
    </div>
    <div v-if="runMenu" class="dimmed-background">
        <div class="run-menu">
            <button class="close" @click="runMenu = false">X</button>
            <div v-for="parameter in parameters" :key="parameter.name">
                <label :for="parameter.name">{{ parameter.name }}</label>
                <input :id="parameter.name" v-model="parameter.value" />
            </div>
            <button @click="runScraper">Run</button>
        </div>
    </div>
    <div class="dimmed-background" v-if="confirmDelete">
        <div class="confirm-delete-content">
            <div class="confirm-delete-title">Are you sure you want to delete this scraper?</div>
            <div class="confirm-delete-buttons">
                <button class="cancel-button" @click="confirmDelete = false">Cancel</button>
                <RouterLink class="delete-button" to="/" @click="deleteScraper">Delete</RouterLink>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ScraperParameter } from '../models'
const code = ref('');
const scraperName = ref('');
const error = ref('');
const credits = ref('');
const outputCount = ref(0);
const jobLinkTemplate = ref('');
const output = ref('');
const runMenu = ref(false);
const parameters = ref<ScraperParameter[]>([]);
let originalName: string | null = null;
const confirmDelete = ref(false);

onMounted(() => {
    const urlParams = new URLSearchParams(window.location.search)
    scraperName.value = urlParams.get('scraper-name') || ''
    originalName = scraperName.value;
    if (scraperName.value) {
        const data = JSON.parse(localStorage.getItem(scraperName.value) || '{}')
        code.value = data.code || ''
        credits.value = data.credits || ''
        parameters.value = JSON.parse(localStorage.getItem(`${scraperName.value}_run_args`) || '[]')
        jobLinkTemplate.value = data.jobLinkTemplate || ''
    }
})

const deleteScraper = () => {
    localStorage.removeItem(scraperName.value);
    let myScrapers = JSON.parse(localStorage.getItem('my_scraper_data') || '[]')
    myScrapers = myScrapers.filter((scraper: string) => scraper !== scraperName.value)
    localStorage.setItem('my_scraper_data', JSON.stringify(myScrapers))
}

const saveScraper = () => {
    if (!scraperName.value) {
        error.value = 'Please enter a scraper name'
        return
    }
    if (originalName && originalName !== scraperName.value) {
        localStorage.removeItem(originalName);
        localStorage.removeItem(`${originalName}_run_args`);
        localStorage.setItem(`${scraperName.value}_run_args`, JSON.stringify(parameters.value));
        let myScrapers = JSON.parse(localStorage.getItem('my_scraper_data') || '[]');
        myScrapers = myScrapers.map((scraper: string) => {
            if (scraper === originalName) {
                return scraperName.value;
            }
            return scraper;
        });
        localStorage.setItem('my_scraper_data', JSON.stringify(myScrapers));
    }
    localStorage.setItem(scraperName.value, JSON.stringify({ code: code.value, credits: credits.value, jobLinkTemplate: jobLinkTemplate.value, parameters: getParameterNames() }))
    let myScrapers = JSON.parse(localStorage.getItem('my_scraper_data') || '[]')
    if (!myScrapers.includes(scraperName.value)) {
        myScrapers.push(scraperName.value)
        localStorage.setItem('my_scraper_data', JSON.stringify(myScrapers))
    }
}
const getParameterNames = () => {
    const match = code.value.match(/(?:async\s+)?function\*?\s+scrape\s*\(([^)]*)\)/) ||
        code.value.match(/const\s+scrape\s*=\s*(?:async\s*)?\(([^)]*)\)/);
    if (match) {
        const names = (match[1] || '').split(',')
            .map(p => (p.split('=')[0] || '').trim())
            .filter(p => p);
        return names;
    }
    return [];
}
const openRunMenu = () => {
    runMenu.value = true;
    const names = getParameterNames();
    parameters.value = names.map(name => {
        const existing = parameters.value.find(p => p.name === name);
        return { name, value: existing ? existing.value : '' };
    });
}

const runScraper = async () => {
    output.value = '';
    error.value = '';

    try {
        // Create a function that executes the code and returns the scrape function
        const scraper = new Function(`
            ${code.value}
            return typeof scrape !== 'undefined' ? scrape : null;
        `)();

        if (typeof scraper === 'function') {
            localStorage.setItem(`${scraperName.value}_run_args`, JSON.stringify(parameters.value));
            const result = await scraper(...parameters.value.map(p => p.value));
            // there should be a loading screen after this
            runMenu.value = false;
            outputCount.value = 0;

            if (Array.isArray(result)) {
                result.forEach((job: any) => {
                    output.value += JSON.stringify(job, null, 2) + '\n';
                    outputCount.value++;
                });
            } else if (result) {
                output.value = JSON.stringify(result, null, 2);
                outputCount.value++;
            }
        } else {
            error.value = "Error: Please define an 'async function scrape()'";
        }
    } catch (e: any) {
        console.error("Scraper Error Details:", e);
        let msg = `Execution Error: ${e.message}`;
        if (e.stack) {
            msg += `\n\nStack Trace:\n${e.stack}`;
        }
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            msg += `\n\nPossible Cause: This is likely a CORS error. Ensure your CORS extension is enabled and configured for apis.indeed.com.`;
        }
        error.value = msg;
    }
}
</script>

<style scoped>
.confirm-delete-buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.delete-button {
    background-color: red;
    color: white;
    text-decoration: none;
    cursor: pointer;
    border-radius: 8px;
    padding: 8px;
}

.cancel-button {
    background-color: #444444;
    color: white;
    text-decoration: none;
    cursor: pointer;
    border-radius: 8px;
    padding: 8px;
}

.dimmed-background {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.confirm-delete-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.run-menu div {
    display: flex;
    flex-direction: column;
    z-index: 101;
}

.run-menu input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.code-editor {
    width: 90%;
    margin-left: auto;
    margin-right: auto;
    margin-top: 20px;
    margin-bottom: 20px;
    height: 100vh;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-sizing: border-box;


}

.error {
    color: #d32f2f;
    background-color: #ffebee;
    padding: 12px;
    border: 1px solid #ffcdd2;
    border-radius: 8px;
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    max-height: 200px;
    overflow-y: auto;
}

.buttons {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.code-area {
    display: flex;
    flex-direction: column;
    flex: 2;
    gap: 5px;
}

.code-area textarea {
    flex: 1;
    width: 100%;
}

.output {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 5px;
}

.output textarea {
    flex: 1;
    width: 100%;
    background-color: #f9f9f9;
}

.back-button {
    position: absolute;
    top: 10px;
    left: 10px;
    cursor: pointer;
}

textarea {
    border: 1px solid black;
    border-radius: 10px;
    padding: 10px;
    font-size: 16px;
    font-family: 'Courier New', monospace;
    resize: none;
}
</style>