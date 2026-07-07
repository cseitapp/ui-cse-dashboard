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
      style="height: 100vh; background: url('/assets/images/bg_new.jpg') no-repeat center center; background-size: cover;">
      <v-row align="center" justify="center">
        <v-col cols="10" sm="8" md="6" lg="3">
          <v-card class="rounded-xl" style="border-width: 2px; border-style: solid; border-color: white;" color="#474a4d96">
            <div class="d-flex justify-center">
              <v-img class="ms-10 mt-10 me-10 mb-3" aspect-ratio="16/9" cover src="/assets/images/logo-title.png" />
            </div>

            <v-card-title class=" d-flex justify-center">
              <h3 style="background: linear-gradient(90deg, #cb9b51 22%, #f6e27a 45%, #f6f2c0, #f6e27a 55%, #cb9b51 78%);
           -webkit-background-clip: text;
           -webkit-text-fill-color: transparent;
           background-clip: text;">
                ລະບົບ ພະລັງງານ ແລະ ນ້ຳ
              </h3>
            </v-card-title>

            <v-card-text>
              <v-form>
                <v-text-field v-model="username" variant="outlined" rounded="lg" class="text-white" label="ລະຫັດພະນັກງານ" type="text" color="white"
                  placeholder="ລະຫັດພະນັກງານ">
                  <!-- Replace the built-in prepend icon with custom Iconify -->
                  <template v-slot:prepend-inner>
                    <Icon icon="lucide:user" width="24" height="24" color="white" />
                  </template>
                </v-text-field>
                <v-text-field v-model="password" variant="outlined" rounded="lg" class="text-white" :type="showPassword ? 'text' : 'password'" color="white"
                  :append-inner-icon="!showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  @click:append-inner="showPassword = !showPassword" label="ລະຫັດຜ່ານ" placeholder="ກະລຸນາປ້ອນລະຫັດຜ່ານ"
                  @keyup.enter="handleLogin">
                  <!-- Replace the built-in prepend icon with custom Iconify -->
                  <template v-slot:prepend-inner>
                    <Icon icon="lucide:key-round" width="24" height="24" color="white" />
                  </template>
                </v-text-field>

                <v-alert v-if="errorMsg" type="error" dense class="mb-4">
                  {{ errorMsg }}
                </v-alert>
                <v-btn :loading="loading" :disabled="loading" color="white" block class="rounded-lg"
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
