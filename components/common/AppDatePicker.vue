<template>
    <v-menu v-model="menu" :close-on-content-click="false" location="bottom">
        <template #activator="{ props }">
            <v-text-field v-bind="props" :model-value="formattedDate" :label="label" :readonly="true" color="primary"
                prepend-inner-icon="mdi-calendar" variant="solo" density="comfortable" />
        </template>

        <v-date-picker v-model="selectedDate" color="primary" hide-header />
    </v-menu>
</template>

<script setup>
import { computed, ref,onMounted  } from 'vue'
import moment from 'moment';

const props = defineProps({
    modelValue: {
        type: String,
        default: null,
    },
    label: {
        type: String,
        default: 'Select Date',
    },
    type: {
        type: String,
        default: 'day'
    }
})

const emit = defineEmits(['update:modelValue'])

const menu = ref(false)
const selectedDate = computed({
    get: () => props.modelValue ?? moment().toDate(),
    set: (value) => {
        emit('update:modelValue', value)
        menu.value = false
    },
})

const formattedDate = computed(() => {
    if (!props.modelValue) return ''
    switch (props.type) {
        case 'Y':
            return moment(props.modelValue).format('YYYY')

        case 'M':
            return moment(props.modelValue).format('MM-YYYY')

        default:
            return moment(props.modelValue).format('YYYY-MM-DD')
    }
})

onMounted(() => {
    if (!props.modelValue) {
        emit('update:modelValue', moment().toDate())
    }
})
</script>