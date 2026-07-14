<template>
    <v-container fluid class="pa-2">
        <v-card elevation="0" rounded="lg" >
            <v-row class="ma-0 ps-5" :align="'center'">
                <v-col>
                    <v-row :align="'center'">
                        <v-btn icon="mdi-arrow-left" variant="tonal" color="primary" @click="$router.back()" />
                        <v-col>
                            <v-row class="ma-0">
                                <div class="pr-3">
                                    <h3 class="font-weight-bold">{{ branchName }}</h3>
                                    <div>ID: {{ code }}</div>
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
                                        <v-btn value="H">ຊົ່ວໂມງ</v-btn>
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
                                    <v-btn color="primary" variant="outlined" prepend-icon="mdi-magnify" @click="onSearch">ຄົ້ນຫາ</v-btn>
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
                                <v-btn value="H">ຊົ່ວໂມງ</v-btn>
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
                                            <v-btn size="small" variant="text" @click="yearOffset -= 12">‹ ກ່ອນ</v-btn>
                                            <v-btn size="small" variant="text" @click="yearOffset += 12">ຕໍ່ໄປ ›</v-btn>
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
                            <v-btn variant="outlined" color="primary" prepend-icon="mdi-magnify" @click="onSearch">ຄົ້ນຫາ</v-btn>
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
                <v-card rounded="lg" elevation="0" class="border-sm pa-4"  style="height: 450px">
                    <EnergyLineChart :allData="allData" title="ພະລັງງານ " :activeType="activeType" />
                </v-card>
            </v-col>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4"  style="height: 450px">
                    <EnergyLineChart :allData="COST" :fields="['total_cost']" yAxisLabel="ໂດລ້າ"
                        :fieldLabels="{ total_cost: 'ມູນຄ່າລາຍຮັບ' }" :colors="{ total_cost: '#FFD700' }"
                        title="ລາຍຮັບ " />
                </v-card>
            </v-col>
        </v-row>
        <h3 class=" my-3">II. ການບໍລິຫານຈັດການນ້ຳ</h3>
        <v-row>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0"  class="border-sm pa-4" style="height: 450px">
                    <EnergyLineChart title="ປະລິມານນ້ຳຝົນ (ຖ້າຂໍ້ມູນ)" />
                </v-card>
            </v-col>
            <v-col v-bind="colProps">
                <v-card rounded="lg" elevation="0"  class="border-sm pa-4" style="height: 450px">
                    <EnergyLineChart :allData="water_data" :fields="['total_inflow', 'total_outflow']" yAxisLabel="MCM"
                        :fieldLabels="{ total_inflow: 'ນ້ຳເຂົ້າ', total_outflow: 'ນ້ຳອອກ' }"
                        title="ບໍລິມາດນ້ຳເຂົ້າອ່າງ/ບໍລິມາດນ້ຳອອກ" />
                    <!-- <EChart :data="water_data" title="ລະດັບນ້ຳ" x-field="period" data-field="total_inflow"
                        plan-field="total_outflow" data-label="ນ້ຳເຂົ້າ" plan-label="ນ້ຳອອກ" /> -->
                </v-card>
            </v-col>
            <!-- <v-col cols="12" sm="12" md="12" lg="12">
                <v-card rounded="lg" elevation="0" class="border-sm pa-4"  style="height: 450px">
                    <LineCompareChart :allData="water_level" title="ລະດັບນ້ຳ" dataField="Main_dam"
                        planField="diversion_dam" dataLabel="ເຂື່ອນຫຼັກ" planLabel="ເຂື່ອນອ່ວຍນ້ຳ" />
                </v-card>
            </v-col> -->
            <v-col cols="12" sm="12" md="12" lg="12">
                <v-card rounded="lg" elevation="0"  class="border-sm pa-4" style="height: 450px">
                    <EChart :data="water_level" title="ລະດັບນ້ຳ" x-field="datetime" data-field="Main_dam"
                        plan-field="diversion_dam" data-label="ເຂື່ອນຫຼັກ" plan-label="ເຂື່ອນອ່ວຍນ້ຳ" />
                </v-card>

            </v-col>
        </v-row>


    </v-container>
</template>

<script setup>
import axios from 'axios'
import moment from 'moment'
import EnergyLineChart from '~~/components/common/EnergyLineChart.vue'
import InfoDialog from '~~/components/common/InfoDialog.vue'
import LineCompareChart from '~~/components/common/LineCompareChart.vue'
import { useDisplay } from 'vuetify'
import EChart from '~~/components/common/EChart.vue'


// ─── Route ───────────────────────────────────────────────
const route = useRoute()
const dialog = ref(false)


const { mobile } = useDisplay()
const showFilter = ref(false)

const code = route.params.CODE
const loading = ref(false)
const branchName = decodeURIComponent(route.query.name || code)
const summary = ref([])
definePageMeta({
    middleware: "auth",
    layout: "default",
});

const colProps = computed(() => {
    if (['Y', 'M'].includes(activeType.value)) {
        return { cols: 6, sm: 6, md: 6, lg: 6 } // Y/M layout
    }
    return { cols: 12, sm: 12, md: 12, lg: 6 } // W/D/H layout (same pattern for all three)
})

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
    loadSummary()
    loadAlldata()
    loadWaterLevel()
    loadCost()
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
    const res = await axios.get("/api/energy/detail", {
        params: withTypeParams({
            start: startPicker.date.value,
            end: endPicker.date.value,
            code: code,
            type: activeType.value,
        }),
    });
    allData.value = res.data.data;
    // console.log(allData.value)
}
const COST = ref([])

const loadCost = async () => {
    loading.value = true;
    try {
        const res = await axios.get("/api/cost/summary", {
            params: withTypeParams({
                start_date: startPicker.date.value,
                end_date: endPicker.date.value,
                dam_code: code,
                type: activeType.value,
            }),
        });
        COST.value = res.data.data
        // console.log(COST.value)
    } catch (err) {
        console.error(err);
        COST.value = [];
    } finally {
        loading.value = false;
    }
}
const water_level = ref([])
const loadWaterLevel = async () => {
    const res = await axios.get("/api/energy/water", {
        params: withTypeParams({
            start: startPicker.date.value,
            end: endPicker.date.value,
            code: code,
            type: activeType.value,
        }),
    });
    water_level.value = res.data.data.data;
    // console.log(water_level.value)
}
const water_data = ref([])
const loadWaterData = async () => {
    const res = await axios.get("/api/water/data", {
        params: withTypeParams({
            start: startPicker.date.value,
            end: endPicker.date.value,
            code: code,
            type: activeType.value,
        }),
    });
    water_data.value = res.data.data;
    // console.log("water",water_data.value)
}
const loadSummary = async () => {
    loading.value = true
    try {
        const start_date = datePickers[0].date.value
        const end_date = datePickers[1].date.value
        // console.log(start_date, end_date)

        const res = await axios.get('/api/energy/summary', {
            params: withTypeParams({
                start_date,
                end_date,
                type: activeType.value,
                dam_code: code,
            }),
        })
        summary.value = res.data.data.data
        // console.log(summary.value)
    } catch (err) {
        console.error(err)
    } finally {
        loading.value = false
    }
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
    loadWaterLevel()  // ADD THIS
    loadCost()
    loadWaterData()
})
</script>