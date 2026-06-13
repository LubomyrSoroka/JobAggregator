<template>
    <template v-if="transformedData">
        <div lang="en" class="document-container">
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
        <button @click="downloadPDF">Download PDF</button>
    </template>
    <template v-else>
        <input type="file" @change="handleFileUpload" accept=".yaml">
    </template>
</template>


<script lang="ts" setup>
import { Icon, loadIcon } from '@iconify/vue'
import { computed, ref, type ComputedRef } from 'vue';
import YAML from 'yaml'; // npm install yaml
import { nextTick } from 'vue';
// 1. Read and parse the YAML

function getField(data: any, key: keyof CVData) {
    return data[key];
}
const transformedData = ref<TransformedCVData | null>(null);

const handleFileUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        const file: File | undefined = target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const yamlText = e.target?.result as string;
            const parsedYaml = YAML.parse(yamlText);
            cvData.value = parsedYaml.cv;
            transformedData.value = getTransformedData();

            // Preload icons before waiting for nextTick to render them
            const iconNames = icons.map(i => i.icon);
            await Promise.allSettled(iconNames.map(icon => loadIcon(icon)));

            await nextTick(); // 👈 wait for DOM to update

            splitCVIntoPages();
        };
        reader.readAsText(file);
    }
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

const cvData = ref<CVData | null>(null);
const getTransformedData = (): TransformedCVData | null => {
    if (!cvData.value) return null;
    return {
        ...cvData.value,
        // Group sections by their name
        sections: Object.entries(cvData.value.sections).map(([sectionName, items]) => {
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
    const container = document.querySelector('.document-container');
    if (!container) return;
    const margins = container.querySelector('.margins');
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


</script>


<style>
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@200..900&display=swap');

    @media print {
        body * {
            visibility: hidden;
        }

        .document-container,
        .document-container * {
            visibility: visible;
        }

        .document-container {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            padding: 0;
            margin: 0;
        }

        .document {
            border: none !important;
            margin: 0 !important;
            page-break-after: always;
            break-after: page;
        }

        html, body {
            margin: 0;
            padding: 0;
        }

        @page {
            margin: 0;
            size: letter;
        }
    }

    :root {
        /* --accent-color: rgb(32 78 139); */
        --accent-color: rgb(0 79 144);
    }

    /* .document-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 20px 0;
    } */

    .document {
        font-family: "Source Sans 3", "Calibri", sans-serif;
        width: 8.5in;
        height: 11in;
        margin: 0 auto;
        border: 1px solid #000;
        overflow: hidden;
        box-sizing: border-box;
    }

    .document-container {
        /* calibri isn't the same font. Compare the capital R letter for example. */
        font-family: "Source Sans 3", "Calibri", sans-serif;
        /* width: 8.5in; */
        /* border: 1px solid #000; */
        /* width: 100vw;
        height: 100vh; */
        padding: 0;
        font-size: 10pt;
        text-align: justify;
        hyphens: auto;
        line-height: 0.6;
        display: flex;
        flex-direction: column;
        gap: 10px;
        background-color: white;
    }

    .margins{
        padding: 0.7in 0.7in 0 0.7in;
    }

    /* html,
    body {
        margin: 0;
    } */

    .top {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 0.6;
    }

    /* This controls the gap between the icon and the text */
    .icon-group {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        gap: 5px;
    }


    .name {
        font-weight: bold;
        font-size: 30pt;
        margin-bottom: 0.7cm;
    }

    .element-group {
        display: grid;
        grid-template-columns: 1fr auto;
        /* column-gap: 0.1cm; */
        align-items: start;
        break-inside: avoid;
        line-height: 1.2;
    }

    /* .element-group {
        display: flex;
        justify-content: space-between;
    } */

    .elements, .bullet-elements {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
        /* font-size: 10pt; */
        /* this is the same as entries.side_space in the yaml file */
        margin-left: 0.2cm;
        margin-right: 0.2cm;
        margin-top: 0.3cm;
        margin-bottom: 0.5cm;
        /* gap: 100px; */
    }
    .bullet-elements{
        gap: 0.3em;
    }
    .elements{
        gap: 1.2em;
    }

    .date-section {
        display: flex;
        flex-direction: row;
    }


    .icons {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        /* I just randomly chose 90% here... which might be okay. But would I prefer max four elements per row? */
        width: 90%;
        /* column-gap is the horizontal disatnce between elements, whereas row-gap is vertical distance */
        /* in rendercv, i can see the the horizontal distance (column-gap) is 0.5cm, but I don't know whta the exact row-gap is */
        row-gap: 0.3cm;
        column-gap: 0.5cm;
        color: var(--accent-color);
        margin-bottom: 0.7cm;
    }

    h1,
    h2 {
        color: var(--accent-color);
    }

    h1 {
        margin: 0;
    }

    h2 {
        margin: 0;
        display: flex;
        align-items: baseline;
        gap: 5px;
        font-size: 1.4em;
        line-height: 0.6;
    }

    h2::after {
        content: "";
        flex: 1;
        border-bottom: 0.5pt solid var(--accent-color);
    }

    h3 {
        font-weight: normal;
        margin: 0;
        font-size: 10pt;
    }

    .headline {
        color: var(--accent-color);
        margin-bottom: 0.7cm;
        font-size: 10pt;
    }

    .element-title {
        font-weight: bold;
    }

    a {
        text-decoration: none;
        color: var(--accent-color);
    }

    .separator-line {
        flex: 1;
        border-bottom: 0.5pt solid var(--accent-color);
    }

    .location-and-date {
        text-align: right;
        width: 4.15cm;
        /* border: 1px solid #000; */
    }

    /* .highlights-list {
        list-style-position: inside;
        margin: 0 0 0 0.15cm;
        padding: 0;
    } */

    /* li::marker {
        font-size: 0.8em;
        color: rgb(0, 0, 0);
    } */

    .highlights-list {
        list-style: none;
        margin: 0 0 0 0.15cm;
        padding: 0;
    }

    li {
        display: flex;
        align-items: flex-start;
        gap: 0.5em;
        /* space between bullet and text */
        /* line-height: 1.2; */
    }

    /* custom bullet */
    li::before {
        content: "•";
        flex-shrink: 0;
        color: rgb(0, 0, 0);
        /* line-height: 1; */
        /* top: 0.15em; */
        /* vertical alignment tweak */
        /* text-align: justify;
        hyphens: auto; */
    }

    .education-element{
        display: flex;
        flex-direction: row;
        gap: 10px;
    }
    .institution-area-and-highlights{
        display: flex;
        flex-direction: column;
        gap: 10px;
    }




    /* .title-and-highlights {
        overflow-wrap: break-word;
        hyphens: auto;
    } */
</style>