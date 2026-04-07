<template>
  <div class="container">
    <h4>ເພີ່ມຂໍ້ມູນ</h4>

    <!-- Hidden file input, accepts only Excel files -->
    <input ref="fileInput" type="file" accept=".xlsx,.xls,.csv" style="display: none" @change="handleFileChange" />

    <!-- Upload Button -->
    <v-btn color="success" prepend-icon="mdi-microsoft-excel" :loading="isUploading" @click="triggerFileInput">
      ອັບໂຫຼດ Excel ລົງຖານຂໍ້ມູນ
    </v-btn>

    <!-- Selected file name feedback -->
    <v-chip v-if="selectedFile" class="mt-3" color="success" variant="tonal" prepend-icon="mdi-file-excel" closable
      @click:close="clearFile">
      {{ selectedFile.name }}
    </v-chip>

    <!-- Submit Button (shown after file is selected) -->
    <div v-if="selectedFile" class="mt-3">
      <v-btn color="primary" prepend-icon="mdi-upload" :loading="isUploading" @click="submitFile">
        Submit
      </v-btn>
    </div>

    <!-- Snackbar feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>

  <!-- File Tree -->
  <div class="mt-6">
    <h4>ລາຍການເອກະສານ</h4>

    <v-progress-circular v-if="isLoadingTree" indeterminate color="primary" />

    <v-treeview v-else :items="treeItems" item-title="name" item-value="id" open-all>
      <template #prepend="{ item }">
        <v-icon v-if="item.type === 'year'">mdi-calendar</v-icon>
        <v-icon v-else-if="item.type === 'month'">mdi-calendar-month</v-icon>
        <v-icon v-else-if="item.type === 'day'">mdi-calendar-today</v-icon>
        <v-icon v-else>mdi-file-excel</v-icon>
      </template>
    </v-treeview>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import axios from 'axios'

definePageMeta({
  layout: "default",
  middleware: 'auth',
})

const fileInput = ref(null)
const selectedFile = ref(null)
const treeItems = ref([])
const isLoadingTree = ref(false)
const isUploading = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })
import { useAuthUser } from '~~/composables/useAuth'
const user = useAuthUser()

const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
  'text/csv',                                                            // .csv
]

async function fetchFiles() {
  isLoadingTree.value = true
  try {
    // Replace with your API
    const res = await axios.get('/api/files')

    treeItems.value = buildTree(res.data.data.data)
  } catch (err) {
    showSnackbar('Failed to load files', 'error')
  } finally {
    isLoadingTree.value = false
  }
}

function buildTree(data) {
  const years = {}

  data.forEach((item) => {
    if (!years[item.year]) {
      years[item.year] = {
        id: item.year,
        name: item.year,
        type: 'year',
        children: {}
      }
    }

    if (!years[item.year].children[item.month]) {
      years[item.year].children[item.month] = {
        id: `${item.year}-${item.month}`,
        name: `Month ${item.month}`,
        type: 'month',
        children: {}
      }
    }

    if (!years[item.year].children[item.month].children[item.day]) {
      years[item.year].children[item.month].children[item.day] = {
        id: `${item.year}-${item.month}-${item.day}`,
        name: `Day ${item.day}`,
        type: 'day',
        children: []
      }
    }

    // Add files
    item.data.forEach((file, index) => {
      years[item.year]
        .children[item.month]
        .children[item.day]
        .children.push({
          id: `${item.year}-${item.month}-${item.day}-${index}`,
          name: file.filename,
          type: 'file',
          path: file.path
        })
    })
  })

  // Convert object → array
  return Object.values(years).map((year) => ({
    ...year,
    children: Object.values(year.children).map((month) => ({
      ...month,
      children: Object.values(month.children)
    }))
  }))
}

function triggerFileInput() {
  fileInput.value.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!ALLOWED_TYPES.includes(file.type)) {
    showSnackbar('Only Excel (.xlsx, .xls) or CSV files are allowed.', 'error')
    return
  }

  selectedFile.value = file
}

function clearFile() {
  selectedFile.value = null
  fileInput.value.value = ''
}

async function submitFile() {
  if (!selectedFile.value) return

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const res = await axios.post('/api/files',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    console.log(res.data)

    showSnackbar('File uploaded successfully!', 'success')

    // 🔥 refresh your tree after upload
    await fetchFiles()

    clearFile()

  } catch (error) {
    console.error(error)
    showSnackbar('Upload failed. Please try again.', 'error')
  } finally {
    isUploading.value = false
  }
}

function showSnackbar(message, color) {
  snackbar.value = { show: true, message, color }
}

onMounted(() => {
  fetchFiles()
})
</script>