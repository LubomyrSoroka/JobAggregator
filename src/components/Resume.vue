
<template>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';

    const templateSource = ref<HTMLElement | null>(null);
    const outputContainer = ref<HTMLElement | null>(null);
    const props = defineProps<
    { transformedData: TransformedCVData} >() ;


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
    export type {CVData, TransformedCVData, Icons};

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
        if (!props.transformedData) return [];

        return icons.filter(icon =>
            getField(props.transformedData, icon.key)
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
    function getField(data: any, key: keyof CVData) {
        return data[key];
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

    if(outputContainer.value){
        outputContainer.value.style.transform = `scale(${scale})`;
        outputContainer.value.style.transformOrigin = 'top center';
    }
};

    defineExpose({
        splitCVIntoPages,
        scalePreview,
        icons
    })

</script>

<style src="../assets/resume.css"></style>
<style >
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

