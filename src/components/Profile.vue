<template>
    <div class="profile-info" ref="profileRef">
        <div class="profile-avatar" @click="showProfile = !showProfile">
            <img src="https://i.pravatar.cc/150?img=12" alt="Profile">
        </div>
        <div v-if="showProfile" class="profile-menu">
            <RouterLink to="/settings" @click="showProfile = false">Settings</RouterLink>
            <RouterLink v-if="!user" to="/signup" @click="showProfile = false">Sign Up/Login</RouterLink>

        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue'

const showProfile = ref(false)
const profileRef = useTemplateRef<HTMLElement>('profileRef')

import { supabase } from '../../utils/supabase'
import type { User } from '@supabase/supabase-js'
const user = ref<User | null>(null)
// when initialized, so it handles both the initial load and future changes.
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth Event:', event) // e.g., 'SIGNED_IN', 'SIGNED_OUT'
    user.value = session?.user ?? null
})

const handleClickOutside = (event: MouseEvent) => {
    if (profileRef.value && !profileRef.value.contains(event.target as Node)) {
        showProfile.value = false
    }
}

onMounted(() => {
    window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    window.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.profile-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    padding: 12px;
    background-color: white;
    min-width: 150px;
    z-index: 1000;
    border: 1px solid #e2e8f0;
}

.profile-menu a,
.profile-menu button {
    padding: 8px 12px;
    border-radius: 6px;
    text-decoration: none;
    color: #475569;
    font-size: 14px;
    transition: all 0.2s;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
}

.profile-menu a:hover,
.profile-menu button:hover {
    background-color: #f1f5f9;
    color: #3b82f6;
}

.profile-info {
    position: relative;
    display: flex;
    align-items: center;
}

.profile-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid #3b82f6;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.profile-avatar:hover {
    transform: scale(1.1);
}

.profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>