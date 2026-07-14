<template>
    <v-card v-for="ph in data" :key="ph.id" class="mb-3" rounded="lg" flat style="border: 2px solid #B0BEC5">
        <v-card-item class="text-center">
            <v-card-title>
                <h5>{{ ph.dam_code }} Powerhouse</h5>
            </v-card-title>
        </v-card-item>

        <v-card-text>
            <v-row style="height: 400px;" class="d-flex align-center justify-center">
                <!-- LEFT: metrics -->
                <v-col cols="12" md="6">
                    <v-row dense>
                        <v-col v-for="metric in phMetrics(ph)" :key="metric.label" cols="6">
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
                    <v-img v-if="ph.img" :src="ph.img" max-height="260" rounded="lg" cover />
                    <!-- placeholder when no image -->
                    <div v-else class="img-placeholder rounded-lg d-flex flex-column align-center justify-center ga-2">
                        <v-icon size="48" color="amber-lighten-3">mdi-image-off-outline</v-icon>
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

const formatDate = (iso) => {
    const d = new Date(iso)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${dd}/${mm}/${yyyy}`
}
const phMetrics = (p) => [
    { label: 'engine_type', value: p.type_engine, unit: '' },
    { label: 'COD', value: formatDate(p.COD), unit: '' },
    { label: 'Power', value: p.power, unit: 'MW' },
    { label: 'Engines', value: p.number_engine, unit: '' },
    { label: 'Height', value: p.height, unit: 'm' },
    { label: 'Water usage', value: p.water_usage, unit: 'm³/s' },
    { label: 'Usage/day', value: p.water_usage_day, unit: 'MCM' },
    { label: 'Avg. energy/yr', value: p.power_everage_year, unit: 'GWh' },
    { label: 'Transformer 1', value: p.transformer1, unit: 'kV' },
    { label: 'Transformer 2', value: p.transformer2, unit: 'kV' },
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