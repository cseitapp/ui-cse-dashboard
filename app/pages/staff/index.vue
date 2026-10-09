<template>
  <v-container>
    <v-row class="ma-0" :align="'center'">
      <v-col cols="3">
        <h3>ຈັດການແຜນການຜະລິດພະລັງງານ</h3>
      </v-col>
      <v-col cols="9" class="text-end">
        <v-btn color="success" rounded="lg" class="ma-2" prepend-icon="mdi-file-upload-outline" @click="goToUpload()">
          ອັບໂຫຼດແຜນພະລັງງານ
        </v-btn>
         <v-btn color="primary" rounded="lg" class="ma-2" prepend-icon="mdi-plus" @click="openCreatePlan">
          ສ້າງແຜນພະລັງງານ
        </v-btn>
      </v-col>
    </v-row>



    <v-dialog v-model="dialog" max-width="450px">
      <v-card rounded="lg" >
        <v-card-title>
          <span v-if="isEdit">ແກ້ໄຂແຜນພະລັງງານ</span>
          <span v-else>ສ້າງແຜນພະລັງງານ</span>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-radio-group v-model="form.type" v-if="!isEdit" density="compact" inline>
               <v-row>
                <v-col cols="6"><v-radio label="ແຜນປະຈຳປີ" value="Y" /></v-col>
                <v-col cols="6"><v-radio label="ແຜນປະຈຳເດືອນ" value="M" /></v-col>
                <v-col cols="6"><v-radio label="ແຜນປະຈຳອາທິດ" value="W" /></v-col>
                <v-col cols="6"><v-radio label="ແຜນປະຈຳວັນ" value="D" /></v-col>
               </v-row>
              </v-radio-group>
            </v-col>

            <v-col cols="12">
              <AppDatePicker v-model="form.date" :type="form.type" label="ເລືອກວັນທີ" v-if="!isEdit"
                density="compact" />
            </v-col>
            <v-col cols="12">
              <v-text-field :model-value="form.type === 'W'
                ? `(${formatDate(form.start_date)} → ${formatDate(form.end_date)}) Week ${getYearWeek(form.start_date)} `
                : `${formatDate(form.start_date)} → ${formatDate(form.end_date)}`" label="ໄລຍະເວລາ" v-if="!isEdit"
                readonly density="compact" />
            </v-col>

            <v-col cols="12">
              <v-text-field v-model="form.energy" density="compact" label="ພະລັງງານ (kWh)" type="number" color="primary"
                variant="outlined" />
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn variant="text" @click="dialog = false">
            ຍົກເລີກ
          </v-btn>

          <v-btn color="primary" @click="submitPlan">
            ບັນທຶກ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card class="mx-0 my-3" rounded="lg" elevation="0" >
      <v-row>
        <v-col cols="12">
          <v-tabs v-model="activeTab" color="primary" align-tabs="center">
            <v-tab value="Y">
              <v-icon start>mdi-calendar</v-icon>
              ແຜນປະຈຳປີ
            </v-tab>

            <v-tab value="M">
              <v-icon start>mdi-calendar-month</v-icon>
              ແຜນປະຈຳເດືອນ
            </v-tab>

            <v-tab value="W">
              <v-icon start>mdi-calendar-week</v-icon>
              ແຜນປະຈຳອາທິດ
            </v-tab>

            <v-tab value="D">
              <v-icon start>mdi-calendar-today</v-icon>
              ແຜນປະຈຳວັນ
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>
    </v-card>

    <v-window v-model="activeTab">
      <v-window-item value="Y" class="mt-2">
        <v-row>
          <v-col cols="12" md="3" lg="2">
            <AppDatePicker v-model="selectedDate" type="Y" label="ເລືອກປີ" />
          </v-col>

          <v-col cols="6" md="3" lg="2" class="mt-2">
            <v-btn color="primary" variant="outlined" @click="fetchPlan('Y')" prepend-icon="mdi-magnify">
              ຄົ້ນຫາ
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="loading">
          <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>


        <v-row v-else-if="plans.length">
          <v-col v-for="item in plans" :key="item.dam_code" cols="12" sm="6" md="4" lg="3">
            <v-card elevation="0" rounded="lg" class="border" >
              <v-card-item class="text-center">
                <v-chip class="my-3 px-6" color="primary" variant="outlined" @click="openEdit(item)"><v-icon size="28"
                    v-if="role === 'ADMIN' || (role === 'STAFF' && dam === item.dam_code)" icon="mdi-pencil-outline"
                    class="cursor-pointer" /></v-chip>
                <h3>{{ item.branch.BR_NAME }} ({{ item.dam_code }})</h3>
                <v-card-subtitle>ແຜນປະຈຳປີ</v-card-subtitle>
                <v-chip color="primary" size="large"> {{ formatPlanPeriod(item) }}</v-chip>

              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-row>
                  <v-col cols="12" class="text-center ">
                    <h1 class="text-primary">{{ formatNumber(item.energy) }} </h1>
                    kWh
                    <p>ແຜນພະລັງງານ</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-empty-state v-else icon="mdi-database-off-outline" title="ບໍ່ມີຂໍ້ມູນ"
          text="ບໍ່ມີແຜນປະຈຳປີສໍາລັບປີທີ່ເລືອກ." />

      </v-window-item>

      <v-window-item value="M" class="mt-2">
        <!-- Month Plan Content -->
        <v-row>
          <v-col cols="12" md="4" lg="2">
            <AppDatePicker v-model="selectedDate" type="M" label="ເລືອກເດືອນ" />
          </v-col>

          <v-col cols="6" md="3" lg="2" class="mt-2">
            <v-btn color="primary" variant="outlined" @click="fetchPlan('M')" prepend-icon="mdi-magnify">
              ຄົ້ນຫາ
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="loading">
          <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>


        <v-row v-else-if="plans.length">
          <v-col v-for="item in plans" :key="item.dam_code" cols="12" sm="6" md="4" lg="3">
            <v-card elevation="0" rounded="lg" class="border" >
              <v-card-item class="text-center">
                <v-chip class="my-3 px-6" color="primary" variant="outlined" @click="openEdit(item)"><v-icon size="28"
                    v-if="role === 'ADMIN' || (role === 'STAFF' && dam === item.dam_code)" icon="mdi-pencil-outline"
                    class="cursor-pointer" /></v-chip>
                <h3>{{ item.branch.BR_NAME }} ({{ item.dam_code }})</h3>
                <v-card-subtitle>ແຜນປະຈຳປີ</v-card-subtitle>
                <v-chip color="primary" size="large"> {{ formatPlanPeriod(item) }}</v-chip>

              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-row>
                  <v-col cols="12" class="text-center ">
                    <h1 class="text-primary">{{ formatNumber(item.energy) }} </h1>
                    kWh
                    <p>ແຜນພະລັງງານ</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-empty-state v-else icon="mdi-database-off-outline" title="ບໍ່ມີຂໍ້ມູນ"
          text="ບໍ່ມີແຜນປະຈຳເດືອນສໍາລັບເດືອນທີ່ເລືອກ." />


      </v-window-item>

      <v-window-item value="W" class="mt-2">
        <v-row>
          <v-col cols="12">ຊ່ວງວັນທີ <v-chip color="primary">{{ selectedStartDate }}</v-chip> -> <v-chip color="error">
              {{ selectedEndDate }}</v-chip></v-col>
          <v-col cols="12" md="4" lg="2">
            <AppDatePicker v-model="selectedDate" type="W" label="ເລືອກອາທິດ" />
          </v-col>

          <v-col cols="6" md="3" lg="2" class="mt-2">
            <v-btn color="primary" variant="outlined" @click="fetchPlan('W')" prepend-icon="mdi-magnify">
              ຄົ້ນຫາ
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="loading">
          <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>


        <v-row v-else-if="plans.length">
          <v-col v-for="item in plans" :key="item.dam_code" cols="12" sm="6" md="4" lg="3">
            <v-card elevation="0" rounded="lg" class="border" >
              <v-card-item class="text-center">
                <v-chip class="my-3 px-6" color="primary" variant="outlined" @click="openEdit(item)"><v-icon size="28"
                    v-if="role === 'ADMIN' || (role === 'STAFF' && dam === item.dam_code)" icon="mdi-pencil-outline"
                    class="cursor-pointer" /></v-chip>
                <h3>{{ item.branch.BR_NAME }} ({{ item.dam_code }})</h3>
                <v-card-subtitle>ແຜນປະຈຳປີ</v-card-subtitle>
                <v-chip color="primary" size="large"> {{ formatPlanPeriod(item) }}</v-chip>

              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-row>
                  <v-col cols="12" class="text-center ">
                    <h1 class="text-primary">{{ formatNumber(item.energy) }} </h1>
                    Kwh
                    <p>ແຜນພະລັງງານ</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-empty-state v-else icon="mdi-database-off-outline" title="ບໍ່ມີຂໍ້ມູນ"
          text="ບໍ່ມີແຜນປະຈຳອາທິດສໍາລັບອາທິດທີ່ເລືອກ." />

        <!-- Week Plan Content -->
      </v-window-item>

      <v-window-item value="D" class="mt-2">
        <v-row>
          <v-col cols="12" md="4" lg="2">
            <AppDatePicker v-model="selectedDate" type="D" label="ເລືອກວັນ" />
          </v-col>

          <v-col cols="6" md="3" lg="2" class="mt-2">
            <v-btn color="primary" variant="outlined" @click="fetchPlan('D')" prepend-icon="mdi-magnify">
              ຄົ້ນຫາ
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="loading">
          <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>


        <v-row v-else-if="plans.length">
          <v-col v-for="item in plans" :key="item.dam_code" cols="12" sm="6" md="4" lg="3">
            <v-card elevation="0" rounded="lg" class="border" >
              <v-card-item class="text-center">
                <v-chip class="my-3 px-6" color="primary" variant="outlined" @click="openEdit(item)"><v-icon size="28"
                    v-if="role === 'ADMIN' || (role === 'STAFF' && dam === item.dam_code)" icon="mdi-pencil-outline"
                    class="cursor-pointer" /></v-chip>
                <h3>{{ item.branch.BR_NAME }} ({{ item.dam_code }})</h3>
                <v-card-subtitle>ແຜນປະຈຳປີ</v-card-subtitle>
                <v-chip color="primary" size="large"> {{ formatPlanPeriod(item) }}</v-chip>

              </v-card-item>
              <v-divider />
              <v-card-text>
                <v-row>
                  <v-col cols="12" class="text-center ">
                    <h1 class="text-primary">{{ formatNumber(item.energy) }} </h1>
                    kWh
                    <p>ແຜນພະລັງງານ</p>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-empty-state v-else icon="mdi-database-off-outline" title="ບໍ່ມີຂໍ້ມູນ"
          text="ບໍ່ມີແຜນປະຈຳວັນສໍາລັບວັນທີ່ເລືອກ." />

        <!-- Day Plan Content -->
      </v-window-item>

    </v-window>
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>
<script setup>
import { ref, watch } from 'vue'
import AppDatePicker from '~~/components/common/AppDatePicker.vue'
import moment from 'moment';
import { useAuthUser } from '~~/composables/useAuth';
import { formatNumber } from "~~/components/common/formatNumber";
import axios from 'axios';
definePageMeta({
  middleware: "auth",
  layout: "default",
});

const user = useAuthUser()
const nuxtApp = useNuxtApp();
// const dam = 'NEM'
const dam = user.value.BR_CODE
const role = user.value.ROLE_CODE
const activeTab = ref('Y')
const selectedStartDate = ref(moment().format('YYYY-MM-DD'))
const selectedEndDate = ref(moment().format('YYYY-MM-DD'))
const selectedDate = ref(null)
const dialog = ref(false)
const loading = ref(false)
const plans = ref([])
const isEdit = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const getYearWeek = (dateStr) => {
  if (!dateStr) return ''
  const m = moment(dateStr)
  return `${m.isoWeekYear()}${String(m.isoWeek()).padStart(2, '0')}`
}

const withTypeParams = (params) => {
  if (activeTab.value !== 'W') return params
  return {
    ...params,
    yearweek: getYearWeek(form.date),
  }
}

const form = ref({
  type: 'Y',
  date: null,
  start_date: '',
  end_date: '',
  energy: null,
  user: user.value.USER_NAME,
  code: dam
})

const resetForm = () => {
  form.value = {
    type: 'Y',
    date: null,
    start_date: '',
    end_date: '',
    energy: null,
    user: user.value.USER_NAME,
    code: dam
  }

  isEdit.value = false
}
const openCreatePlan = () => {
  isEdit.value = false
  dialog.value = true
}

const fetchPlan = async (type) => {
  try {
    loading.value = true
    const res = await axios.get('/api/plan', {
      params: {
        type,
        start_date: selectedStartDate.value,
        end_date: selectedEndDate.value,
        code: dam
      }
    })
    plans.value = res.data.data
  } catch (error) {
    console.error('Failed to fetch plan:', error)
  } finally {
    loading.value = false
  }
}
const setDateRange = (value, type) => {
  const date = moment(value)
  switch (type) {
    case 'Y':
      return {
        start_date: date.startOf('year').format('YYYY-MM-DD'),
        end_date: date.endOf('year').format('YYYY-MM-DD')
      }

    case 'M':
      return {
        start_date: date.startOf('month').format('YYYY-MM-DD'),
        end_date: date.endOf('month').format('YYYY-MM-DD')
      }

    case 'W':
      return {
        start_date: date.startOf('isoWeek').format('YYYY-MM-DD'),
        end_date: date.endOf('isoWeek').format('YYYY-MM-DD')
      }

    case 'D':
      return {
        start_date: date.format('YYYY-MM-DD'),
        end_date: date.format('YYYY-MM-DD')
      }
  }
}

const formatDate = (date) => {
  return moment(date).format('YYYY-MM-DD')
}

const formatPlanPeriod = (item) => {
  switch (item.type) {
    case 'Y':
      return moment(item.start_date).format('YYYY')

    case 'M':
      return moment(item.start_date).format('MM-YYYY')

    case 'W':
      return `${moment(item.start_date).format('DD/MM')} - ${moment(item.end_date).format('DD/MM/YYYY')}`

    case 'D':
      return moment(item.start_date).format('YYYY-MM-DD')

    default:
      return moment(item.start_date).format('YYYY-MM-DD')
  }
}

watch([selectedDate, activeTab], async ([value, type]) => {
  if (!value) return

  const range = setDateRange(value, type)

  selectedStartDate.value = range.start_date
  selectedEndDate.value = range.end_date
  await fetchPlan(type)
})
watch(
  () => [form.value.date, form.value.type],
  ([date, type]) => {
    if (!date) return

    const range = setDateRange(date, type)

    form.value.start_date = range.start_date
    form.value.end_date = range.end_date
  }
)
const submitPlan = async () => {
  try {
    if (isEdit.value) {
      const res = await axios.put(`/api/plan/${form.value.id}`, form.value)
      showSnackbar('ແກ້ໄຂແຜນການສຳເລັດ')
    } else {
      const res = await axios.post('/api/plan', form.value)
      if (res.data.code === "00") {
        showSnackbar('ການສ້າງແຜນທັບຊ້ອນກັນກະລຸນາກວດສອບ', 'error')
      } else if (res.data.code === "20") {
        showSnackbar('ບັນທຶກແຜນການສຳເລັດ')
      }
    }
    dialog.value = false
    resetForm()

    await fetchPlan(activeTab.value)
  } catch (error) {
    console.error(error)
    showSnackbar(
      error?.response?.data?.message || 'ບັນທຶກຂໍ້ມູນບໍ່ສຳເລັດ',
      'error'
    )
  }
}
const openEdit = (item) => {
  isEdit.value = true
  form.value = {
    ...form.value,
    ...item,
    date: item.type === 'Y' ? item.year : `${item.month}-${item.year}`,
  }
  dialog.value = true
}
watch(dialog, (value) => {
  if (!value) {
    resetForm()
  }
})

const goToUpload = (item) => {
  nuxtApp.$router.push({
    path: "/staff/upload",
    query: ""
  });
};

</script>