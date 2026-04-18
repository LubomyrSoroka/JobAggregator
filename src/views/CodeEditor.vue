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
        <div>Job URL</div>
        <input v-model="jobLinkTemplate" placeholder="e.g. indeed.com/viewjob?jk={id}">
        <div class="run-in-background">
            <input v-model="runInBackground" type="checkbox"> Run in Background
        </div>
        <div>Scraper Icon</div>
        <!-- <input type="file" @change="handleFileUpload" accept="image/*"> -->
        <div class="icon-input-group">
            <input type="text" v-model="faviconUrl" placeholder="Enter domain (e.g. google.com)">
        </div>
        <img v-if="faviconUrl" :src="`https://www.google.com/s2/favicons?domain=${faviconUrl}&sz=128`"
            alt="Scraper Icon" width="32" height="32">

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
            <div class="run-menu-parameters" v-for="(value, name) in parameters" :key="name">
                <label :for="name">{{ name }}</label>
                <input :id="name" v-model="parameters[name]" />
            </div>
            <button @click="runScraper(runInBackground)">Run</button>
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
import { ref, onMounted, onUnmounted } from 'vue'
import type { ScraperParameter } from '../models'
import { onBeforeRouteLeave } from 'vue-router'
import { getStorageObject, updateStorageObject, createStorageObject, removeStorageObject } from '../services/storageService'
import { MY_SCRAPERS } from '../services/storeNames'
const code = ref('');
const scraperName = ref('');
const error = ref('');
const outputCount = ref(0);
const jobLinkTemplate = ref('');
const output = ref('');
const runMenu = ref(false);
const parameters = ref<ScraperParameter>({});
let originalName: string | null = null;
const confirmDelete = ref(false);
let originalCodeValue: string | undefined = undefined;
let originalJobLinkTemplateValue: string | undefined = undefined;
let originalRunInBackgroundValue: boolean | undefined = undefined;
const runInBackground = ref(false);
const currentScraper = ref<any>(null);
const scraperId = ref<number | null>(null);
const faviconUrl = ref<string>('');

onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    scraperId.value = Number(urlParams.get('scraper-id')) || null
    if (scraperId.value) {
        currentScraper.value = await getStorageObject(MY_SCRAPERS, scraperId.value)
        scraperName.value = currentScraper.value.name || ''
        code.value = currentScraper.value.code || ''
        parameters.value = currentScraper.value.editor_run_args || []
        jobLinkTemplate.value = currentScraper.value.jobLinkTemplate || ''
        runInBackground.value = currentScraper.value.runInBackground || false

        if (currentScraper.value.icon) {
            faviconUrl.value = currentScraper.value.icon.includes('?domain=') ? currentScraper.value.icon.split('?domain=')[1].split('&')[0] : currentScraper.value.icon;
        }
    }

    // Set value after data is loaded so we have the correct base for comparison
    originalName = scraperName.value;
    originalCodeValue = code.value;
    originalJobLinkTemplateValue = jobLinkTemplate.value;
    originalRunInBackgroundValue = runInBackground.value;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (code.value !== originalCodeValue || scraperName.value !== originalName || jobLinkTemplate.value !== originalJobLinkTemplateValue || runInBackground.value !== originalRunInBackgroundValue) {
            event.preventDefault();
            event.returnValue = '';
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    onUnmounted(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    });
})

onBeforeRouteLeave((to, from, next) => {
    if (code.value !== originalCodeValue || scraperName.value !== originalName || jobLinkTemplate.value !== originalJobLinkTemplateValue) {
        const answer = window.confirm('You have unsaved changes. Do you really want to leave?');
        if (!answer) return next(false);
    }
    next();
})

const deleteScraper = async () => {
    if (scraperId.value)
        await removeStorageObject(MY_SCRAPERS, scraperId.value);

}

const saveScraper = async () => {
    if (!scraperName.value) {
        error.value = 'Please enter a scraper name'
        return
    }
    const iconValue = faviconUrl.value ? (faviconUrl.value.startsWith('http') ? faviconUrl.value : `https://www.google.com/s2/favicons?domain=${faviconUrl.value}&sz=128`) : '';
    if (!scraperId.value) {
        scraperId.value = await createStorageObject(MY_SCRAPERS, {
            name: scraperName.value,
            code: code.value,
            jobLinkTemplate: jobLinkTemplate.value,
            icon: iconValue
        });
    }
    else {
        await updateStorageObject(MY_SCRAPERS, scraperId.value, {
            name: scraperName.value,
            code: code.value,
            jobLinkTemplate: jobLinkTemplate.value,
            parameters: getParameterNames(),
            runInBackground: runInBackground.value,
            icon: iconValue
        });
    }
    originalName = scraperName.value;
    originalCodeValue = code.value;
    originalJobLinkTemplateValue = jobLinkTemplate.value;
    originalRunInBackgroundValue = runInBackground.value;
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
    const newParams: ScraperParameter = {};
    names.forEach(name => {
        newParams[name] = parameters.value[name] || '';
    });
    parameters.value = newParams;
}

const runScraper = async (inBackground: boolean = false) => {
    output.value = '';
    error.value = '';
    if (!scraperId.value) {
        throw new Error('Scraper ID is not defined');
    }
    currentScraper.value.editor_run_args = parameters.value;
    await updateStorageObject(MY_SCRAPERS, scraperId.value, currentScraper.value);

    if (inBackground) {
        runMenu.value = false;
        outputCount.value = 0;
        output.value = "Running scraper in background extension...";

        try {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    window.removeEventListener('message', handleMessage);
                    reject(new Error("Timeout: Extension did not respond within 60 seconds. Make sure the extension is installed and active."));
                }, 60000);

                const handleMessage = (event: MessageEvent) => {
                    // We only accept messages from ourselves
                    if (event.source !== window) return;

                    if (event.data && event.data.type === 'scraper-result-event') {
                        console.log("[SCRAPER-DEBUG] Received scraper-result-event", event.data);
                        clearTimeout(timeout);
                        window.removeEventListener('message', handleMessage);

                        if (event.data.result) {
                            // Keep the timeout alive or clear it if we trust subsequent results
                            // For now, let's just clear it on the first result to show it's working
                            clearTimeout(timeout);
                            output.value += JSON.stringify(event.data.result, null, 2) + '\n';
                            outputCount.value++;
                        }
                        else {
                            window.removeEventListener('message', handleMessage);
                            clearTimeout(timeout);
                            if (event.data.done) {
                                resolve();
                            } else {
                                reject(new Error(event.data.error || "Unknown background error"));
                            }
                        }
                    }
                };

                window.addEventListener('message', handleMessage);

                // Dispatch the event to trigger the content script via postMessage
                console.log("[SCRAPER-DEBUG] Sending run-scraper-event via postMessage", {
                    scraperName: scraperName.value,
                    parameters: getParameterNames().map(name => parameters.value[name])
                });

                window.postMessage({
                    type: 'run-scraper-event',
                    payload: {
                        scraperName: scraperName.value,
                        code: code.value,
                        parameters: getParameterNames().map(name => parameters.value[name])
                    }
                }, '*');
            });

        } catch (e: any) {
            error.value = `Execution Error: ${e.message}`;
            output.value = "";
        }
    } else {
        try {
            const scraperLoader = new Function(`
                    ${code.value}
                    return typeof scrape !== 'undefined' ? scrape : null;
                `);

            const scrapeFunction = scraperLoader();

            if (typeof scrapeFunction === 'function') {
                const args = getParameterNames().map(name => parameters.value[name]);
                for await (const job of scrapeFunction(...args)) {
                    output.value += JSON.stringify(job, null, 2) + '\n';
                    outputCount.value++;
                }
            } else {
                output.value = "Error: Please define an 'async function scrape()'";
            }
        } catch (err: any) {
            console.error("Execution Error:", err);

            let msg = `Execution Error: ${err.message}`;
            if (err.stack) {
                msg += `\n\nStack Trace:\n${err.stack}`;
            }

            error.value = msg;

            output.value = "";
        }
    }
}
</script>

<style scoped>
.run-menu {
    position: absolute;
    display: flex;
    width: 50%;
    height: 50%;
    margin: auto;
    flex-direction: column;
    justify-content: space-between;
    overflow-y: auto;
    z-index: 101;
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    gap: 10px;
}

.run-menu-parameters {
    display: flex;
    flex-direction: row;
    gap: 15px;
    width: 100%;
}

.run-menu-parameters label {
    flex: 0 0 120px;
    /* Fixed width for labels */
    font-weight: 500;
    color: #4b5563;
    text-align: left;
}

.run-menu-parameters input {
    flex: 1;
    /* Input takes up all remaining space */
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

.run-in-background {
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
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

.icon-input-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

.icon-input-group input {
    flex: 1;
}

.capture-button {
    padding: 8px 16px;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
}

.capture-button:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
}

.icon-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.captured-badge {
    font-size: 0.75rem;
    background: #22c55e;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 600;
}
</style>