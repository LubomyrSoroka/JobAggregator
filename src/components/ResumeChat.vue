<template>
    <div class="chat-container">
        <div class="output">
            <div class="messages">
                <div v-for="message in previousMessages" :class="`${message.type === 'input' ? 'align-right' : 'message'}`" >
                    <div :class="` ${message.type === 'input' ? 'message-input' : 'message-output'}`" v-html="marked.parse(message.text)"> </div>
                </div>
            </div>
            <AppLoader v-if="loading" />
        </div>
        <div class="input-section">
            <input type="text" v-model="message" placeholder="Enter your message..." />
            <button @click="sendMessage">Send</button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { getAllStorageObjectsAsObject } from '@/services/storageService';
    import { OPENAI_API_CONFIG } from '@/services/storeNames';
    import { ref } from 'vue'
    import AppLoader from './AppLoader.vue';
    import { marked } from "marked";
    const props = defineProps<{
        jobDescription: string;
        resume: string;
    }>()
    const message = ref('');
    const loading = ref(false);
    type Message = {
        type: 'input'|'output';
        text: string;
    }
    const previousMessages = ref<Message[]>([]);
    const sendMessage = async () => {
        previousMessages.value.push({
            type: 'input',
            text: message.value
        });
        let fullMessage = message.value;
        message.value = '';
        fullMessage = fullMessage.replace('{resume}', props.resume);
        fullMessage = fullMessage.replace('{jobDescription}', props.jobDescription);
        const openaiConfig = await getAllStorageObjectsAsObject(OPENAI_API_CONFIG);
        if (!openaiConfig) {
            alert('Configure your LLM settings first!');
            return
        }
        loading.value = true;
        const openaiApiKey = openaiConfig['openai_api_key'] || ''
        const endPoint = openaiConfig['end_point'] || ''
        const model = openaiConfig['model'] || ''
        const response = await fetch(endPoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: fullMessage }]
            })
        });
        const data = await response.json();
        previousMessages.value.push({
            type: 'output',
            text: data.choices[0].message.content
        });
        loading.value = false;
    }
</script>

<style>
    .messages{
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    .align-right{
        display: flex;
        justify-content: flex-end;
    }
    .message{
        display: flex;
    }

    /* .message-input,
    .message-output {
        max-width: 70%;
        word-break: break-word;
        overflow-wrap: anywhere;
    } */

    .message-input{
        border: 1px solid grey;
        box-shadow: 3px 3px grey;
        padding: 5px;
        display: inline-block;
        background-color: rgb(78, 138, 249);
        color: white;
        border-radius: 5px 5px 0px 5px;
    }


    .chat-container{
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 15px;
        height: 100%;
        border: 1px solid black;
        padding: 20px;
    }
    .output{
        flex: 1;
        overflow-y: auto;
    }
    .input-section{
        display: flex;
    }
    .input-section input{
        flex: 1;
    }
</style>