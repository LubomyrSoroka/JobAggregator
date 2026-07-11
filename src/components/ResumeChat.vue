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
            <input type="text" v-model="message" placeholder="Enter your message..." @keyup.enter="() => sendMessage()"/>
            <button @click="() => sendMessage()">Send</button>
            <div class="info-tooltip">
                <span class="info-icon">?</span>
                <span class="tooltip-text">
                    Use <strong>{resume}</strong> for the text content of your resume, and <strong>{jobDescription}</strong> for the text content of the job description.
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { getAllStorageObjectsAsObject, getStorageObject, updateStorageObject } from '@/services/storageService';
    import { CHAT_HISTORIES, OPENAI_API_CONFIG } from '@/services/storeNames';
    import { ref, watch } from 'vue'
    import AppLoader from './AppLoader.vue';
    import { marked } from "marked";
    const props = defineProps<{
        jobDescription: string;
        resume: string;
        jobId: string;
    }>()
    const message = ref('');
    const loading = ref(false);
    type Message = {
        type: 'input'|'output';
        text: string;
    }
    import { onMounted } from 'vue';
    const previousMessages = ref<Message[]>([]);
    onMounted(async () => {

        const storage = await getStorageObject(CHAT_HISTORIES, props.jobId);
        if(storage) {
            previousMessages.value = storage;
        }
    });
    const sendMessage = async (customMessage?: string) => {
        const textToUse = customMessage || message.value;
        if (!textToUse) {
            return;
        }
        previousMessages.value.push({
            type: 'input',
            text: textToUse
        });
        await updateStorageObject(CHAT_HISTORIES, props.jobId, previousMessages.value);
        let fullMessage = textToUse;
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
        const apiMessages = [
            {
                role: 'system',
                content: "You are an expert resume consultant. If you ever want to output an edited resume or part of an edited resume, output the result in YAML format so that it can be parsed correctly."
            },
            ...previousMessages.value.map((msg) => {
                let content = msg.text;
                if (msg.type === 'input') {
                    content = content
                        .replace('{resume}', props.resume)
                        .replace('{jobDescription}', props.jobDescription);
                }
                return {
                    role: msg.type === 'input' ? 'user' : 'assistant',
                    content: content
                };
            })
        ];
        const response = await fetch(endPoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiApiKey}`
            },
            body: JSON.stringify({
                model,
                messages: apiMessages,
                stream: true
            })
        });
        const outputIndex = previousMessages.value.push({
            type: 'output',
            text: ''
        }) - 1;
        loading.value = false;

        if (!response.body) {
            throw new Error('No response body available for streaming.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');
                for (const line of lines) {
                    const cleanedLine = line.trim();
                    if (cleanedLine.startsWith('data: ')) {
                        const dataStr = cleanedLine.slice(6);
                        if (dataStr === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            const deltaContent = parsed.choices[0]?.delta?.content || '';
                            if(previousMessages.value[outputIndex])
                                previousMessages.value[outputIndex].text += deltaContent;
                        } catch (e) {
                            // Ignore partial JSON parse errors
                        }
                    }
                }
            }
        }
        await updateStorageObject(CHAT_HISTORIES, props.jobId, previousMessages.value);
    }
    const stopWatch = watch(
        () => [props.resume, props.jobDescription],
        async ([resume, jobDesc]) => {
            if (resume && jobDesc) {
                if(!await getStorageObject(CHAT_HISTORIES, props.jobId))
                    sendMessage("Here is my resume:\n{resume}\n\nAnd here is the job description:\n{jobDescription}\n\nPlease analyze how well my resume matches this job description and suggest tailored improvements.");
                stopWatch(); // Unwatch so it only runs once on load
            }
        },
        { immediate: true }
    );
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
        align-items: center;
        gap: 10px;
    }
    .input-section input{
        flex: 1;
    }
    .info-tooltip {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
    .info-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid #ccc;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #666;
        font-weight: bold;
        background: #f9f9f9;
        transition: background-color 0.2s, border-color 0.2s;
    }
    .info-tooltip:hover .info-icon {
        background-color: #e6e6e6;
        border-color: #999;
    }
    .tooltip-text {
        visibility: hidden;
        width: 240px;
        background-color: #333;
        color: #fff;
        text-align: left;
        border-radius: 6px;
        padding: 8px 12px;
        position: absolute;
        z-index: 10;
        bottom: 125%;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0;
        transition: opacity 0.2s ease-in-out, visibility 0.2s;
        font-size: 12px;
        line-height: 1.4;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        pointer-events: none;
    }
    .tooltip-text::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
    }
    .info-tooltip:hover .tooltip-text {
        visibility: visible;
        opacity: 1;
    }
</style>