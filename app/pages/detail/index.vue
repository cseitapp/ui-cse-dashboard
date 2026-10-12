<template>
    <v-container fluid class="pa-2">
        <v-card elevation="0" rounded="lg">
            <v-row class="ma-0 ps-5" :align="'center'">
                <v-col>
                    <v-row :align="'center'">
                        <v-btn icon="mdi-arrow-left" variant="tonal" color="primary" @click="$router.back()" />
                        <v-col>
                            <v-row class="ma-0">
                                <div class="pr-3">
                                    <h3 class="font-weight-bold">{{ branchName }}</h3>
                                    <div>ລະຫັດເຂື່ອນ: {{ code }}</div>
                                </div>
                                <v-tooltip text="ຂໍ້ມູນທົ່ວໄປຂອງເຂື່ອນ">
                                    <template v-slot:activator="{ props }">
                                        <v-btn density="compact" v-bind="props" icon="mdi-information" variant="tonal"
                                            color="primary" @click="dialog = true" />
                                    </template>
                                </v-tooltip>
                            </v-row>

                        </v-col>
                        <!-- <v-col></v-col> -->
                    </v-row>
                </v-col>
                <v-col v-if="mobile" class="text-end" cols="6" md="8" lg="6">
                    <v-btn color="primary" variant="tonal" prepend-icon="mdi-filter" @click="showFilter = true">
                        ຄົ້ນຫາຂໍ້ມູນ
                    </v-btn>
                </v-col>
                <v-dialog v-model="showFilter" max-width="600">
                    <v-card rounded="lg">
                        <v-card-title>ຄົ້ນຫາຂໍ້ມູນ</v-card-title>

                        <v-card-text>
                            <v-row :align="'center'">
                                <v-col cols="12" lg="4">
                                    <v-btn-toggle v-model="activeType" mandatory variant="outlined" color="primary"
                                        density="comfortable" @update:modelValue="onTypeChange">
                                        <v-btn value="Y">ປີ</v-btn>
                                        <v-btn value="M">ເດືອນ</v-btn>
                                        <v-btn value="W">ອາທິດ</v-btn>
                                        <v-btn value="D">ວັນ</v-btn>
                                        <!-- <v-btn value="H">ຊົ່ວໂມງ</v-btn> -->
                                    </v-btn-toggle>
                                </v-col>
                                <v-col v-for="picker in datePickers" :key="picker.label" cols="12" lg="3">
                                    <v-menu v-model="picker.menu.value" :close-on-content-click="false"
                                        transition="scale-transition" offset-y min-width="auto">
                                        <template #activator="{ props }">
                                            <v-text-field color="primary" v-bind="props" hide-details
                                                :model-value="formatPickerDisplay(picker.date.value, activeType)"
                                                :label="picker.label" variant="outlined" density="compact"
                                                prepend-inner-icon="mdi-calendar" readonly />
                                        </template>
                                        <!-- REPLACE your v-date-picker with this -->
                                        <template v-if="activeType === 'W' || activeType === 'D' || activeType === 'H'">
                                            <v-date-picker :key="`${picker.label}-${activeType}`" hide-header
                                                :show-week="activeType === 'W'" view-mode="month"
                                                v-model="picker.picker.value"
                                                @update:model-value="(val) => onDateSelected(val, picker)" />
                                        </template>

                                        <!-- YEAR custom selector -->
                                        <template v-else-if="activeType === 'Y'">
                                            <v-card max-width="200" class="pa-4">
                                                <v-row dense>
                                                    <v-col v-for="y in yearList" :key="y" cols="12" md="12"
                                                        class="text-center">
                                                        <v-btn :variant="selectedYear(picker) === y ? 'flat' : 'text'"
                                                            :color="selectedYear(picker) === y ? 'primary' : ''"
                                                            size="small" block @click="onYearPicked(y, picker)">
                                                            {{ y }}
                                                        </v-btn>
                                                    </v-col>
                                                </v-row>
                                                <!-- Prev / Next decade navigation -->
                                                <div class="d-flex justify-space-between mt-3">
                                                    <v-btn size="small" variant="text" @click="yearOffset -= 12">‹
                                                        ກ່ອນ</v-btn>
                                                    <v-btn size="small" variant="text" @click="yearOffset += 12">ຕໍ່ໄປ
                                                        ›</v-btn>
                                                </div>
                                            </v-card>
                                        </template>

                                        <!-- MONTH custom selector -->
                                        <template v-else-if="activeType === 'M'">
                                            <v-card max-width="150" class="pa-4">
                                                <!-- Year row inside month picker -->
                                                <div class="d-flex align-center justify-space-between mb-3">
                                                    <v-btn size="small" variant="text" icon @click="monthPickerYear--">
                                                        <v-icon>mdi-chevron-left</v-icon>
                                                    </v-btn>
                                                    <span class="font-weight-bold">{{ monthPickerYear }}</span>
                                                    <v-btn size="small" variant="text" icon @click="monthPickerYear++">
                                                        <v-icon>mdi-chevron-right</v-icon>
                                                    </v-btn>
                                                </div>
                                                <v-row dense>
                                                    <v-col v-for="(m, i) in monthNames" :key="i" cols="12"
                                                        class="text-center">
                                                        <v-btn
                                                            :variant="selectedMonth(picker) === i && selectedMonthYear(picker) === monthPickerYear ? 'flat' : 'text'"
                                                            :color="selectedMonth(picker) === i && selectedMonthYear(picker) === monthPickerYear ? 'primary' : ''"
                                                            size="small" block @click="onMonthPicked(i, picker)">
                                                            {{ m }}
                                                        </v-btn>
                                                    </v-col>
                                                </v-row>
                                            </v-card>
                                        </template>

                                    </v-menu>
                                </v-col>
                                <v-col>
                                    <v-btn color="primary" variant="outlined" prepend-icon="mdi-magnify"
                                        @click="onSearch">ຄົ້ນຫາ</v-btn>
                                </v-col>
                            </v-row>
                        </v-card-text>

                        <v-card-actions>
                            <v-spacer />

                            <v-btn variant="text" @click="showFilter = false">
                                ປິດ
                            </v-btn>
                        </v-card-actions>
                    </v-card>
                </v-dialog>

                <v-col cols="12" md="10" lg="9" v-if="!mobile">
                    <v-row :align="'center'">
                        <v-col cols="12" lg="6" class="text-end">
                            <v-btn-toggle v-model="activeType" mandatory variant="outlined" color="primary"
                                density="comfortable" @update:modelValue="onTypeChange">
                                <v-btn value="Y">ປີ</v-btn>
                                <v-btn value="M">ເດືອນ</v-btn>
                                <v-btn value="W">ອາທິດ</v-btn>
                                <v-btn value="D">ວັນ</v-btn>
                                <!-- <v-btn value="H">ຊົ່ວໂມງ</v-btn> -->
                            </v-btn-toggle>
                        </v-col>
                        <v-col v-for="picker in datePickers" :key="picker.label" cols="12" lg="2">
                            <v-menu v-model="picker.menu.value" :close-on-content-click="false"
                                transition="scale-transition" offset-y min-width="auto">
                                <template #activator="{ props }">
                                    <v-text-field color="primary" v-bind="props" hide-details
                                        :model-value="formatPickerDisplay(picker.date.value, activeType)"
                                        :label="picker.label" variant="outlined" density="compact"
                                        prepend-inner-icon="mdi-calendar" readonly />
                                </template>
                                <!-- REPLACE your v-date-picker with this -->
                                <template v-if="activeType === 'W' || activeType === 'D' || activeType === 'H'">
                                    <v-date-picker :key="`${picker.label}-${activeType}`" hide-header
                                        :show-week="activeType === 'W'" view-mode="month" v-model="picker.picker.value"
                                        @update:model-value="(val) => onDateSelected(val, picker)" />
                                </template>

                                <!-- YEAR custom selector -->
                                <template v-else-if="activeType === 'Y'">
                                    <v-card max-width="200" class="pa-4">
                                        <v-row dense>
                                            <v-col v-for="y in yearList" :key="y" cols="12" md="12" class="text-center">
                                                <v-btn :variant="selectedYear(picker) === y ? 'flat' : 'text'"
                                                    :color="selectedYear(picker) === y ? 'primary' : ''" size="small"
                                                    block @click="onYearPicked(y, picker)">
                                                    {{ y }}
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                        <!-- Prev / Next decade navigation -->
                                        <div class="d-flex justify-space-between mt-3">
                                            <v-btn size="small" variant="text" @click="yearOffset -= 5">‹ ກ່ອນ</v-btn>
                                            <v-btn size="small" variant="text" @click="yearOffset += 5">ຕໍ່ໄປ ›</v-btn>
                                        </div>
                                    </v-card>
                                </template>

                                <!-- MONTH custom selector -->
                                <template v-else-if="activeType === 'M'">
                                    <v-card max-width="150" class="pa-4">
                                        <!-- Year row inside month picker -->
                                        <div class="d-flex align-center justify-space-between mb-3">
                                            <v-btn size="small" variant="text" icon @click="monthPickerYear--">
                                                <v-icon>mdi-chevron-left</v-icon>
                                            </v-btn>
                                            <span class="font-weight-bold">{{ monthPickerYear }}</span>
                                            <v-btn size="small" variant="text" icon @click="monthPickerYear++">
                                                <v-icon>mdi-chevron-right</v-icon>
                                            </v-btn>
                                        </div>
                                        <v-row dense>
                                            <v-col v-for="(m, i) in monthNames" :key="i" cols="12" class="text-center">
                                                <v-btn
                                                    :variant="selectedMonth(picker) === i && selectedMonthYear(picker) === monthPickerYear ? 'flat' : 'text'"
                                                    :color="selectedMonth(picker) === i && selectedMonthYear(picker) === monthPickerYear ? 'primary' : ''"
                                                    size="small" block @click="onMonthPicked(i, picker)">
                                                    {{ m }}
                                                </v-btn>
                                            </v-col>
                                        </v-row>
                                    </v-card>
                                </template>

                            </v-menu>
                        </v-col>
                        <v-col>
                            <v-btn variant="outlined" color="primary" prepend-icon="mdi-magnify"
                                @click="onSearch">ຄົ້ນຫາ</v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

        </v-card>

        <InfoDialog v-model="dialog" title="ຂໍ້ມູນທົ່ວໄປຂອງເຂື່ອນ" :dam-code="code">
            <!-- receive data via slot props -->

            <!-- override footer buttons if needed -->
            <template #actions>
                <v-btn variant="text" @click="dialog = false">ປິດ</v-btn>
            </template>
        </InfoDialog>
        <h3 class="my-3">I. ການຜະລິດ ແລະ ລາຍຮັບ</h3>
        <v-row>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4" style="height: 450px">
                    <BarChart title="ພະລັງງານ (GWh)" unit="GWh" :labels="labels" :series="energySeries" />
                </v-card>
            </v-col>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4" style="height: 450px">
                    <BarChart title="ລາຍຮັບ (MUSD)" unit="MUSD" :labels="labels" :series="revenueSeries" />
                </v-card>
            </v-col>
        </v-row>
        <h3 class=" my-3">II. ການບໍລິຫານຈັດການນ້ຳ</h3>
        <v-row>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4" style="height: 450px">
                    <BarChart title="ປະລິມານນ້ຳເຂົ້າ (MCM)" unit="MCM" :labels="labels" :series="inflowSeries" />
                </v-card>
            </v-col>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4" style="height: 450px">
                    <Basiclinechart :data="allData" title="ປະລິມານນ້ຳເຂົ້າ ແລະ ປະລິມານນ້ຳອອກ (MCM)"
                        x-field="PERIOD_LABEL" :series="[
                            { field: 'SUM_INFLOW_ACTUAL', label: 'ປະລິມານນ້ຳເຂົ້າ' },
                            { field: 'SUM_OUTFLOW', label: 'ປະລິມານນ້ຳອອກ' }
                        ]" />
                </v-card>
            </v-col>
            <v-col cols="12" sm="12" md="12" lg="12">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4" style="height: 450px">

                    <v-tabs v-model="activeTab" color="primary" align-tabs="end">
                        <v-tab value="all">ທັງໝົດ</v-tab>
                        <v-tab value="main">ເຂື່ອນຫຼັກ</v-tab>
                        <v-tab value="diversion">ເຂື່ອນອ່ວຍນ້ຳ</v-tab>
                    </v-tabs>

                    <Basiclinechart :data="water_data" title="ລະດັບນ້ຳຂອງເຂື່ອນ (MASL)" x-field="D_DATE"
                        :series="chartSeries" />
                </v-card>
            </v-col>
            <v-col cols="12" sm="12" md="12" lg="12">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4" style="height: 450px">
                    <v-tabs v-model="volumeTab" color="primary" align-tabs="end">
                        <v-tab value="all">ທັງໝົດ</v-tab>
                        <v-tab value="main">ເຂື່ອນຫຼັກ</v-tab>
                        <v-tab value="diversion">ເຂື່ອນອ່ວຍນ້ຳ</v-tab>
                    </v-tabs>
                    <Basiclinechart :data="water_data" title="ບໍລິມາດນ້ຳທັງໝົດຂອງເຂື່ອນ (MCM)" x-field="D_DATE"
                        :series="volumeSeries" />
                </v-card>
            </v-col>
        </v-row>


    </v-container>
</template>

<script setup>
import axios from 'axios'
import moment from 'moment'
import InfoDialog from '~~/components/common/InfoDialog.vue'
import { useDisplay } from 'vuetify'
import EChart from '~~/components/common/EChart.vue'
import BarChart from '~~/components/common/BarChart.vue'
import Basiclinechart from '~~/components/common/Basiclinechart.vue'

const labels = computed(() => allData.value.map((r) => r.PERIOD_LABEL));

const energySeries = computed(() => [
    { name: "ແຜນ", data: allData.value.map((r) => r.SUM_PLAN_ENERGY), color: "#90a4ae" },
    { name: "ຕົວຈິງ", data: allData.value.map((r) => r.SUM_ACTUAL_ENERGY), color: "#1976d2" },
]);

const revenueSeries = computed(() => [
    { name: "ແຜນ", data: allData.value.map((r) => r.SUM_PLAN_REVENUE), color: "#a5d6a7" },
    { name: "ຕົວຈິງ", data: allData.value.map((r) => r.SUM_ACTUAL_REVENUE), color: "#2e7d32" },
]);

const inflowSeries = computed(() => [
    { name: "ແຜນນ້ຳເຂົ້າ", data: allData.value.map((r) => r.SUM_INFLOW_PLAN), color: "#4dd0e6" },
    { name: "ຕົວຈິງນ້ຳເຂົ້າ", data: allData.value.map((r) => r.SUM_INFLOW_ACTUAL), color: "#4dd0c2" },
]);
// const inflowOutFlowSeries = computed(() => [
//     { name: "ຕົວຈິງນ້ຳເຂົ້າ", data: allData.value.map((r) => r.SUM_INFLOW_ACTUAL), color: "#4dd0e6" },
//     { name: "ຕົວຈິງນ້ຳອອກ", data: allData.value.map((r) => r.SUM_OUTFLOW), color: "#a5d6a7" },
// ]);
// ─── Route ───────────────────────────────────────────────
const route = useRoute()
const dialog = ref(false)


const { mobile } = useDisplay()
const showFilter = ref(false)

const item = JSON.parse(route.query.item);
const code = item.D_DAM
const loading = ref(false)
const branchName = item.branch.BR_NAME
definePageMeta({
    middleware: "auth",
    layout: "default",
});

const colProps = computed(() => {
    if (['Y', 'M'].includes(activeType.value)) {
        return { cols: 12, sm: 12, md: 12, lg: 6 } // Y/M layout
    }
    return { cols: 12, sm: 12, md: 12, lg: 6 } // W/D/H layout (same pattern for all three)
})

const activeTab = ref('all')

const seriesByTab = {
    all: [
        { field: 'D_MAIN', label: 'ເຂື່ອນຫຼັກ', markPoint: true },
        { field: 'D_DIVERSION', label: 'ເຂື່ອນອ່ວຍນ້ຳ', markPoint: true },
        { field: 'D_PLAN_WL', label: 'ອ່າງເກັບນ້ຳ', color: '#82B383', markPoint: true },
        { field: 'HIGH_WATER_LEVEL', label: 'ສູງສຸດ (ເຂື່ອນຫຼັກ)', color: '#ee6666' },
        { field: 'LOW_WATER_LEVEL', label: 'ຕ່ຳສຸດ (ເຂື່ອນຫຼັກ)', color: '#fac858' },
        { field: 'HIGH_WATER_LEVEL_DIVERSION', label: 'ສູງສຸດ (ອ່ວຍນ້ຳ)', color: '#ee6666' },
        { field: 'LOW_WATER_LEVEL_DIVERSION', label: 'ຕ່ຳສຸດ (ອ່ວຍນ້ຳ)', color: '#fac858' }
    ],
    main: [
        { field: 'D_MAIN', label: 'ເຂື່ອນຫຼັກ', markPoint: true },
        { field: 'D_PLAN_WL', label: 'ອ່າງເກັບນ້ຳ', color: '#82B383', markPoint: true },
        { field: 'HIGH_WATER_LEVEL', label: 'ສູງສຸດ (ເຂື່ອນຫຼັກ)', color: '#ee6666' },
        { field: 'LOW_WATER_LEVEL', label: 'ຕ່ຳສຸດ (ເຂື່ອນຫຼັກ)', color: '#fac858' }
    ],
    diversion: [
        { field: 'D_DIVERSION', label: 'ເຂື່ອນອ່ວຍນ້ຳ', markPoint: true },
        { field: 'D_PLAN_WL', label: 'ອ່າງເກັບນ້ຳ', color: '#82B383', markPoint: true },
        { field: 'HIGH_WATER_LEVEL_DIVERSION', label: 'ສູງສຸດ (ອ່ວຍນ້ຳ)', color: '#ee6666' },
        { field: 'LOW_WATER_LEVEL_DIVERSION', label: 'ຕ່ຳສຸດ (ອ່ວຍນ້ຳ)', color: '#fac858' }
    ]
}

const chartSeries = computed(() => seriesByTab[activeTab.value])

const volumeTab = ref('all')

const volumeSeriesByTab = {
    all: [
        { field: 'D_MAIN_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນຫຼັກທັງໝົດ', color: '#1E40AF', markPoint: true },
        { field: 'D_MAIN_USE_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນຫຼັກທີ່ນຳໃຊ້ໄດ້', color: '#60A5FA', markPoint: true },
        { field: 'D_DIVERSION_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນອ່ວາຍນ້ຳທັງໝົດ', color: '#166534', markPoint: true },
        { field: 'D_DIVERSION_USE_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນອ່ວາຍນ້ຳທີ່ນຳໃຊ້ໄດ້', color: '#4ADE80', markPoint: true }
    ],
    main: [
        { field: 'D_MAIN_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນຫຼັກທັງໝົດ', color: '#1E40AF', markPoint: true },
        { field: 'D_MAIN_USE_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນຫຼັກທີ່ນຳໃຊ້ໄດ້', color: '#60A5FA', markPoint: true }
    ],
    diversion: [
        { field: 'D_DIVERSION_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນອ່ວາຍນ້ຳທັງໝົດ', color: '#166534', markPoint: true },
        { field: 'D_DIVERSION_USE_VOLUME', label: 'ບໍລິມາດນ້ຳເຂື່ອນອ່ວາຍນ້ຳທີ່ນຳໃຊ້ໄດ້', color: '#4ADE80', markPoint: true }
    ]
}

const volumeSeries = computed(() => volumeSeriesByTab[volumeTab.value])

// ─── Date Pickers ─────────────────────────────────────────
const createDatePicker = (label, initial) => ({
    label,
    date: ref(initial),
    picker: ref(null),
    menu: ref(false),
});

const startPicker = createDatePicker("ວັນທີ່ເລີ່ມ", "");
const endPicker = createDatePicker("ວັນທີ່ສິ້ນສຸດ", "");
const datePickers = [startPicker, endPicker];

const DISPLAY_FORMATS = {
    Y: 'YYYY',
    M: 'MM/YYYY',
    W: 'DD/MM/YYYY',
    D: 'DD/MM/YYYY',
    H: 'DD/MM/YYYY'
}
const yearOffset = ref(0)
const currentYear = new Date().getFullYear()
const yearList = computed(() => {
    const base = currentYear + yearOffset.value
    return Array.from({ length: 5 }, (_, i) => base - 1 + i)
})
const selectedYear = (picker) => {
    if (!picker.date.value) return null
    return moment(picker.date.value).year()
}

const monthPickerYear = ref(currentYear)
const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const selectedMonth = (picker) => {
    if (!picker.date.value) return null
    return moment(picker.date.value).month()
}
const selectedMonthYear = (picker) => {
    if (!picker.date.value) return null
    return moment(picker.date.value).year()
}

const onYearPicked = (year, picker) => {
    const isEnd = picker === endPicker
    const m = moment().year(year)
    picker.date.value = (isEnd ? m.endOf('year') : m.startOf('year')).format('YYYY-MM-DD')
    picker.picker.value = moment(picker.date.value).toDate()
    picker.menu.value = false
    onSearch()
}

const onMonthPicked = (month, picker) => {
    const isEnd = picker === endPicker
    const m = moment().year(monthPickerYear.value).month(month)
    picker.date.value = (isEnd ? m.endOf('month') : m.startOf('month')).format('YYYY-MM-DD')
    picker.picker.value = moment(picker.date.value).toDate()
    picker.menu.value = false
    onSearch()
}

const onDateSelected = (val, picker) => {
    const isEnd = picker === endPicker
    picker.date.value = normalizePickerDate(val, activeType.value, isEnd)
    picker.picker.value = moment(picker.date.value).toDate()
    picker.menu.value = false
    onSearch()
}

const formatPickerDisplay = (dateStr, type) => {
    if (!dateStr) return ''
    return moment(dateStr).format(DISPLAY_FORMATS[type] || 'DD/MM/YYYY')
}

const getYearWeek = (dateStr) => {
    if (!dateStr) return ''
    const m = moment(dateStr)
    return `${m.isoWeekYear()}${String(m.isoWeek()).padStart(2, '0')}`
}

const withTypeParams = (params) => {
    if (activeType.value !== 'W') return params
    return {
        ...params,
        yearweek_start: getYearWeek(startPicker.date.value),
        yearweek_end: getYearWeek(endPicker.date.value),
    }
}

const normalizePickerDate = (val, type, isEnd) => {
    const m = moment(val)
    switch (type) {
        case 'Y':
            return (isEnd ? m.endOf('year') : m.startOf('year')).format('YYYY-MM-DD')
        case 'M':
            return (isEnd ? m.endOf('month') : m.startOf('month')).format('YYYY-MM-DD')
        case 'W':
            return (isEnd ? m.endOf('week') : m.startOf('week')).format('YYYY-MM-DD')
        default:
            return m.format('YYYY-MM-DD')
    }
}

const onSearch = () => {

    loadAlldata()
    loadWaterData()
}
const activeType = ref('D')
const onTypeChange = (type) => {
    const { start_date, end_date } = setDateRange(moment(), type)

    // Update display values (string format for text-field)
    datePickers[0].date.value = start_date
    datePickers[1].date.value = end_date

    // Update calendar picker values (Date object for v-date-picker)
    datePickers[0].picker.value = moment(start_date).toDate()
    datePickers[1].picker.value = moment(end_date).toDate()

    onSearch()
}
const allData = ref([])
const loadAlldata = async () => {
    const res = await axios.get("/api/data/period", {
        params: withTypeParams({
            start: startPicker.date.value,
            end: endPicker.date.value,
            code: code,
            type: activeType.value,
        }),
    });
    allData.value = res.data.data;
    // console.log("allData", allData.value)
}

const water_data = ref([])

const loadWaterData = async () => {
    const res = await axios.get("/api/data/dam", {
        params: withTypeParams({
            start: startPicker.date.value,
            end: endPicker.date.value,
            code: code
        }),
    });
    water_data.value = res.data.data;
    // console.log("water", water_data.value)
}

const setDateRange = (date, type) => {
    switch (type) {
        case 'Y':
            return {
                start_date: moment(date).startOf('year').format('YYYY-MM-DD'),
                end_date: moment(date).endOf('year').format('YYYY-MM-DD'),
            }
        case 'M':
            return {
                start_date: moment(date).startOf('year').format('YYYY-MM-DD'),
                end_date: moment(date).endOf('year').format('YYYY-MM-DD'),
            }
        case 'W':
            return {
                start_date: moment(date).startOf('month').format('YYYY-MM-DD'),
                end_date: moment(date).endOf('month').format('YYYY-MM-DD'),
            }
        case 'D':
            // Default "D" now represents the current month range
            return {
                start_date: moment(date).startOf('month').format('YYYY-MM-DD'),
                end_date: moment(date).endOf('month').format('YYYY-MM-DD'),
            }
        case 'H':
            return {
                start_date: moment(date).format('YYYY-MM-DD'),
                end_date: moment(date).format('YYYY-MM-DD'),
            }
        default:
            return {
                start_date: moment(date).format('YYYY-MM-DD'),
                end_date: moment(date).format('YYYY-MM-DD'),
            }
    }
}

// ─── Init ─────────────────────────────────────────────────
onMounted(() => {
    onTypeChange(activeType.value)
    loadAlldata()
    loadWaterData()
})
</script>