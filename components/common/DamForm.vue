<template>
    <v-dialog v-model="model" max-width="700">
        <v-card :title="`${isEditing ? 'ແກ້ໄຂ' : 'ສ້າງ'} ຂໍ້ມູນເຂື່ອນ`" density="default" rounded="lg">
            <template #text>
                <v-row>
                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.height" variant="outlined" color="blue-grey-lighten-2" rounded="lg"
                            density="compact" label="ຄວາມສູງ" suffix="m" type="number" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.width" variant="outlined" color="blue-grey-lighten-2" rounded="lg"
                            density="compact" label="ຄວາມກ້ວາງ" suffix="m" type="number" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.area" label="ເນື້ອທີ່" suffix="km²" type="number" variant="outlined"
                            rounded="lg" color="blue-grey-lighten-2" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.area_water" label="ພື້ນທີ່ເກັບນ້ຳ" suffix="km²" type="number"
                            rounded="lg" variant="outlined" color="blue-grey-lighten-2" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.full_supply_level" label="Full supply level" suffix="m" rounded="lg"
                            variant="outlined" color="blue-grey-lighten-2" density="compact" type="number" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.full_reservoir_capacity" label="Full capacity" suffix="MCM"
                            rounded="lg" variant="outlined" color="blue-grey-lighten-2" density="compact"
                            type="number" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.minimum_operating_level" label="Min. operating level" suffix="m"
                            rounded="lg" variant="outlined" color="blue-grey-lighten-2" density="compact"
                            type="number" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.dead_water_storage" label="Dead storage" suffix="MCM" rounded="lg"
                            variant="outlined" color="blue-grey-lighten-2" density="compact" type="number" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.water_gate1" label="Water gate 1" type="number" variant="outlined"
                            rounded="lg" color="blue-grey-lighten-2" density="compact" />
                    </v-col>

                    <v-col cols="12" md="6">
                        <v-text-field v-model="form.water_gate2" label="Water gate 2" type="number" variant="outlined"
                            rounded="lg" color="blue-grey-lighten-2" density="compact" />
                    </v-col>
                    <v-col cols="12">
                        <v-file-upload v-model="form.files" clearable density="compact" title="ເພີ່ມຮູບພາບເຂື່ອນ"
                            variant="compact"></v-file-upload>
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
import moment from 'moment'
import { useAuthUser } from '~~/composables/useAuth'
const user = useAuthUser()
const emp = user.value.USER_NAME
const timestamp = moment().format("YYYYMMDDHHmmss")
const PATH = '/PR0009/DASHBOARD/DAM/' + emp + '/' + timestamp + '/'

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
    height: null,
    width: null,
    area: null,
    area_water: null,
    full_supply_level: null,
    full_reservoir_capacity: null,
    minimum_operating_level: null,
    dead_water_storage: null,
    water_gate1: null,
    water_gate2: null,
    files: null,
    path: PATH,
    img: null
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
            if (form.value.files) {
                const removeRes = await axios.post('/api/files/upload/remove', {
                    path: img
                })
                if (removeRes.data.ERROR_CODE === "00") {
                    const updateData = new FormData()
                    form.value.img = PATH
                    if (Array.isArray(form.value.files)) {
                        form.value.files.forEach(file => updateData.append('files[]', file))
                    } else {
                        updateData.append('files', form.value.files)
                    }
                    updateData.append('path', form.value.path)
                    const upDateRes = await axios.post('/api/files/upload', updateData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    })
                    if (upDateRes.data.ERROR_CODE === "00") {
                        // await axios.put(`/api/dam/${props.editData.id}`, form.value)
                    } else {
                        console.log("can not upload IMAGE")
                    }
                }
            } else {
                console.log("NO UPLOAD")
                // await axios.put(`/api/dam/${props.editData.id}`, form.value)
            }
        } else {
            const uploadData = new FormData()
            if (form.value.files) {
                // if multiple files
                if (Array.isArray(form.value.files)) {
                    form.value.files.forEach(file => uploadData.append('files[]', file))
                } else {
                    uploadData.append('files', form.value.files)
                }
            }
            uploadData.append('path', form.value.path)

            const uploadRes = await axios.post('/api/files/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            if (uploadRes.data.ERROR_CODE === "00") {
                // await axios.post('/api/dam', form.value)
            } else {
                console.log("can not upload IMAGE")
            }
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