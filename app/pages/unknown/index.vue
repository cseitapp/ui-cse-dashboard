<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card
          class="pa-6 text-center"
          rounded="lg"
          variant="outlined"
          color="warning"
        >
          <v-avatar color="warning" size="72" class="mb-4">
            <v-icon icon="mdi-lock-outline" size="40" color="white" />
          </v-avatar>

          <h1>
            ຈຳກັດຂໍ້ມູນ
          </h1>

          <p>
           ຂໍອະໄພ ທ່ານບໍ່ມີສິດເຂົ້າເຖິງໜ້ານີ້. ກະລຸນາຕິດຕໍ່ທີມພັດທະນາໄອທີ ເພື່ອຂໍໃຫ້ເຂົ້າເຖິງຂໍ້ມູນ.
          </p>

          <v-btn
            color="warning"
            variant="tonal"
            block
            class="mt-2"
            prepend-icon="mdi-arrow-left"
            @click="goBack"
          >
            ກັບຄືນ
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
function goBack() {
  router.back()
}
</script>