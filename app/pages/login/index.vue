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
    <v-container fluid class="login-page d-flex align-center justify-center">
      <v-row align="center" justify="center">
        <v-col cols="10" sm="8" md="6" lg="3">
          <v-card class="login-card rounded-xl">
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

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  background-image:
    linear-gradient(120deg, rgba(0, 55, 86, .30), rgba(0, 116, 133, .08) 52%, rgba(31, 105, 49, .16)),
    url('/assets/images/signin-energy-future.jpg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.login-card {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .72);
  background: linear-gradient(145deg, rgba(12, 49, 66, .83), rgba(18, 73, 75, .72)) !important;
  box-shadow: 0 24px 70px rgba(1, 38, 55, .34) !important;
  backdrop-filter: blur(13px);
  -webkit-backdrop-filter: blur(13px);
}

@media (max-width: 600px) {
  .login-page {
    padding: 18px 6px;
    background-position: 54% center;
  }

  .login-card {
    background: linear-gradient(145deg, rgba(8, 43, 61, .88), rgba(14, 69, 70, .80)) !important;
  }
}
</style>
