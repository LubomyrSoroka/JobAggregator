<template>
    <div class="window">
        <div class="side-by-side">
            <div v-if="yamlText" ref="editorSection" class="editor-section" :style="{ flexBasis: editorBasis }">
                <VueMonacoEditor v-model:value="yamlText" language="yaml" style="flex: 1"/>
                <button @click="saveYaml">Save</button>
            </div>
            <div class="separator-bar" @mousedown="onSeparatorMouseDown">
                <div class="separator-grip"></div>
            </div>
            <div v-if="transformedData" ref="previewSection" class="preview-section" :style="{ flexBasis: previewBasis }">
                <Resume ref="resume" :transformedData="transformedData"></Resume>
                <button @click="downloadPDF">Download PDF</button>
            </div>
            <div v-else>
                <input type="file" @change="handleFileUpload" accept=".yaml">
            </div>
        </div>
        <div class="side-by-side" >
            <ResumeChat v-if="yamlText" :resume="yamlText" :jobDescription="jobDescription" ></ResumeChat>
            <div v-if="jobDescription" class="job-description">
                <h2>Job Description</h2>
                <div v-html="jobDescription"></div>
            </div>
        </div>
    </div>
</template>


<script lang="ts" setup>
import { loadIcon } from '@iconify/vue'
import { ref} from 'vue';
import YAML from 'yaml'; // npm install yaml
import { nextTick, onMounted } from 'vue';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';
import { getStorageObject, updateStorageObject } from '@/services/storageService.ts';
import { JOBS, RESUMES } from '@/services/storeNames.ts';
import ResumeChat from '../components/ResumeChat.vue'
import type { CVData, Icons, TransformedCVData } from '@/components/Resume.vue';
import Resume from '@/components/Resume.vue';

let jobDescription = ref('');
let newFile = false;
let jobId = ref<string|null>('');

onMounted(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    jobId.value = urlParams.get('jobId');
    const searchId = Number(urlParams.get('searchId'));
    let object = null;
    if(jobId.value && searchId){
        // are jobIds distinct between searches? No, not necessarily. 
        // However, it would still be good to edit the same resume between different searches.
        object = await getStorageObject(RESUMES, jobId.value); 
    }
    if(!jobId.value || !searchId || !object)
        object = (await getStorageObject(RESUMES, '1')); 
    if(object){
        yamlText.value = object['yaml-resume'];
        displayPDF(true);
    }
    newFile = !yamlText.value;
    if(jobId.value && searchId){
        const jobs = await getStorageObject(JOBS, searchId);
        const job = jobs.find((job: any) => job.id === jobId.value);
        jobDescription.value = job?.description;
    }

})

// 1. Read and parse the YAML
const yamlText = ref<string>('');
const transformedData = ref<TransformedCVData | null>(null);
const editorSection = ref<HTMLElement | null>(null);
const previewSection = ref<HTMLElement | null>(null);
const resume = ref(null);
// --- Drag-to-resize logic ---
const editorBasis = ref<string>('50%');
const previewBasis = ref<string>('50%');
let isDragging = false;
let startX = 0;
let startEditorWidth = 0;
let startPreviewWidth = 0;

const onSeparatorMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startEditorWidth = editorSection.value?.getBoundingClientRect().width ?? 0;
    startPreviewWidth = previewSection.value?.getBoundingClientRect().width ?? 0;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
};

const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    const totalWidth = startEditorWidth + startPreviewWidth;
    const minWidth = 100; // minimum panel width in px

    let newEditorWidth = startEditorWidth + delta;
    let newPreviewWidth = startPreviewWidth - delta;

    // Clamp
    if (newEditorWidth < minWidth) {
        newEditorWidth = minWidth;
        newPreviewWidth = totalWidth - minWidth;
    }
    if (newPreviewWidth < minWidth) {
        newPreviewWidth = minWidth;
        newEditorWidth = totalWidth - minWidth;
    }

    editorBasis.value = `${newEditorWidth}px`;
    previewBasis.value = `${newPreviewWidth}px`;

    // Re-scale the preview after resize
    (resume.value as any).scalePreview();
};

const onMouseUp = () => {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
};

const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file: File | undefined = target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            yamlText.value = e.target?.result as string;
            displayPDF(true);
        };
        reader.readAsText(file);
    }
}

const displayPDF = async (firstTime: boolean) => {
    const parsedYaml = YAML.parse(yamlText.value);
    cvData = parsedYaml.cv;
    transformedData.value = getTransformedData();
    await nextTick(); // 👈 wait for DOM to update
    if(firstTime && resume.value){
        const iconNames = (resume.value as any).icons.map((i: Icons) => i.icon);
        await Promise.allSettled(iconNames.map((icon: string) => loadIcon(icon)));
    }
    (resume.value as any).splitCVIntoPages();
    await nextTick();
    (resume.value as any).scalePreview();
}

const saveYaml = async () =>{
    displayPDF(false)
    if(jobId.value){
        await updateStorageObject(RESUMES, jobId.value, {'yaml-resume':yamlText.value});
    }
    else {
        await updateStorageObject(RESUMES, '1', {'yaml-resume':yamlText.value});
    }
}

let cvData: CVData;
const getTransformedData = (): TransformedCVData | null => {
    return {
        ...cvData,
        // Group sections by their name
        sections: Object.entries(cvData.sections).map(([sectionName, items]) => {
            return {
                type: items.some(item => item.details) ? 'partial' : items.some(item=>item.institution)? 'education':'full',
                name: sectionName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                element: items.map(item => ({
                    link: item.link,
                    title:  (item.name || item.position || item.degree|| item.label), // Map different title types
                    'sub-title': item.company,    // Map different sub-title types
                    institution: item.institution,
                    area: item.area,
                    location: item.location,
                    start_date: item.start_date ? new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                    }).format(new Date(item.start_date)) : undefined,

                    end_date: item.end_date ? new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                    }).format(new Date(item.end_date)) : undefined,
                    //highlights: item.highlights ? (Array.isArray(item.highlights) ? item.highlights.join(' ') : item.highlights) : (item.details || '')
                    highlights: item.highlights,
                    details: item.details
                }))
            };
        })
    };
};

const downloadPDF = () => {
    window.print();
}



</script>


<style>
      .window{
            padding: 20px;
            gap: 20px;
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
            overflow: auto;
      }  
      .side-by-side{
        display: flex;
        flex-direction: row;
      }
      .editor-section {
            flex: 1 1 50%;
            min-width: 100px;
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
      }
      .separator-bar {
            flex: 0 0 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: col-resize;
            background: #e5e7eb;
            border-radius: 3px;
            transition: background 0.15s;
      }
      .separator-bar:hover,
      .separator-bar:active {
            background: #bfc5ce;
      }
      .separator-grip {
            width: 2px;
            height: 32px;
            border-left: 1px solid #9ca3af;
            border-right: 1px solid #9ca3af;
            gap: 2px;
      }
      .preview-section {
            flex: 1 1 50%;
            min-width: 100px;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            background-color: #f3f4f6;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            box-sizing: border-box;
      }
    .job-description {
        flex: 1;
    }
</style>