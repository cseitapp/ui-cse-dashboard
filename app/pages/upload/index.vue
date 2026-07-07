<template>
  <!-- Page Title -->
    <v-row class="ma-0" :align="'center'">
      <v-col>
        <h3 >ເພີ່ມຂໍ້ມູນ</h3>
      </v-col>
      <v-col cols="12" md="4">
        <v-row :align="'center'">
          <v-col cols="2" class="text-center"> <v-card rounded="lg" elevation="2"><v-btn icon="mdi-chevron-left"
                variant="text" density="comfortable" @click="prevDate" /></v-card></v-col>
          <v-col cols="8"> <v-menu v-model="menu" :close-on-content-click="false">
              <template v-slot:activator="{ props }">
                <v-text-field rounded="lg" variant="solo" density="comfortable" prepend-inner-icon="mdi-calendar" color="primary"
                  label="ເລືອກວັນ" :model-value="displayDate" readonly v-bind="props" class="mt-4" />
              </template>

              <v-date-picker :model-value="selectedDate" hide-header color="primary"
                @update:model-value="onDateChange" />
            </v-menu></v-col>
          <v-col cols="2">
            <v-card rounded="lg" class="text-center" elevation="2"><v-btn icon="mdi-chevron-right" variant="text" 
                density="comfortable" @click="nextDate" /></v-card>

          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" location="top right">
      {{ snackbar.message }}
    </v-snackbar>

    <!-- Vuetify Card wrapping the table -->
    <v-card class="rounded-lg" color="#FDFBF7">
      <v-data-table :headers="headers" :items="tableRows" density="default" hide-default-footer :loading="loading">
        <!-- Status column -->
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal" class="font-semibold text-xs">
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Manage column — per-row file state -->
        <template #item.manage="{ item, index }">

          <!-- Hidden file input per row -->
          <input :ref="el => fileRefs[index] = el" type="file" accept=".xlsx,.xls,.csv" style="display: none"
            @change="handleFileChange($event, index)" />

          <!-- Upload trigger button -->
          <v-btn color="success" size="small" prepend-icon="mdi-microsoft-excel" :loading="isUploading[index]"
            @click="triggerFileInput(index)">
            ອັບໂຫຼດ
          </v-btn>

          <!-- Selected file chip (only for this row) -->
          <v-chip v-if="selectedFiles[index]" class="mt-2 ml-1" color="success" variant="tonal" size="small"
            prepend-icon="mdi-file-excel" closable @click:close="clearFile(index)">
            {{ selectedFiles[index].name }}
          </v-chip>

          <!-- Submit button (only shown for this row after file selected) -->
          <v-btn v-if="selectedFiles[index]" class="mt-2 ml-1" color="primary" size="small" prepend-icon="mdi-upload"
            :loading="isUploading[index]" @click="submitFile(index, item)">
            ອັບໂຫລດ
          </v-btn>

        </template>

        <template #item.date="{ item }">
          <div style="min-width:80px; white-space: nowrap;">
            {{ formatDate(item.date) }}
          </div>
        </template>
        <template #item.section="{ item }">
          <div style="min-width:80px; white-space: nowrap;">
            {{ item.section }}
          </div>
        </template>

        <!-- Created At -->
        <template #item.created_at="{ item }">
          <div style="min-width:80px; white-space: nowrap;">
            {{ (item.created_at) }}
          </div>
        </template>

        <!-- Modify At -->
        <template #item.modify_at="{ item }">
          <div style="min-width:80px; white-space: nowrap;">
            {{ (item.modify_at) }}
          </div>
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

definePageMeta({
  layout: "default",
  middleware: 'auth',
})
const onDateChange = (value) => {
  selectedDate.value = formatDate(value)
  menu.value = false
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

const code_name = ref(8)
const fileRefs = ref([])   // native <input> ref per row
const selectedFiles = ref([])  // selected File object per row
const isUploading = ref([])  // upload loading state per row
const user = useAuthUser()
const emp = user.value.USER_NAME


const snackbar = ref({ show: false, message: '', color: 'success' })

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

// Table headers
const headers = [
  { title: 'ຈັດການ', key: 'manage', sortable: false },
  { title: 'ໄອດີ', key: 'e_id', sortable: false },
  { title: 'ວັນທີ່ອັບໂຫລດ', key: 'date', sortable: true },
  { title: 'ລະຫັດເຂື່ອນ', key: 'code', sortable: true },
  { title: 'ຊ່ວງເວລາ', key: 'section', sortable: true },
  // { title: 'File', key: 'file', sortable: false },
  { title: 'ສະຖານະ', key: 'status', sortable: true },
  { title: 'ອັບໂຫລດໂດຍ', key: 'created_by', sortable: true },
  { title: 'ວັນທີ່ອັບໂຫລດ', key: 'created_at', sortable: true },
  { title: 'ແກ້ໄຂໂດຍ', key: 'modify_by', sortable: true },
  { title: 'ວັນທີ່ແກ້ໄຂ', key: 'modify_at', sortable: true },

]

const loading = ref(false)

const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
  'text/csv',                                                            // .csv
]
const ALLOWED_EXTS = ['.xlsx', '.xls', '.csv']

// Open file picker for a specific row
const triggerFileInput = (index) => {
  fileRefs.value[index]?.click()
}

// Store selected file for this row only
const handleFileChange = (event, index) => {
  const file = event.target.files[0]
  if (!file) return

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
    showSnackbar('ສະເພາະຟາຍ Excel (.xlsx, .xls) ແລະ CSV ເທົ່ານັ້ນ', 'error')
    return
  }

  selectedFiles.value[index] = file
  event.target.value = '' // reset so same file can be re-selected
}

// Clear selected file for this row
const clearFile = (index) => {
  selectedFiles.value[index] = null
}

// Submit file with row data as params
const submitFile = async (index, item) => {
  const file = selectedFiles.value[index]
  if (!file) return

  isUploading.value[index] = true
  try {
    const formData = new FormData()
    formData.append('file', file)                    // new file
    // formData.append('dam_id', user.value.BR_CODE)
    formData.append('dam_id', 'NEM')
    if (item.file && item.file !== '-') {
      formData.append('old_file', item.file)
    }
    formData.append('date', item.date)
    formData.append('code', item.code)
    formData.append('section', item.section)
    formData.append('status', 1)
    formData.append('created_by', emp)
    if (item.e_id) {
      formData.append('e_id', item.e_id)
    }

    const res = await axios.post('/api/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (res.data.success) {
      showSnackbar('ອັບໂຫລດສໍາເລັດ!', 'success')

    } else {
      showSnackbar('ບໍ່ສາມາດອັບໂຫຼດໄດ້ ລອງໃໝ່ອີກຄັ້ງ', 'error')
    }
    clearFile()
    selectedFiles.value[index] = null  // clear chip after success
    await fetchData()

  }
  catch (err) {
    console.error('Upload failed:', err)
    showSnackbar('ອັບໂຫລດລົ້ມເຫລວ ກະລຸນາລອງໃໝ່', 'error')
  } finally {
    isUploading.value[index] = false
  }
}

// Returns Vuetify chip color per status label
const statusColor = (status) => {
  const map = {
    Uploaded: 'success',
    None: 'default',
  }
  return map[status] ?? 'default'
}

// Map API status value to display label
const statusLabel = (apiStatus) => {
  if (apiStatus === 1) return 'ອັບໂຫລດແລ້ວ'
  return 'ບໍ່ມີການອັບໂຫລດ'
}

// Section time-range label: interval = 24 / code_name
const sectionLabel = (index) => {
  const interval = Math.floor(24 / code_name.value)
  const pad = (n) => String(n).padStart(2, '0')
  const startH = index * interval
  const endH = startH + interval
  return `${pad(startH)}:00-${pad(endH)}:00`
}

// Today's date string
const todayStr = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const selectedDate = ref(todayStr())


const tableRows = ref([])

// Build base rows
const buildBaseRows = () =>
  Array.from({ length: code_name.value }, (_, i) => ({
    date: selectedDate.value,
    // code: user.value.BR_CODE,
    code: 'NEM',
    section: sectionLabel(i),
    file: '-',
    status: 'ບໍ່ມີການອັບໂຫລດ',
    created_by: null,
    created_at: null,
    modify_by: null,
    modify_at: null,
    e_id: null,
  }))

// Normalize ISO datetime → "YYYY-MM-DD"
const toDateStr = (val) => {
  if (!val) return null
  return String(val).slice(0, 10)
}

// Fetch and merge API data into base rows
const fetchData = async () => {
  loading.value = true
  tableRows.value = buildBaseRows()
  try {
    const res = await axios.get('/api/history', {
      params: {
        date: selectedDate.value,
      },
    })
    const apiData = res.data.data

    apiData.forEach((item) => {
      const row = tableRows.value.find(r =>
        r.code === item.code &&
        r.date === toDateStr(item.date) &&
        r.section === item.section
      )
      if (row) {
        row.file = item.file ?? row.file
        row.status = statusLabel(item.status)
        row.created_by = item.created_name_la ?? row.created_by
        row.created_at = item.created_at ?? row.created_at
        row.modify_by = item.modify_by ?? row.modify_by
        row.modify_at = item.modified_name_la ?? row.modify_at
        row.e_id = item.e_id ?? row.e_id
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