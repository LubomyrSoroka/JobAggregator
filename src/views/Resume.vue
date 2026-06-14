<template>
    <div class="idk">
        <div v-if="yamlText" ref="editorSection" class="editor-section" :style="{ flexBasis: editorBasis }">
            <VueMonacoEditor v-model:value="yamlText" language="yaml" height="100%" />
            <button @click="saveYaml">Save</button>
        </div>
        <div class="separator-bar" @mousedown="onSeparatorMouseDown">
            <div class="separator-grip"></div>
        </div>
        <div v-if="transformedData" ref="previewSection" class="preview-section" :style="{ flexBasis: previewBasis }">
            <!-- Hidden template source used by Vue to render changes, and by splitCVIntoPages to read from -->
            <div ref="templateSource" class="document-container template-source">
                <div class ="margins">
                    <div class="top">
                        <h1 class="name">{{transformedData.name}}</h1>
                        <div v-if="transformedData.headline" class="headline"> {{transformedData.headline}} </div>
                        <div class="icons">
                            <div v-for="item in visibleIcons" :key="item.key" class="icon-group">
                                <Icon :icon="item.icon" />
                                <a v-if="item.linkTemplate" class="icon" :href="item.linkTemplate.replace('{value}', getField(transformedData, item.key))" target="_blank">{{ getField(transformedData, item.key) }}</a>
                                <div v-else class="icon">{{ getField(transformedData, item.key) }}</div>
                            </div>
                        </div>
                    </div>
                    <div v-for="section in transformedData.sections" :key="section.name">
                        <div class="section">
                            <h2>{{section.name}}</h2>
                            <div v-if="section.type === 'full'" class="elements">
                                <div v-for="element in section.element" :key="element.title" class="element-group">
                                    <div class="title-and-highlights">
                                        <a v-if="element.link" :href="element.link" class="element-title" target="_blank">
                                            {{element.title}}
                                        </a>
                                        <div v-else class="element-title">
                                            {{ element.title }}
                                        </div>
                                        <h3> {{element['sub-title']}} </h3>
                                        <ul class="highlights-list">
                                                <li v-for="highlight in element.highlights">
                                                    {{highlight}}
                                                </li>
                                        </ul>
                                    </div>
                                    <div class="location-and-date">
                                        <div v-if="element.location"> {{element.location}} </div>
                                        <div v-if="element.start_date">
                                            {{element.start_date}}
                                            <template v-if="element.end_date">
                                                - {{element.end_date}}
                                            </template>
                                            <template v-else>
                                                - Present
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div v-else-if="section.type === 'partial'" class="bullet-elements">
                                <div v-for="element in section.element" :key="element.title">
                                    <strong>{{element.title}}:</strong> {{ element.details }}
                                </div>
                            </div>
                            <div v-else-if="section.type === 'education'" class="elements">
                                <div v-for="element in section.element" :key="element.title" class="element-group">
                                    <div class="education-element">
                                        <strong>{{element.title}}</strong> 
                                        <div>
                                            <div><strong> {{ element.institution }},&nbsp;</strong> {{ element.area }}</div>
                                            <!-- this should be refactored and can be created into a component -->
                                            <ul class="highlights-list">
                                                <li v-for="highlight in element.highlights">
                                                    {{highlight}}
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    <!-- this should be refactored and can be created into a component -->
                                    <div class="location-and-date">
                                        <div v-if="element.location"> {{element.location}} </div>
                                        <div v-if="element.start_date">
                                            {{element.start_date}}
                                            <template v-if="element.end_date">
                                                - {{element.end_date}}
                                            </template>
                                            <template v-else>
                                                - Present
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Visible container where split pages are rendered -->
            <div lang="en" ref="outputContainer" class="document-container">
                <!-- splitCVIntoPages will insert pages here -->
            </div>
            <button @click="downloadPDF">Download PDF</button>
        </div>
        <div v-else>
            <input type="file" @change="handleFileUpload" accept=".yaml">
        </div>
        <ResumeChat v-if="yamlText" :resume="yamlText" :jobDescription="''" ></ResumeChat>
    </div>
</template>


<script lang="ts" setup>
import { Icon, loadIcon } from '@iconify/vue'
import { computed, ref, type ComputedRef } from 'vue';
import YAML from 'yaml'; // npm install yaml
import { nextTick } from 'vue';
import { VueMonacoEditor } from '@guolao/vue-monaco-editor';

import ResumeChat from '../components/ResumeChat.vue'

// 1. Read and parse the YAML
const yamlText = ref<string>('');
function getField(data: any, key: keyof CVData) {
    return data[key];
}
const transformedData = ref<TransformedCVData | null>(null);
const templateSource = ref<HTMLElement | null>(null);
const outputContainer = ref<HTMLElement | null>(null);
const editorSection = ref<HTMLElement | null>(null);
const previewSection = ref<HTMLElement | null>(null);

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
    scalePreview();
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
            const parsedYaml = YAML.parse(yamlText.value);
            cvData = parsedYaml.cv;
            transformedData.value = getTransformedData();

            // Preload icons before waiting for nextTick to render them
            const iconNames = icons.map(i => i.icon);
            await Promise.allSettled(iconNames.map(icon => loadIcon(icon)));

            await nextTick(); // 👈 wait for DOM to update

            splitCVIntoPages();
            await nextTick();
            scalePreview();
        };
        reader.readAsText(file);
    }
}
const saveYaml = async () =>{
    const parsedYaml = YAML.parse(yamlText.value)
    cvData = parsedYaml.cv;
    transformedData.value = getTransformedData();
    await nextTick(); // 👈 wait for DOM to update
    splitCVIntoPages();
    await nextTick();
    scalePreview();
}
// const file = fs.readFileSync('/Users/lubomyrsoroka/Desktop/Projects/generate html cv/Lubomyr_Soroka_CV.yaml', 'utf8');
// const parsedYaml = YAML.parse(file);
type CVData = {
    name: string,
    headline?: string,
    sections: Record<string, any[]>
    location?: string
    email?: string
    phone?: string
    website?: string
  linkedin?: string
  github?: string
}
type TransformedCVData = Omit<CVData, 'sections'> & {
    sections: {
        type: 'full'|'partial'|'education';
        name: string;
        element: {
            link: string;
            title: string;
            'sub-title'?: string;
            location?: string;
            start_date?: string;
            end_date?: string;
            highlights?: any;
            details?: string;
            institution?: string;
            area?: string;
        }[];
    }[];
};


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

type IconField =
    | 'location'
    | 'email'
    | 'phone'
    | 'website'
    | 'linkedin'
    | 'github';

type Icons = {
    key: IconField;
    icon: string;
    linkTemplate?: string;
}

const visibleIcons = computed(() => {
    if (!transformedData.value) return [];

    return icons.filter(icon =>
        getField(transformedData.value, icon.key)
    );
});

const icons: Icons[] = [
  { key: 'location', icon: 'mdi:map-marker' },
  { key: 'email', icon: 'mdi:email', linkTemplate:'mailto:{value}'},
  { key: 'phone', icon: 'mdi:phone', linkTemplate:'tel:{value}'},
  { key: 'website', icon: 'mdi:web', linkTemplate: 'https://{value}'},
  { key: 'linkedin', icon: 'mdi:linkedin', linkTemplate: 'https://linkedin.com/in/{value}' },
  { key: 'github', icon: 'mdi:github', linkTemplate: 'https://github.com/{value}' },
]

const downloadPDF = () => {
    window.print();
}

const splitCVIntoPages = () => {
    const container = outputContainer.value;
    const source = templateSource.value;
    if (!container || !source) return;
    const margins = source.querySelector('.margins');
    if (!margins) return;

    const top = margins.querySelector('.top') as HTMLElement;
    const sections = Array.from(margins.querySelectorAll('.section')) as HTMLElement[];

    const topClone = top ? (top.cloneNode(true) as HTMLElement) : null;
    const sectionData = sections.map(section => {
        const header = section.querySelector('h2');
        const elementsContainer = section.querySelector('.elements, .bullet-elements');
        const containerClass = elementsContainer ? elementsContainer.className : 'elements';
        const elements = elementsContainer ? Array.from(elementsContainer.children) : [];
        return {
            headerClone: header ? (header.cloneNode(true) as HTMLElement) : null,
            containerClass,
            elementClones: elements.map(el => el.cloneNode(true) as HTMLElement)
        };
    });

    // Clear the container completely before building pages in the DOM
    container.replaceChildren();

    const createPage = () => {
        const page = document.createElement('div');
        page.className = 'document';
        const pageMargins = document.createElement('div');
        pageMargins.className = 'margins';
        page.appendChild(pageMargins);
        container.appendChild(page);
        return pageMargins;
    };

    let currentPage = createPage();
    if (topClone) {
        currentPage.appendChild(topClone);
    }

    for (const section of sectionData) {
        let sectionDiv: HTMLElement | null = null;
        let elementsDiv: HTMLElement | null = null;
        let isFirstPageForSection = true;

        const startSectionOnCurrentPage = () => {
            sectionDiv = document.createElement('div');
            sectionDiv.className = 'section';
            if (section.headerClone && isFirstPageForSection) {
                sectionDiv.appendChild(section.headerClone.cloneNode(true));
                isFirstPageForSection = false;
            }
            elementsDiv = document.createElement('div');
            elementsDiv.className = section.containerClass;
            sectionDiv.appendChild(elementsDiv);
            currentPage.appendChild(sectionDiv);
        };

        for (const element of section.elementClones) {
            if (!sectionDiv || !elementsDiv) {
                startSectionOnCurrentPage();
            }

            elementsDiv!.appendChild(element);

            // Maximum allowed height for content inside margins is 11in - 0.7in bottom margin
            const maxPageHeight = 10.3 * 96;
            const currentHeight = currentPage.getBoundingClientRect().height;

            if (currentHeight > maxPageHeight) {
                // Determine if we can move this element to a new page
                const canMove = (elementsDiv!.children.length > 1) || (currentPage.children.length > 1);

                if (canMove) {
                    elementsDiv!.removeChild(element);
                    if (elementsDiv!.children.length === 0) {
                        currentPage.removeChild(sectionDiv!);
                        isFirstPageForSection = true; // Section was moved entirely, show header on next page
                    }

                    currentPage = createPage();
                    startSectionOnCurrentPage();
                    elementsDiv!.appendChild(element);
                }
            }
        }
    }
};

const scalePreview = () => {
    const preview = document.querySelector('.preview-section') as HTMLElement;
    const page = document.querySelector('.document') as HTMLElement;

    if (!preview || !page) return;

    const availableWidth = preview.clientWidth - 40; // padding
    const scale = Math.min(1, availableWidth / page.offsetWidth);

    outputContainer.value!.style.transform = `scale(${scale})`;
    outputContainer.value!.style.transformOrigin = 'top center';

    // // compensate for scaled height
    // outputContainer.value!.style.width = `${page.offsetWidth}px`;
    // outputContainer.value!.style.height =
    //     `${outputContainer.value!.scrollHeight * scale}px`;
};


</script>


<style src="../assets/resume.css"></style>
<style>
      .idk{
            padding: 20px;
            gap: 20px;
            display: flex;
            flex-direction: row;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
      }  
      .editor-section {
            flex: 1 1 50%;
            min-width: 100px;
            height: 100%;
            overflow: hidden;
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
      .template-source {
            position: absolute;
            left: -9999px;
            top: -9999px;
            width: 8.5in;
            pointer-events: none;
      }
      @media print {
            .template-source,
            .template-source * {
                  display: none !important;
                  visibility: hidden !important;
            }
      }
</style>