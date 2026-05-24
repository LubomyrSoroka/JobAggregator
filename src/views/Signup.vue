<template>
    <div class="sign-up">
        <h1>Job Aggregator</h1>
        <h3>All your jobs in one place</h3>
        <div class="input-group">
            <div v-if="emailError" class="error">
                {{ emailError }}
            </div>
            <input placeholder="Email" type="email" v-model="email">
        </div>
        <div class="input-group">
            <div v-if="passwordError" class="error">
                {{ passwordError }}
            </div>
            <input placeholder="Password" type="password" v-model="password">
        </div>
        <button @click="login">Login</button>
        <button @click="signup">Sign Up</button>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { supabase } from '../../utils/supabase'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')

const signup = async () => {
    const emailTest = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/

    if (!emailTest.test(email.value)) {
        emailError.value = "*Invalid email"
        return
    }

    if (password.value.length < 6) {
        passwordError.value = "*Password must be at least 6 characters long"
        return
    }

    const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
    })

    if (error) {
        console.error(error)
    }

    if (data) {
        console.log(data)
    }
}

const login = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
    })

    if (error) {
        console.error(error)
    }

    if (data) {
        console.log(data)
    }
}
</script>

<style scoped>
.sign-up {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    align-items: center;
}

.error {
    font-size: small;
    color: red;
}
</style>