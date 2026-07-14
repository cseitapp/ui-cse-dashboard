<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels,
)

const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: 'ສະຫຼຸບພະລັງງານ' },
})

const chartData = computed(() => ({
  labels: props.items.map(i => i.dam_code),
  datasets: [
    {
      label: 'ແຜນ',
      data: props.items.map(i => parseFloat(i.energy) || null),
      backgroundColor: '#26C6DA',
    },
    {
      label: 'ລວມພະລັງງານ',
      data: props.items.map(i => i.total_power || null),
      backgroundColor: '#42A5F5',
    },
    {
      label: 'ຈັກເບີ 1',
      data: props.items.map(i => i.unit1_power || null),
      backgroundColor: '#85adad',
    },
    {
      label: 'ຈັກເບີ 2',
      data: props.items.map(i => i.unit2_power || null),
      backgroundColor: '#75a3a3',
    },
    {
      label: 'Level 1',
      data: props.items.map(i => i.level1 || null),
      backgroundColor: '#00e6ac',
    },
    {
      label: 'Level 2',
      data: props.items.map(i => i.level2 || null),
      backgroundColor: '#00ffbf',
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { font: { family: "'Noto Sans Lao', sans-serif", size: 13 } },
    },
    title: {
      display: true,
      text: props.title,
      font: { family: "'Noto Sans Lao', sans-serif", size: 18 },
    },
    datalabels: {
      anchor: 'center',
      align: 'center',
      color: '#fff',
      font: {
        family: "'Noto Sans Lao', sans-serif",
        size: 11,
        weight: 'bold',
      },
      formatter: value => {
        if (!value || value === 0) return ''
        return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
      },
    },
  },
  scales: {
    x: {
      ticks: { font: { family: "'Noto Sans Lao', sans-serif", size: 13 } },
    },
    y: {
      beginAtZero: true,
      ticks: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 13 },
        callback: val => val.toLocaleString(),
      },
    },
  },
}))
</script>
