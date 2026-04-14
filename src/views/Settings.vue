<template>
    <div class="settings-container">
        <h1>Settings</h1>
        <RouterLink to="/" class="back-link">← Back to Searches</RouterLink>
        <div class="settings-content">
            <div class="form-group">
                <label>OpenAI API Key</label>
                <input type="text" v-model="openaiApiKey" @change="saveOpenAIKey" placeholder="sk-...">
            </div>
            <div class="form-group">
                <label>EndPoint</label>
                <input type="text" v-model="endPoint" @change="saveEndPoint" placeholder="https://api.openai.com/v1">
            </div>
            <div class="form-group">
                <label>Model</label>
                <input type="text" v-model="model" @change="saveModel" placeholder="gpt-4o">
            </div>
        </div>
    </div>

</template>


<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { getAllStorageObjects, updateStorageObject } from '../services/storageService'
import { OPENAI_API_CONFIG } from '../services/storeNames'

const openaiApiKey = ref('')
const endPoint = ref('')
const model = ref('')

onMounted(async () => {
    const openaiConfig = await getAllStorageObjects(OPENAI_API_CONFIG)
    JSON.parse(openaiConfig)

    openaiApiKey.value = openaiConfig['openai_api_key'] || ''
    endPoint.value = openaiConfig['end_point'] || ''
    model.value = openaiConfig['model'] || ''
})
const saveOpenAIKey = async () => {
    await updateStorageObject(OPENAI_API_CONFIG, 'openai_api_key', openaiApiKey.value)
}
const saveEndPoint = async () => {
    await updateStorageObject(OPENAI_API_CONFIG, 'end_point', endPoint.value)
}
const saveModel = async () => {
    await updateStorageObject(OPENAI_API_CONFIG, 'model', model.value)
}
</script>

<style scoped>
.settings-container {
    max-width: 600px;
    margin: 40px auto;
    padding: 20px;
}

h1 {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 8px;
}

.back-link {
    display: inline-block;
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 32px;
    transition: color 0.2s;
}

.back-link:hover {
    color: #3b82f6;
}

.settings-content {
    background: white;
    padding: 32px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
</style>