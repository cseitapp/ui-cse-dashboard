<template>
  <v-container>

    <h3>ລາຍງານ ພະລັງງານ ແລະ ລະດັບນ້ຳ</h3>

    <!-- 📅 DATE RANGE -->
    <v-row class="mt-2 d-flex align-center" >
      <v-col cols="12" md="3">
        <v-text-field
          v-model="startDate"
          label="Start Date"
          type="date"
          density="comfortable"
        />
      </v-col>

      <v-col cols="12" md="3" >
        <v-text-field
        density="comfortable"
          v-model="endDate"
          label="End Date"
          type="date"
        />
      </v-col>

      <v-col cols="12" md="3" class="d-flex align-center">
        <v-btn color="primary" @click="loadData">
          Search
        </v-btn>
      </v-col>
    </v-row>
    <v-row class="mb-2">

  <!-- 📅 Quick Filters -->
  <v-col cols="12" md="6">
    <v-btn-group density="compact">
      <v-btn :color="active === 'today' ? 'primary' : ''" @click="setRange('today')">Today</v-btn>
      <v-btn :color="active === '3days' ? 'primary' : ''" @click="setRange('3days')">3 Days</v-btn>
      <v-btn :color="active === '7days' ? 'primary' : ''" @click="setRange('7days')">7 Days</v-btn>
    </v-btn-group>
  </v-col>

</v-row>
    <!-- 📊 DATA TABLE -->
    <v-data-table
      :headers="headers"
      :items="data"
      :loading="loading"
      class="elevation-2"
    >
      <template #item.datetime="{ item }">
        {{ formatDate(item.datetime) }}
      </template>

      <template #item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <template #item.total_power="{ item }">
        <strong>{{ item.total_power }}</strong>
      </template>
    </v-data-table>

  </v-container>
</template>
<script setup>
import { ref } from "vue";
import axios from "axios";

const data = ref([]);
const loading = ref(false);
const active = ref("today");

const startDate = ref("2026-03-27");
const endDate = ref("2026-04-27");

const headers = [
  { title: "ID", key: "id" },
  { title: "ວັນ ແລະ ເວລາ", key: "datetime" },
  { title: "ເຂື່ອນຫຼັກ", key: "Main_dam" },
  { title: "ເຂື່ອນອ່ວາຍນ້ຳ", key: "diversion_dam" },
  { title: "ກຳລັງຜະລິດຈັກເບີ 1", key: "unit1_power" },
  { title: "ກຳລັງຜະລິດຈັກເບີ 2", key: "unit2_power" },
  { title: "ລວມກຳລັງຜະລິດ", key: "total_power" },
  { title: "ອັດຕາການນ້ຳໃຊ້ນ້ຳຈັກເບີ 1", key: "unit1_water" },
  { title: "ອັດຕາການນ້ຳໃຊ້ນ້ຳຈັກເບີ 2", key: "unit2_water" },
  { title: "ວັນ ແລະ ເວລາ ອັບໂຫຼດ", key: "created_at" },
];

const loadData = async () => {
  loading.value = true;

  try {
    const res = await axios.get("/api/energy", {
      params: {
        start: startDate.value,
        end: endDate.value,
      },
    });

    data.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString();
};

const setRange = (type) => {
  active.value = type;
  const today = new Date();

  let start = new Date();

  if (type === "today") {
    start = new Date();
  }

  if (type === "3days") {
    start.setDate(today.getDate() - 3);
  }

  if (type === "7days") {
    start.setDate(today.getDate() - 7);
  }

  startDate.value = formatInputDate(start);
  endDate.value = formatInputDate(today);

  loadData();
};

// format YYYY-MM-DD for input
const formatInputDate = (date) => {
  return date.toISOString().split("T")[0];
};

loadData();
</script>