<template>
    <h4>ການຜະລິດ (Energy Chart)</h4>
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

    <v-row>
      <v-col cols="8">
        <canvas ref="chartRef"></canvas>
      </v-col>
    </v-row>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import axios from "axios";
import Chart from "chart.js/auto";

definePageMeta({
  layout: "default",
  middleware: "auth",
});


const data = ref([]);
const chartRef = ref(null);
let chartInstance = null;
const active = ref("today");


const startDate = ref("2026-03-27");
const endDate = ref("2026-04-27");

const loadData = async () => {
  try {
    const res = await axios.get("/api/energy", {
      params: {
        start: startDate.value,
        end: endDate.value,
      },
    });

    data.value = res.data.data;

    renderChart(); // 👈 draw chart after data load
  } catch (err) {
    console.error(err);
  }
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
const formatInputDate = (date) => {
  return date.toISOString().split("T")[0];
};
// 🔥 Create chart
const renderChart = () => {
  if (!chartRef.value) return;

  // destroy old chart (important)
  if (chartInstance) {
    chartInstance.destroy();
  }

  const labels = data.value.map(item =>
    new Date(item.datetime).toLocaleString()
  );

  const values = data.value.map(item => item.total_power);

  chartInstance = new Chart(chartRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total Power",
          data: values,
          borderWidth: 2,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
    },
  });
};

// load on mount
onMounted(() => {
  loadData();
});
</script>