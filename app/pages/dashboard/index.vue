<template>
  <v-container fluid>
    <v-row class="ma-0" :align="'center'">
      <v-col cols="3">
        <h3>ຈັດການແຜນການຜະລິດພະລັງງານ</h3>
      </v-col>
      <v-col cols="9" class="text-end">
        <v-btn color="success" rounded="lg" class="ma-2" prepend-icon="mdi-file-upload-outline" @click="goToUpload()">
          ອັບໂຫຼດຂໍ້ມູນ
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="mb-3" elevation="0" rounded="lg">
      <!-- 📅 DATE RANGE -->
      <v-row class="ma-3 d-flex align-center">
        <v-col v-if="role === 'ADMIN' || role === 'DIRECTOR'">
          <v-select v-model="selected" :items="dams" item-title="BR_CODE" item-value="BR_CODE" variant="outlined"
            hide-details density="compact" color="primary" placeholder="ກະລຸນາເລືອກເຂື່ອນ" />
        </v-col>

        <v-col v-for="picker in datePickers" :key="picker.label">
          <v-menu v-model="picker.menu.value" :close-on-content-click="false" transition="scale-transition" offset-y
            min-width="auto">
            <template #activator="{ props }">
              <v-text-field color="primary" v-bind="props" v-model="picker.date.value" :label="picker.label"
                hide-details variant="outlined" density="compact" prepend-inner-icon="mdi-calendar" readonly />
            </template>
            <v-date-picker v-model="picker.picker.value" hide-header
              @update:model-value="(val) => onDateSelected(val, picker)" />
          </v-menu>
        </v-col>
        <v-btn class="rounded-lg" color="primary" prepend-icon="mdi-magnify" variant="tonal"
          @click="loadData">ຄົ້ນຫາ</v-btn>
      </v-row>
    </v-card>

    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <v-btn-group :border="true" density="compact">
          <v-btn v-for="range in quickRanges" :key="range.key" :color="active === range.key ? 'primary' : ''"
            @click="setRange(range.key, range.days)">
            {{ range.label }}
          </v-btn>
        </v-btn-group>
      </v-col>
    </v-row>

    <!-- 📊 DATA TABLE -->
    <v-data-table :headers="headers" :items="data" :loading="loading" class="elevation-0 mt-4 rounded-lg border">
      <template #item.datetime="{ item }">{{ formatDisplay(item.datetime) }}</template>
      <template #item.created_at="{ item }">{{ formatDisplay(item.created_at) }}</template>
      <template #item.unit1_power="{ item }">{{ formatNumber(item.unit1_power) }}</template>
      <template #item.unit2_power="{ item }">{{ formatNumber(item.unit2_power) }}</template>
      <template #item.total_power="{ item }">
        <strong>{{ formatNumber(item.total_power) }}</strong>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, computed } from "vue";
import axios from "axios";
import { useAuthUser } from '~~/composables/useAuth'

const user = useAuthUser();
const nuxtApp = useNuxtApp();

definePageMeta({
  middleware: "auth",
  layout: "default",
});

// ─── State ────────────────────────────────────────────────
const data = ref([]);
const loading = ref(false);
const active = ref("today");
// const selected = ref(user.value?.BR_CODE ?? null);
const selected = ref('NEM' ?? null);
const role = user.value.ROLE_CODE

const today = new Date().toISOString().split('T')[0];

// ─── Date Pickers ─────────────────────────────────────────
const createDatePicker = (label, initial) => ({
  label,
  date: ref(initial),
  picker: ref(null),
  menu: ref(false),
});

const startPicker = createDatePicker("ວັນທີ່ເລີ່ມຕົ້ນ", today);
const endPicker = createDatePicker("ວັນທີ່ສິ້ນສຸດ", today);
const datePickers = [startPicker, endPicker];

const onDateSelected = (val, picker) => {
  picker.date.value = formatDate(new Date(val));
  picker.menu.value = false;
};

// ─── Options ──────────────────────────────────────────────
// const damOptions = [
//   { value: "CSE", name: "ສຳນັກງານໃຫຍ່" },
//   { value: "NEM", name: "ເຂື່ອນນ້ຳອີ່ມູນ" },
//   { value: "NK2", name: "ເຂື່ອນນ້ຳກົງ 2" },
//   { value: "NK3", name: "ເຂື່ອນນ້ຳກົງ 3" },
//   { value: "EE", name: "ເຂື່ອນນ້ຳເທີນ" },
//   { value: "NP", name: "ເຂື່ອນນ້ຳປາກຊ່ອງ" },
// ];

const quickRanges = [
  { key: "today", label: "Today", days: 0 },
  { key: "3days", label: "3 Days", days: 3 },
  { key: "7days", label: "7 Days", days: 7 },
];

const headers = [
  { title: "ວັນ ແລະ ເວລາ", key: "D_DATE" },
  { title: "ເຂື່ອນ", key: "D_DAM" },
  { title: "ເຂື່ອນຫຼັກ", key: "D_MAIN" },
  { title: "ເຂື່ອນຫຼັກນຳໃຊ້", key: "D_MAIN_USE_VOLUME" },
  { title: "ເຂື່ອນຫຼັກນຳໃຊ້ສູງສຸດ", key: "D_MAIN_VOLUME" },
  { title: "ເຂື່ອນນ້ຳອ່ວາຍ", key: "D_DIVERSION" },
  { title: "ເຂື່ອນນຳໃຊ້", key: "D_DIVERSION_USE_VOLUME" },
  { title: "ເຂື່ອນນຳໃຊ້ສູງສຸດ", key: "D_DIVERSION_VOLUME" },
  { title: "ພະລັງງານຜະລິດໄດ້", key: "D_ACTUAL_ENERGY" },
  { title: "ແຜນພະລັງງານ", key: "D_PLAN_ENERGY" },
  { title: "ລາຍຮັບ", key: "D_ACTUAL_REVENUE" },
  { title: "ແຜນລາຍຮັບ", key: "D_PLAN_REVENUE" },
  { title: "ແອ່າງເກັບນ້ຳ", key: "D_PLAN_WL" },
  { title: "ອັດຕານ້ຳເຂົ້າ", key: "D_ACTUAL_INFLOW" },
  { title: "ແຜນອັດຕານ້ຳເຂົ້າ", key: "D_INFLOW_PLAN" },
  { title: "ນ້ຳອອກຈາກປະຕູ", key: "D_SPAILWAY" },
  { title: "ນ້ຳໄຫຼຜ່ານຈັກ", key: "D_TAILRACE" },
  { title: "ອັດຕານ້ຳອອກທັງໝົດ", key: "D_TOTAL_OUTFLOW" },
  { title: "ອັດຕານ້ຳຝົນ", key: "D_RAINFAILL" },
];

const setRange = (key, days) => {
  active.value = key;
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - days);

  startPicker.date.value = formatDate(start);
  startPicker.picker.value = new Date(startPicker.date.value);
  endPicker.date.value = formatDate(today);
  endPicker.picker.value = new Date(endPicker.date.value);

  loadData();
};

// ─── API ──────────────────────────────────────────────────
const loadData = async () => {
  loading.value = true;
  try {
    const { data: res } = await axios.get("/api/data/dam", {
      params: {
        start: startPicker.date.value,
        end: endPicker.date.value,
        code: selected.value,
      },
    });
    data.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};
const dams = ref([])
const getBranch = async () => {
  loading.value = true
  try {
    const res = await axios.get("/api/branch",);
    dams.value = res.data.DATA;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

const goToUpload = (item) => {
  nuxtApp.$router.push({
    path: "/dashboard/upload",
    query: ""
  });
};

onMounted(() => {
  loadData();
  getBranch()
})

loadData();


</script>