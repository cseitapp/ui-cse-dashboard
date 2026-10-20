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
        <v-col>
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
      <template #item.D_DATE="{ item }">{{ formatDisplay(item.D_DATE) }}</template>

      <!-- Main dam -->
      <template #item.D_PLAN_WL="{ item }">{{ formatNumber(item.D_PLAN_WL) }}</template>
      <template #item.D_MAIN="{ item }">{{ formatNumber(item.D_MAIN) }}</template>
      <template #item.D_PLAN_MAIN_VOLUME="{ item }">{{ formatNumber(item.D_PLAN_MAIN_VOLUME) }}</template>
      <template #item.D_MAIN_VOLUME="{ item }">{{ formatNumber(item.D_MAIN_VOLUME) }}</template>
      <template #item.D_PLAN_MAIN_USABLE_VOLUME="{ item }">{{ formatNumber(item.D_PLAN_MAIN_USABLE_VOLUME) }}</template>
      <template #item.D_MAIN_USE_VOLUME="{ item }">{{ formatNumber(item.D_MAIN_USE_VOLUME) }}</template>

      <!-- Diversion dam -->
      <template #item.D_PLAN_DIVERSION="{ item }">{{ formatNumber(item.D_PLAN_DIVERSION) }}</template>
      <template #item.D_DIVERSION="{ item }">{{ formatNumber(item.D_DIVERSION) }}</template>
      <template #item.D_PLAN_DIVERSION_VOLUME="{ item }">{{ formatNumber(item.D_PLAN_DIVERSION_VOLUME) }}</template>
      <template #item.D_DIVERSION_VOLUME="{ item }">{{ formatNumber(item.D_DIVERSION_VOLUME) }}</template>
      <template #item.D_PLAN_DIVERSION_USABLE_VOLUME="{ item }">{{ formatNumber(item.D_PLAN_DIVERSION_USABLE_VOLUME)
        }}</template>
      <template #item.D_DIVERSION_USE_VOLUME="{ item }">{{ formatNumber(item.D_DIVERSION_USE_VOLUME) }}</template>

      <!-- Energy & revenue -->
      <template #item.D_ACTUAL_ENERGY="{ item }"><strong>{{ formatNumber(item.D_ACTUAL_ENERGY) }}</strong></template>
      <template #item.D_PLAN_ENERGY="{ item }">{{ formatNumber(item.D_PLAN_ENERGY) }}</template>
      <template #item.D_ACTUAL_REVENUE="{ item }"><strong>{{ formatNumber(item.D_ACTUAL_REVENUE) }}</strong></template>
      <template #item.D_PLAN_REVENUE="{ item }">{{ formatNumber(item.D_PLAN_REVENUE) }}</template>

      <!-- Flow -->
      <template #item.D_ACTUAL_INFLOW="{ item }">{{ formatNumber(item.D_ACTUAL_INFLOW) }}</template>
      <template #item.D_INFLOW_PLAN="{ item }">{{ formatNumber(item.D_INFLOW_PLAN) }}</template>
      <template #item.D_PLAN_TURBINE="{ item }">{{ formatNumber(item.D_PLAN_TURBINE) }}</template>
      <template #item.D_SPAILWAY="{ item }">{{ formatNumber(item.D_SPAILWAY) }}</template>
      <template #item.D_TAILRACE="{ item }">{{ formatNumber(item.D_TAILRACE) }}</template>
      <template #item.D_TOTAL_OUTFLOW="{ item }">{{ formatNumber(item.D_TOTAL_OUTFLOW) }}</template>
      <template #item.D_RAINFAILL="{ item }">{{ formatNumber(item.D_RAINFAILL) }}</template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref } from "vue";
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

  // Main dam
  { title: "ແຜນລະດັບນ້ຳເຂື່ອນຫຼັກ", key: "D_PLAN_WL" },
  { title: "ເຂື່ອນຫຼັກ", key: "D_MAIN" },
  { title: "ແຜນບໍລິມາດນ້ຳເຂື່ອນຫຼັກ", key: "D_PLAN_MAIN_VOLUME" },
  { title: "ບໍລິມາດນ້ຳເຂື່ອນຫຼັກ", key: "D_MAIN_VOLUME" },
  { title: "ແຜນບໍລິມາດນຳໃຊ້ນ້ຳເຂື່ອນຫຼັກ", key: "D_PLAN_MAIN_USABLE_VOLUME" },
  { title: "ບໍລິມາດນຳໃຊ້ນ້ຳເຂື່ອນຫຼັກ", key: "D_MAIN_USE_VOLUME" },

  // Diversion dam
  { title: "ແຜນລະດັບນ້ຳເຂື່ອນນ້ຳອ່ວາຍ", key: "D_PLAN_DIVERSION" },
  { title: "ເຂື່ອນນ້ຳອ່ວາຍ", key: "D_DIVERSION" },
  { title: "ແຜນບໍລິມາດນ້ຳເຂື່ອນອ່ວາຍ", key: "D_PLAN_DIVERSION_VOLUME" },
  { title: "ບໍລິມາດນ້ຳເຂື່ອນອວ່າຍ", key: "D_DIVERSION_VOLUME" },
  { title: "ແຜນບໍລິມາດນຳໃຊ້ເຂື່ອນນອ່ວາຍ", key: "D_PLAN_DIVERSION_USABLE_VOLUME" },
  { title: "ບໍລິມາດນຳໃຊ້ເຂື່ອນອວ່າຍ", key: "D_DIVERSION_USE_VOLUME" },

  // Energy & revenue
  { title: "ພະລັງງານຜະລິດໄດ້", key: "D_ACTUAL_ENERGY" },
  { title: "ແຜນພະລັງງານ", key: "D_PLAN_ENERGY" },
  { title: "ລາຍຮັບ", key: "D_ACTUAL_REVENUE" },
  { title: "ແຜນລາຍຮັບ", key: "D_PLAN_REVENUE" },

  // Flow
  { title: "ອັດຕານ້ຳເຂົ້າ", key: "D_ACTUAL_INFLOW" },
  { title: "ແຜນອັດຕານ້ຳເຂົ້າ", key: "D_INFLOW_PLAN" },
  { title: "ແຜນນ້ຳໄຫຼຜ່ານຈັກ", key: "D_PLAN_TURBINE" },
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
    console.log(data.value)
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