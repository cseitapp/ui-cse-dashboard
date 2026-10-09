<template>
    <v-dialog v-model="model" max-width="700">
        <v-card :title="`${isEditing ? 'ແກ້ໄຂ' : 'ສ້າງ'} ຂໍ້ມູນເຮືອນຈັກ`" density="default" rounded="lg">
            <template #text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.COD" label="COD" variant="outlined" rounded="lg"
                            density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.power" label="Power" suffix="kWh" type="number" variant="outlined"
                            rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.type_engine" label="Type Engine" variant="outlined" rounded="lg"
                            density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.number_engine" label="Number Engine" type="number"
                            variant="outlined" rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.height" label="Height" suffix="m" type="number" variant="outlined"
                            rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.water_usage" label="Water Usage" suffix="m³/s" type="number"
                            variant="outlined" rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.water_usage_day" label="Water Usage / Day" suffix="m³" type="number"
                            variant="outlined" rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.power_everage_year" label="Power Average Year" suffix="GWh"
                            type="number" variant="outlined" rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.transformer1" label="Transformer 1" type="number" variant="outlined"
                            rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.transformer2" label="Transformer 2" type="number" variant="outlined"
                            rounded="lg" density="compact" />
                    </v-col>

                    <v-col cols="12">
                        <v-file-upload clearable density="compact" title="Upload Powerhouse Image" variant="compact" />
                    </v-col>
                </v-row>
            </template>

            <v-divider />

            <v-card-actions class="bg-surface-light">
                <v-btn text="ປິດ" variant="plain" @click="model = false" />
                <v-spacer />
                <v-btn :text="isEditing ? 'ແກ້ໄຂ' : 'ບັນທຶກ'" :loading="loading" color="primary" variant="tonal"
                    @click="save" />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'

const props = defineProps({
    modelValue: Boolean,
    editData: { type: Object, default: null },  // null = create, object = edit
})

const emit = defineEmits(['update:modelValue', 'saved'])

const model = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const isEditing = computed(() => !!props.editData)

const defaultForm = {
    COD: null,
    power: null,
    type_engine: '',
    number_engine: null,
    height: null,
    water_usage: null,
    water_usage_day: null,
    power_everage_year: null,
    transformer1: null,
    transformer2: null,
    dam_code: null,
    img: null,
}

const form = ref({ ...defaultForm })
const loading = ref(false)

// Populate form when editing
watch(() => props.editData, (data) => {
    form.value = data ? { ...data } : { ...defaultForm }
}, { immediate: true })

const save = async () => {
    loading.value = true
    try {
        if (isEditing.value) {
            await axios.put(`/api/dam/powerhouse/${props.editData.id}`, form.value)
        } else {
            await axios.post('/api/dam/powerhouse', form.value)
        }
        emit('saved')       // notify parent to refresh list
        model.value = false
    } catch (err) {
        console.error(err)
    } finally {
        loading.value = false
    }
}
</script>