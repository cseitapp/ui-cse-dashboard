<template>
  <v-container>
    <h3>ລາຍງານ ພະລັງງານ ແລະ ລະດັບນ້ຳ</h3>

    <v-card class="mb-3" elevation="0" rounded="lg" >
      <!-- 📅 DATE RANGE -->
      <v-row class="ma-0 mt-5" >
        <v-col cols="12" md="3" v-if="role === 'ADMIN' || role === 'DIRECTOR'">
          <v-select v-model="selected" :items="damOptions" item-title="name" item-value="value" variant="outlined"
            density="compact" color="primary" placeholder="ກະລຸນາເລືອກເຂື່ອນ" />
        </v-col>

        <v-col v-for="picker in datePickers" :key="picker.label" cols="12" md="3">
          <v-menu v-model="picker.menu.value" :close-on-content-click="false" transition="scale-transition" offset-y
            min-width="auto">
            <template #activator="{ props }">
              <v-text-field color="primary" v-bind="props" v-model="picker.date.value" :label="picker.label"
                variant="outlined" density="compact" prepend-inner-icon="mdi-calendar" readonly />
            </template>
            <v-date-picker hide-header="true" v-model="picker.picker.value"
              @update:model-value="(val) => onDateSelected(val, picker)" />
          </v-menu>
        </v-col>

        <v-col cols="12" md="3">
          <v-btn color="primary" prepend-icon="mdi-magnify" variant="outlined" @click="loadData">ຄົ້ນຫາ</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-row class="mb-2">
      <v-col cols="12" md="6">
        <v-btn-group :border="true" density="compact" >
          <v-btn v-for="range in quickRanges" :key="range.key" :color="active === range.key ? 'primary' : ''"
            @click="setRange(range.key, range.days)">
            {{ range.label }}
          </v-btn>
        </v-btn-group>
      </v-col>
    </v-row>

    <!-- 📊 DATA TABLE -->
    <v-data-table :headers="headers"  :items="data" :loading="loading" class="elevation-0 mt-4 rounded-lg border">
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

const startPicker = createDatePicker("ວັນທີ່ເລີ່ມຕົ້ນ",today);
const endPicker = createDatePicker("ວັນທີ່ສິ້ນສຸດ",today);
const datePickers = [startPicker, endPicker];

const onDateSelected = (val, picker) => {
  picker.date.value = formatDate(new Date(val));
  picker.menu.value = false;
};

// ─── Options ──────────────────────────────────────────────
const damOptions = [
  { value: "CSE", name: "ສຳນັກງານໃຫຍ່" },
  { value: "NEM", name: "ເຂື່ອນນ້ຳອີ່ມູນ" },
  { value: "NK2", name: "ເຂື່ອນນ້ຳກົງ 2" },
  { value: "NK3", name: "ເຂື່ອນນ້ຳກົງ 3" },
  { value: "EE", name: "ເຂື່ອນນ້ຳເທີນ" },
];

const quickRanges = [
  { key: "today", label: "Today", days: 0 },
  { key: "3days", label: "3 Days", days: 3 },
  { key: "7days", label: "7 Days", days: 7 },
];

const headers = [
  { title: "ວັນ ແລະ ເວລາ", key: "datetime" },
  { title: "ເຂື່ອນຫຼັກ", key: "Main_dam" },
  { title: "ເຂື່ອນອ່ວາຍນ້ຳ", key: "diversion_dam" },
  { title: "ກຳລັງຜະລິດຈັກເບີ 1", key: "unit1_power" },
  { title: "ກຳລັງຜະລິດຈັກເບີ 2", key: "unit2_power" },
  { title: "ລວມກຳລັງຜະລິດ", key: "total_power" },
  { title: "ອັດຕາການນ້ຳໃຊ້ນ້ຳຈັກເບີ 1", key: "unit1_water" },
  { title: "ອັດຕາການນ້ຳໃຊ້ນ້ຳຈັກເບີ 2", key: "unit2_water" },
];


// ─── Helpers ──────────────────────────────────────────────
const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDisplay = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
};
const formatNumber = (val) => val != null ? Number(val).toFixed(3) : "-";

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
    const { data: res } = await axios.get("/api/energy", {
      params: {
        start: startPicker.date.value,
        end: endPicker.date.value,
        code: selected.value,
      },
    });
    data.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// ─── Init ─────────────────────────────────────────────────
loadData();
</script>