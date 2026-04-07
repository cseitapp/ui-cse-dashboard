<script setup lang="ts">
definePageMeta({ layout: false })
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useLogin } from '~~/composables/useAuth'


const username = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  const res = await useLogin(username.value, password.value)
  if (res.success) {
    await navigateTo('/')
  } else {
    errorMsg.value = res.message
  }

  loading.value = false
}

</script>

<template>
  <v-layout>
    <v-container fluid class="d-flex align-center justify-center"
      style="height: 100vh; background: url('/assets/images/background.jpg') no-repeat center center; background-size: cover;">
      <v-row align="center" justify="center">
        <v-col cols="10" sm="8" md="6" lg="3">
          <v-card color="blue-darken-4 rounded-lg">
            <div class="d-flex justify-center">
              <v-img class="ma-6" aspect-ratio="16/9" cover src="/assets/images/logo-title.png" />
            </div>

            <v-card-title class=" d-flex justify-center">
              ລະບົບຈັດການພາຫະນະ
            </v-card-title>

            <v-card-text>
              <v-form>
                <v-text-field v-model="username" label="CSEXXX" type="text" placeholder="ລະຫັດພະນັກງານ">
                  <!-- Replace the built-in prepend icon with custom Iconify -->
                  <template v-slot:prepend-inner>
                    <Icon icon="lucide:user" width="24" height="24" />
                  </template>
                </v-text-field>
                <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="!showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword" label="ລະຫັດຜ່ານ" placeholder="ກະລຸນາປ້ອນລະຫັດຜ່ານ"
                  @keyup.enter="handleLogin">
                  <!-- Replace the built-in prepend icon with custom Iconify -->
                  <template v-slot:prepend-inner>
                    <Icon icon="lucide:key-round" width="24" height="24" />
                  </template>
                </v-text-field>

                <v-alert v-if="errorMsg" type="error" dense class="mb-4">
                  {{ errorMsg }}
                </v-alert>
                <v-btn :loading="loading" :disabled="loading" color="white" class="text-blue-darken-4" block
                  @click="handleLogin">
                  <Icon icon="lucide:log-in" width="24" height="24" class="mr-3" />
                  ເຂົ້າສູ່ລະບົບ
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-layout>

</template>
