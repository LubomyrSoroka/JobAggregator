<template>
    <RouterLink to="/" class="back-button">Back</RouterLink>
    <div class="code-editor">
        <div @click="error = ''">
            Scraper Name
        </div>
        <div v-if="error" class="error">
            {{ error }}
        </div>
        <input v-model="scraperName" placeholder="Enter your scraper name..." :readOnly="isViewingPublicScraper">
        <div class="code-area">
            <div>Code</div>
            <VueMonacoEditor language="javascript" v-model:value="code" @change="autoSave"
                placeholder="Enter your code here..." :options="{
                    readOnly: isViewingPublicScraper
                }"></VueMonacoEditor>
        </div>
        <div> Notes </div>
        <textarea v-model="notes" placeholder="Enter any notes about the scraper..."
            :readOnly="isViewingPublicScraper"></textarea>
        <div>Job URL</div>
        <input v-model="jobLinkTemplate" placeholder="e.g. indeed.com/viewjob?jk={id}"
            :readOnly="isViewingPublicScraper">
        <div class="run-in-background">
            <input v-model="runInBackground" type="checkbox" :disabled="isViewingPublicScraper"> Run in Background
        </div>
        <div>Scraper Icon</div>
        <!-- <input type="file" @change="handleFileUpload" accept="image/*"> -->
        <div class="icon-input-group">
            <input type="text" v-model="faviconUrl" placeholder="Enter domain (e.g. google.com)"
                :readOnly="isViewingPublicScraper">
        </div>
        <img v-if="faviconUrl" :src="`https://www.google.com/s2/favicons?domain=${faviconUrl}&sz=128`"
            alt="Scraper Icon" width="32" height="32">
        <div v-if="!isViewingPublicScraper && currentScraper?.absolutePath">
            {{typeof(currentScraper.absolutePath) === 'object' ? 'File Name: ' + JSON.stringify(currentScraper?.absolutePath.name) : 'Local File Path: ' + currentScraper?.absolutePath }}</div>
        <div class="buttons">
            <button v-if="!isViewingPublicScraper" @click="saveScraper">Save</button>
            <SaveMessage ref="saveMessageRef" message="Scraper saved successfully!" />
            <button v-if="!isViewingPublicScraper" @click="chooseLocalFile" :disabled="!scraperId">
                {{ currentScraper?.absolutePath ? "Change Local File" : "Sync Local File" }}
            </button>
            <button v-if="!isViewingPublicScraper && currentScraper && currentScraper.absolutePath"
                @click="uploadToFile" :disabled="autoSaveSetting">Save to Original File</button>
            <div>
                Auto Save to Original File<input type="checkbox" v-model=autoSaveSetting>
            </div>
            <button v-if="!isViewingPublicScraper && currentScraper && currentScraper.absolutePath"
                @click="loadLocalScraper">Load From Original File</button>
            <button @click="openRunMenu" :disabled="!scraperId">Run</button>
            <button v-if="!isViewingPublicScraper" @click="confirmDelete = true" :disabled="!scraperId">Delete</button>
            <button @click="enableDebugger" :disabled="!scraperId">Enable Debugger</button>
            <button v-if="!isViewingPublicScraper && currentScraper && !currentScraper.public_id"
            @click="publishScraper">Publish</button>
            <button v-else-if="!isViewingPublicScraper && currentScraper && currentScraper.public_id"
            @click="unpublishScraper">Unpublish</button>
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
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { ref, onMounted, onUnmounted } from 'vue'
import type { ScraperParameter } from '../models'
import { onBeforeRouteLeave } from 'vue-router'
import { getStorageObject, updateStorageObject, createStorageObject, removeStorageObject } from '../services/storageService'
import { MY_HANDLES, MY_SCRAPERS } from '../services/storeNames'
import { supabase } from '../../utils/supabase';
import SaveMessage from "../components/SaveMessage.vue";
import { browser } from '../scripts/scraperFunctions'

const code = ref('');
const lastSyncedCode = ref('');
const scraperName = ref('');
const error = ref('');
const outputCount = ref(0);
const notes = ref('');
const jobLinkTemplate = ref('');
const output = ref('');
const runMenu = ref(false);
const parameters = ref<ScraperParameter>({});
let originalName: string | null = null;
const confirmDelete = ref(false);
let originalCodeValue: string | undefined = undefined;
let originalJobLinkTemplateValue: string | undefined = undefined;
let originalRunInBackgroundValue: boolean | undefined = undefined;
let originalNotesValue: string | undefined = undefined;
const runInBackground = ref(false);
const currentScraper = ref<any>(null);
const scraperId = ref<number | null>(null);
const faviconUrl = ref<string>('');
let isViewingPublicScraper = ref(false);
const saveMessageRef = ref<any>(null);
const autoSaveSetting = ref<boolean>(false);


onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search)
    scraperId.value = Number(urlParams.get('scraper-id')) || null
    if (scraperId.value) {
        currentScraper.value = await getStorageObject(MY_SCRAPERS, scraperId.value)
    }
    else if (scraperId.value = Number(urlParams.get('public-scraper-id'))) {
        isViewingPublicScraper.value = true;
        const { data: scrapeItems, error } = await supabase
            .from('Public Scrapers')
            .select('*')
            .eq('id', scraperId.value)
        if (scrapeItems && scrapeItems[0]) {
            currentScraper.value = scrapeItems[0];
        }
    }
    else {
        throw new Error('No scraper id provided')
    }

    currentScraper.value.absolutePath = (await getStorageObject(MY_HANDLES, scraperId.value))?.absolutePath || null;
    
    scraperName.value = currentScraper.value.name || ''
    code.value = currentScraper.value.code || ''
    lastSyncedCode.value = code.value
    parameters.value = currentScraper.value.editor_run_args || []
    jobLinkTemplate.value = currentScraper.value.jobLinkTemplate || ''
    runInBackground.value = currentScraper.value.runInBackground || false
    notes.value = currentScraper.value.notes || ''

    if (currentScraper.value.icon) {
        faviconUrl.value = currentScraper.value.icon.includes('?domain=') ? currentScraper.value.icon.split('?domain=')[1].split('&')[0] : currentScraper.value.icon;
    }

    if (!isViewingPublicScraper.value)
        await loadLocalScraper();

    // Set value after data is loaded so we have the correct base for comparison
    originalName = scraperName.value;
    originalCodeValue = code.value;
    originalJobLinkTemplateValue = jobLinkTemplate.value;
    originalRunInBackgroundValue = runInBackground.value;
    originalNotesValue = notes.value;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        if (code.value !== originalCodeValue || scraperName.value !== originalName || jobLinkTemplate.value !== originalJobLinkTemplateValue || runInBackground.value !== originalRunInBackgroundValue || notes.value !== originalNotesValue) {
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
    if (scraperId.value) {
        await removeStorageObject(MY_SCRAPERS, scraperId.value);

    }
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
            icon: iconValue,
            notes: notes.value,
            runInBackground: runInBackground.value,
        });

        //currentScraper.value = { absolutePath: currentScraper.value?.absolutePath || '' };

    }
    else {
        await updateStorageObject(MY_SCRAPERS, scraperId.value, {
            name: scraperName.value,
            code: code.value,
            jobLinkTemplate: jobLinkTemplate.value,
            parameters: getParameterNames(),
            runInBackground: runInBackground.value,
            icon: iconValue,
            notes: notes.value,
        });
    }

    // Sync to local filesystem via extension native messaging

    originalName = scraperName.value;
    originalCodeValue = code.value;
    originalJobLinkTemplateValue = jobLinkTemplate.value;
    originalRunInBackgroundValue = runInBackground.value;
    if (saveMessageRef.value) {
        saveMessageRef.value.show();
    }
}


let saveTimeout: number | undefined;

const autoSave = async () => {
    if(autoSaveSetting.value)
        uploadToFile();
}
const verifyWritePermission = async (fileHandle: any): Promise<boolean> => {
    let permission = await fileHandle.queryPermission({
        mode: "readwrite",
    });
    if (permission !== "granted") {
        permission = await fileHandle.requestPermission({
            mode: "readwrite",
        });
    }
    if(permission !== 'granted'){
        alert('Error: Please manually allow access to file editing in the site settings')
    }
    return permission === "granted";
}

const uploadToFile = async () => {
    if(!currentScraper.value?.absolutePath){
        return;
    }
    clearTimeout(saveTimeout);

    saveTimeout = window.setTimeout(async () => {

        if('showOpenFilePicker' in window){
            const fileHandle = currentScraper.value?.absolutePath;
            let writable;
            try {
                writable = await fileHandle.createWritable();
            } catch (err) {
                const hasPermission = await verifyWritePermission(fileHandle);
                if (hasPermission) {
                    try {
                        writable = await fileHandle.createWritable();
                    } catch (retryErr) {
                        console.error("Failed to obtain writable after permission granted:", retryErr);
                    }
                } else {
                    console.error("Permission denied to write to local file");
                }
            }
            if (writable) {
                await writable.write(code.value);
                await writable.close();
                lastSyncedCode.value = code.value;
            }
        }

        else {
            await sendNativeFileAction({ type: 'SAVE_FILE', name: scraperName.value, code: code.value, absolutePath: currentScraper.value?.absolutePath });
            lastSyncedCode.value = code.value;
        }

    }, 500);
}

const sendNativeFileAction = (actionPayload: any): Promise<any> => {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            resolve({ error: "Native messaging timeout or extension inactive" });
        }, 10000);

        const handleMessage = (event: MessageEvent) => {
            if (event.source !== window) return;
            if (event.data && event.data.direction === 'file-action-result-web') {
                if (event.data.status !== 'success')
                    resolve({ error: 'Error with native messaging...' })
                clearTimeout(timeout);
                window.removeEventListener('message', handleMessage);
                resolve(event.data);
            }
        };

        window.addEventListener('message', handleMessage);

        window.postMessage({
            type: 'file-action-event',
            payload: actionPayload
        }, '*');
    });
};

const chooseLocalFile = async () => {
    // File System Access API is supported
    if ('showOpenFilePicker' in window) {
        // User picks a file
        if (!scraperId.value)
            return;
        //let fileHandle = currentScraper.value?.absolutePath || null;
        let fileHandle
        [fileHandle] = await window.showOpenFilePicker();
        await createStorageObject(MY_HANDLES, {id: scraperId.value, absolutePath: fileHandle}, false );
        
        const hasPermission = await verifyWritePermission(fileHandle);
        if (!hasPermission) {
            console.error("Permission denied");
            return;
        }
        const file = await fileHandle.getFile();
        const content = await file.text();
        code.value = content;
        lastSyncedCode.value = content;
        currentScraper.value.absolutePath = fileHandle;

    } else {
        // Fallback for Firefox, etc.
        const result = await sendNativeFileAction({ type: 'CHOOSE_FILE' });
        if (result.status === 'success' && result.absolutePath) {
            if (!currentScraper.value) {
                currentScraper.value = {};
            }
            currentScraper.value.absolutePath = result.absolutePath;
            code.value = result.code || code.value;
            lastSyncedCode.value = code.value;

            if (scraperId.value) {
                await updateStorageObject(MY_SCRAPERS, scraperId.value, {
                    ...currentScraper.value,
                    code: code.value,
                    absolutePath: currentScraper.value.absolutePath
                });
            }
    } else if (result.status !== 'canceled') {
        alert("Failed to pick file: " + (result.error || result.status));
    }
    }
}

const loadLocalScraper = async () => {
    if('showOpenFilePicker' in window){
        if (!scraperId.value || isViewingPublicScraper.value) return;
        if (currentScraper.value?.absolutePath && typeof currentScraper.value.absolutePath.getFile === 'function') {
            try {
                let file = await currentScraper.value.absolutePath.getFile();
                if(!file){
                    const hasPermission = await verifyWritePermission(currentScraper.value.absolutePath);
                    if (hasPermission) {
                        file = await currentScraper.value.absolutePath.getFile();
                    } else {
                        console.error("Permission denied to read file");
                        return;
                    }
                }
                const content = await file.text();
                if (content !== lastSyncedCode.value) {
                    code.value = content;
                    lastSyncedCode.value = content;
                }
            } catch (error) {
                console.error('Error reading file:', error)
            }
        }
    }else{
        if(!scraperName.value)
            return;
        const result = await sendNativeFileAction({
            type: 'LOAD_FILE',
            name: scraperName.value,
            absolutePath: currentScraper.value?.absolutePath
        });
        if (result.status === 'success' && result.code) {
            code.value = result.code;
            lastSyncedCode.value = result.code;
            if (scraperId.value) {
                await updateStorageObject(MY_SCRAPERS, scraperId.value, {
                    ...currentScraper.value,
                    code: code.value
                });
            }
        } else {
            console.warn("Failed to load local file via native messaging:", result.error || result.status);
        }
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

const enableDebugger = () => {
    if(runInBackground.value)
        window.postMessage({
            type: 'enable-debugger',
            payload: JSON.parse(JSON.stringify({
                scraperName: scraperName.value,
                code: code.value,
                parameters: parameters.value
            }))
        }, '*');
    else{
        const scraperLoader = new Function('browser', 'seenIds', `
                ${code.value}
                //# sourceURL=${scraperName.value.replace(/\s/g, "_")}.js
                return typeof scrape !== 'undefined' ? scrape : null;
            `);
    }
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
    if (!isViewingPublicScraper.value) {
        await updateStorageObject(MY_SCRAPERS, scraperId.value, currentScraper.value);
    }

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

            const scraperLoader = new Function('browser', 'seenIds', `
                    ${code.value}
                    //# sourceURL=${scraperName.value.replace(/\s/g, "_")}.js
                    return typeof scrape !== 'undefined' ? scrape : null;
                `);


            const scrapeFunction = scraperLoader(browser, new Set());

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

const publishScraper = async () => {
    if (!scraperId.value) {
        alert('Scraper ID is not defined');
        return;
    }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
        alert('You are not logged in. Please log in to publish scraper.');
        return;
    }
    const userId = session.session.user.id;
    const iconValue = faviconUrl.value ? (faviconUrl.value.startsWith('http') ? faviconUrl.value : `https://www.google.com/s2/favicons?domain=${faviconUrl.value}&sz=128`) : '';
    const { data, error } = await supabase.from('Public Scrapers').insert({
        name: scraperName.value,
        code: code.value,
        jobLinkTemplate: jobLinkTemplate.value,
        icon: iconValue,
        notes: notes.value,
        runInBackground: runInBackground.value,
        user_id: userId,
        parameters: JSON.stringify(getParameterNames())
    }).select();
    if (data && data[0]) {
        currentScraper.value.public_id = data[0].id;
    }
    if (error) {
        alert('Error publishing scraper: ' + error.message)
        return
    }
    await updateStorageObject(MY_SCRAPERS, scraperId.value, currentScraper.value)
}

const unpublishScraper = async () => {
    if (!scraperId.value) {
        alert('Scraper ID is not defined');
        return;
    }
    if (!currentScraper.value.public_id) {
        alert('Scraper is not published');
        return;
    }
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
        alert('You are not logged in. Please log in to publish scraper.');
        return;
    }
    const { data, error } = await supabase.from('Public Scrapers').delete().eq('id', currentScraper.value.public_id)
    if (error) {
        alert('Error unpublishing scraper: ' + error.message)
        return
    }
    currentScraper.value.public_id = null
    await updateStorageObject(MY_SCRAPERS, scraperId.value, currentScraper.value)
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