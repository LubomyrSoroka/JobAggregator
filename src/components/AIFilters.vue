<template>
    <div class="ai-filters">
        <div class="filter-header" v-if="title">
            <span class="filter-title">{{ title }}</span>
        </div>
        <div class="filter-options">
            <div v-for="(filter, index) in filters" :key="index" class="filter-option"
                @click="filter.value = !filter.value">
                <input type="checkbox" :id="idPrefix + '-' + filter.name" v-model="filter.value" @click.stop>
                <label :for="idPrefix + '-' + filter.name" @click.stop="filter.value = !filter.value">{{ filter.name
                    }}</label>
            </div>
        </div>
        <p class="filter-hint">The AI will try to find missing data in the job description.</p>
        <slot></slot>
    </div>
</template>


<script setup lang="ts">
import Filter, { filters as defaultFilters } from './Filter.ts';

const props = withDefaults(defineProps<{
    filters?: Filter[];
    title?: string;
    idPrefix?: string;
}>(), {
    filters: () => defaultFilters,
    title: '',
    idPrefix: 'ai-filter'
});
</script>

<style scoped>
.ai-filters {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.filter-header {
    margin-bottom: 4px;
}

.filter-title {
    font-size: 14px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.filter-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
}

.filter-option label {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
    cursor: pointer;
}

.filter-option input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.filter-hint {
    margin: 0;
    font-size: 12px;
    color: #64748b;
}
</style>
