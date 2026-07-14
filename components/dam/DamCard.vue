<template>
  <v-card
    v-for="dam in data"
    :key="dam.id"
    class="mb-3"
    rounded="lg"
    flat
    style="border: 1px solid #B0BEC5"
  >
    <v-card-item class="text-center">
      <v-card-title >
        <h6>{{ dam.dam_station }}</h6>
      </v-card-title>
    </v-card-item>


    <v-card-text>
      <v-row style="height: 400px;" class="d-flex align-center justify-center">
        <!-- LEFT: metrics -->
        <v-col cols="12" md="6">
          <v-row dense>
            <v-col v-for="metric in damMetrics(dam)" :key="metric.label" cols="6">
              <div class="metric-card pa-2 rounded">
                <h5 class="text-primary">{{ metric.label }}</h5>
                <v-divider class="py-1"></v-divider>
                <div>
                  {{ metric.value }} <span class="ml-1">{{ metric.unit }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-col>

        <!-- RIGHT: image -->
        <v-col cols="12" md="6" class="d-flex align-center justify-center">
          <v-img
            v-if="dam.img"
            :src="dam.img"
            max-height="260"
            rounded="lg"
            cover
          />
          <!-- placeholder when no image -->
          <div v-else class="img-placeholder rounded-lg d-flex flex-column align-center justify-center ga-2">
            <v-icon size="48" color="blue-lighten-3">mdi-image-off-outline</v-icon>
            <span class="text-caption text-medium-emphasis">No image available</span>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  data: { type: Array, default: () => [] }
})

const damMetrics = (d) => [
  { label: 'Height',          value: d.height,                  unit: 'm'   },
  { label: 'Width',           value: d.width,                   unit: 'm'   },
  { label: 'Area',            value: d.area,                    unit: 'km²' },
  { label: 'Water area',      value: d.area_water,              unit: 'km²' },
  { label: 'Full supply lvl', value: d.full_supply_level,       unit: 'm'   },
  { label: 'Full capacity',   value: d.full_reservoir_capacity, unit: 'MCM' },
  { label: 'Min. op. level',  value: d.minimum_operating_level, unit: 'm'   },
  { label: 'Dead storage',    value: d.dead_water_storage,      unit: 'MCM' },
  { label: 'Water gate 1',    value: d.water_gate1,             unit: ''    },
  { label: 'Water gate 2',    value: d.water_gate2,             unit: ''    },
]
</script>

<style scoped>
.metric-card {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.img-placeholder {
  width: 100%;
  height: 260px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
}
</style>