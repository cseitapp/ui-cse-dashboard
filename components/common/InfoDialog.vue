<template>
  <v-dialog v-model="model" max-width="100%">
    <v-card rounded="lg">
      <v-card-title class="text-center"><h5>{{ title }}</h5></v-card-title>
      <v-divider />

      <v-card-text>
        <!-- Loading -->
        <div v-if="loading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Content -->
        <template v-else>
          <v-row >
            <!-- Loop each dam as its own col -->
            <v-col v-for="dam in damInfo" :key="dam.id" cols="12" md="6" lg="4">
              <DamCard :data="[dam]" />
            </v-col>

            <!-- Loop each powerhouse as its own col -->
            <v-col v-for="ph in powerhouse" :key="ph.id" cols="12" md="6" lg="4">
              <PowerhouseCard :data="[ph]" />
            </v-col>
          </v-row>
        </template>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import DamCard from '../dam/DamCard.vue'
import PowerhouseCard from '../dam/PowerhouseCard.vue'

const props = defineProps({
  modelValue: Boolean,
  title: String,
  damCode: String,   // ← receive dam_code as prop
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const damInfo = ref(null)
const powerhouse = ref(null)

// Fetch when dialog opens
watch(() => props.modelValue, async (opened) => {
  if (!opened || !props.damCode) return

  loading.value = true
  damInfo.value = null
  powerhouse.value = null

  try {
    const [damRes, phRes] = await Promise.all([
      axios.get('/api/dam', { params: { dam_code: props.damCode } }),
      axios.get('/api/powerhouse', { params: { dam_code: props.damCode } }),
    ])
    damInfo.value = damRes.data.data.data
    powerhouse.value = phRes.data.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>