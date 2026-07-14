<template>
    <v-row class="ma-0" :align="'center'">
      <v-col>
        <h3>ເພີ່ມຂໍ້ມູນນ້ຳ</h3>
      </v-col>
      <v-col cols="12" md="4">
        <v-row  :align="'center'">
          <v-col cols="2" class="text-center"><v-chip color="primary" size="large">
            <v-btn icon="mdi-chevron-left"
                variant="text" density="comfortable" @click="prevDate" />
          </v-chip></v-col>
          <v-col cols="8"> <v-menu v-model="menu" :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field variant="outlined" density="comfortable" prepend-inner-icon="mdi-calendar" color="primary" rounded="lg"
                  label="ເລືອກວັນ" :model-value="displayDate" readonly v-bind="props" class="mt-4" />
              </template>

              <v-date-picker :model-value="selectedDate" hide-header color="primary"
                @update:model-value="onDateChange" />
            </v-menu></v-col>
          <v-col cols="2">
            <v-chip color="primary" size="large">
              <v-btn icon="mdi-chevron-right" variant="text" density="comfortable" @click="nextDate" />
            </v-chip>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.message }}
    </v-snackbar>


    <!-- Vuetify Card wrapping the table -->
    <v-card class="rounded-lg" elevation="0" >
      <v-data-table :headers="headers" :items="tableRows" density="default" hide-default-footer :items-per-page="-1"
        :loading="loading">

        <!-- Status column -->
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal" class="font-semibold text-xs">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>


        <!-- Manage column — open dialog -->
        <template #item.manage="{ item, index }">
          <div class="d-flex align-center justify-center ga-2">
            <v-btn color="primary" size="small" variant="tonal" v-if="item.status !== 1 && item.status !== 2"
              :disabled="!canSave(item)" :loading="isUploading[index]" @click="submitDialog(index, item)">
              <v-icon color="primary" icon="mdi-content-save-all"></v-icon>
            </v-btn>

            <v-btn class="ms-2" color="warning" variant="tonal" size="small" :loading="isUploading[index]"
              v-if="item.status === 1 || item.status === 2" :disabled="!isChanged(item)"
              @click="submitEdit(index, item)">
              <v-icon color="warning" icon="mdi-pencil-outline"></v-icon>
            </v-btn>
          </div>
        </template>

        <template #item.inflow="{ item }">
          <div class="d-flex align-center justify-center" style="height: 100%;">
            <v-text-field :model-value="formatNumber(item.inflow)" @update:model-value="val => item.inflow = val"
              variant="outlined" density="compact" rounded="lg" color="primary" hide-details style="max-width: 150px;"
              type="number" />
          </div>
        </template>

        <template #item.outflow="{ item }">
          <div class="d-flex align-center justify-center" style="height: 100%;">
            <v-text-field :model-value="formatNumber(item.outflow)" @update:model-value="val => item.outflow = val"
              variant="outlined" density="compact" rounded="lg" color="primary" hide-details style="max-width: 150px;"
              type="number" />
          </div>
        </template>
        <template #item.date="{ item }">
          <div style="min-width:80px; white-space: nowrap;">{{ item.date }}</div>
        </template>
        <template #item.section="{ item }">
          <div style="min-width:80px; white-space: nowrap;">{{ item.section }}</div>
        </template>
        <template #item.created_at="{ item }">
          <div style="min-width:80px; white-space: nowrap;">{{ formatDate(item.created_at) }}</div>
        </template>
        <template #item.modify_at="{ item }">
          <div style="min-width:80px; white-space: nowrap;">{{ formatDate(item.modify_at) }}</div>
        </template>

      </v-data-table>
    </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthUser } from '~~/composables/useAuth'
import { useFormatDate } from '~~/components/common/useFormatDate'
import moment from 'moment'
const { formatDate } = useFormatDate()
const menu = ref(false)
const displayDate = computed(() => {
  return formatDate(selectedDate.value)
})
const onDateChange = (value) => {
  selectedDate.value = formatDate(value)
  menu.value = false
}

definePageMeta({
  layout: "default",
  middleware: 'auth',
})

const formatNumber = (val) => {
  if (val === null || val === undefined || val === '') return val
  const num = Number(val)
  if (isNaN(num)) return val
  return num % 1 === 0 ? num.toString() : parseFloat(num.toFixed(3)).toString()
}

function shiftDate(amount, unit = 'day') {
  const updated = moment(selectedDate.value).add(amount, unit).toDate()
  onDateChange(updated)
}

function prevDate() {
  shiftDate(-1)
}

function nextDate() {
  shiftDate(1)
}

// 24 rows: one per hour (00:00–23:00)
const code_name = ref(24)

const isUploading = ref([])
const user = useAuthUser()
const emp = user.value.USER_NAME
// const code = user.value.BR_CODE
const code = 'NEM'

const snackbar = ref({ show: false, message: '', color: 'success' })
const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const submitDialog = async (index, item) => {
  isUploading.value[index] = true
  try {
    const payload = {
      date: item.date,
      code: item.code,
      section: item.section,
      status: 1,
      created_by: emp,
      inflow: item.inflow,   // ✅ read from row directly
      outflow: item.outflow  // ✅ fixed typo
    }

    const res = await axios.post('/api/water', payload)
    if (res.data.success) {
      showSnackbar('ບັນທຶກສໍາເລັດ!', 'success')
    } else {
      showSnackbar('ບໍ່ສາມາດບັນທຶກໄດ້ ລອງໃໝ່ອີກຄັ້ງ', 'error')
    }
    await fetchData()

  } catch (err) {
    console.error('Submit failed:', err)
    showSnackbar('ບັນທຶກລົ້ມເຫລວ ກະລຸນາລອງໃໝ່', 'error')
  } finally {
    isUploading.value[index] = false
  }
}


// Submit edit — calls PUT /api/water/:id
const submitEdit = async (index, item) => {
  isUploading.value[index] = true
  try {
    const payload = {
      date: item.date,
      code: item.code,
      section: item.section,
      status: 2,              // 2 = edited
      modify_by: emp,
      modify_at: new Date().toISOString(),
      inflow: item.inflow,
      outflow: item.outflow,
    }

    const res = await axios.put(`/api/water/${item.id}`, payload)

    if (res.data.result_code == 20) {
      showSnackbar('ແກ້ໄຂສໍາເລັດ!', 'success')
    } else {
      showSnackbar('ບໍ່ສາມາດແກ້ໄຂໄດ້ ລອງໃໝ່ອີກຄັ້ງ', 'error')
    }
    item.originalInflow = item.inflow
    item.originalOutflow = item.outflow
    await fetchData()

  } catch (err) {
    console.error('Edit failed:', err)
    showSnackbar('ແກ້ໄຂລົ້ມເຫລວ ກະລຸນາລອງໃໝ່', 'error')
  } finally {
    isUploading.value[index] = false
  }
}
// Table headers
const headers = [
  { title: 'ຈັດການ', key: 'manage', sortable: false, align: 'center' },
  { title: 'ບໍລິມາດນ້ຳເຂົ້າ', key: 'inflow', sortable: false, align: 'center' },
  { title: 'ບໍລິມາດນ້ຳອອກ', key: 'outflow', sortable: false, align: 'center' },
  { title: 'ວັນທີ', key: 'date', sortable: true },
  { title: 'ເຂື່ອນ', key: 'code', sortable: true },
  { title: 'ເວລາ', key: 'section', sortable: true },
  { title: 'ສະຖານະ', key: 'status', sortable: true },
  { title: 'ຜູ້ເພີ່ມ', key: 'created_by', sortable: true },
  { title: 'ເພີ່ມວັນທີ', key: 'created_at', sortable: true },
  // { title: 'ຜູ້ແກ້ໄຂ', key: 'modify_by', sortable: true },
  // { title: 'ແກ້ໄຂວັນທີ', key: 'modify_at', sortable: true },
]

const loading = ref(false)

const canSave = (item) => {
  return item.inflow !== '' &&
    item.inflow != null &&
    item.outflow !== '' &&
    item.outflow != null
}
const isChanged = (item) => {
  return (
    Number(item.inflow) !== Number(item.originalInflow) ||
    Number(item.outflow) !== Number(item.originalOutflow)
  )
}

// Returns Vuetify chip color per status label
const statusColor = (status) => {
  const map = {
    'ອັບໂຫລດແລ້ວ': 'success',
    'ບໍ່ມີການອັບໂຫລດ': 'red',
    'ແກ້ໄຂ': 'warning'
  }
  return map[status] ?? 'default'
}

const statusLabel = (apiStatus) => {
  if (apiStatus === 1) return 'ເພີ່ມແລ້ວ'
  else if (apiStatus === 2) return 'ແກ້ໄຂ'
  else return 'ຫວ່າງ'
}

// index 0 → "00:00-01:00" … index 23 → "23:00-24:00"
const sectionLabel = (index) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(index)}:00-${pad(index + 1)}:00`
}

const todayStr = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const selectedDate = ref(todayStr())

const tableRows = ref([])
const buildBaseRows = () =>
  Array.from({ length: code_name.value }, (_, i) => ({
    id: null,
    date: selectedDate.value,
    // code: user.value.BR_CODE,
    code: 'NEM',
    section: sectionLabel(i),
    inflow: null,
    outflow: null,   // ✅ fixed typo
    status: 'ບໍ່ມີການອັບໂຫລດ',
    created_by: null,
    created_at: null,
    modify_by: null,
    modify_at: null,
  }))
const toDateStr = (val) => {
  if (!val) return null
  return String(val).slice(0, 10)
}

const fetchData = async () => {
  loading.value = true
  tableRows.value = buildBaseRows()
  try {
    const res = await axios.get('/api/water', {
      params: { code: code, date: selectedDate.value, },
    })
    const apiData = res.data.data.data
    // console.log(apiData)

    apiData.forEach((item) => {
      const row = tableRows.value.find(r =>
        r.code === item.code &&
        r.date === toDateStr(item.date) &&
        r.section === item.section
      )
      if (row) {
        row.id = item.id ?? row.id
        row.inflow = item.inflow ?? row.inflow
        row.outflow = item.outflow ?? row.outflow
        row.status = item.status ?? row.status
        row.originalInflow = item.inflow
        row.originalOutflow = item.outflow
        row.created_by = item.created_name_la ?? row.created_by
        row.created_at = item.created_at ?? row.created_at
        row.modify_by = item.modify_name_la ?? row.modify_by
        row.modify_at = item.modify_at ?? row.modify_at
      }
    })
  } catch (err) {
    console.error('Failed to fetch data:', err)
  } finally {
    loading.value = false
  }
}
watch(selectedDate, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>