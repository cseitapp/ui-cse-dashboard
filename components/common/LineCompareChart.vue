<template>
  <Line :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import moment from 'moment'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
)

const props = defineProps({
  allData: { type: Array, default: () => [] },
  title: { type: String, default: 'Line Chart' },
  dataLabel: { type: String, default: 'ຕົວຈິງ' },
  planLabel: { type: String, default: 'ແຜນ' },
  dataField: { type: String, default: 'Main_dam' },
  planField: { type: String, default: 'diversion_dam' },
})

const toNumber = (value) => {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const chartData = computed(() => ({
  labels: props.allData.map(item =>
    item.datetime ? moment(item.datetime).format('DD/MM/YYYY HH:mm') : ''
  ),
  datasets: [
    {
      label: props.dataLabel,
      data: props.allData.map(item => toNumber(item[props.dataField])),  // Main_dam
      borderColor: '#42A5F5',
      backgroundColor: '#42A5F5',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6
    },
    {
      label: props.planLabel,
      data: props.allData.map(item => toNumber(item[props.planField])),  // diversion_dam
      borderColor: '#EF5350',
      backgroundColor: '#EF5350',
      tension: 0.3,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 13 },
      },
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: { family: "'Noto Sans Lao', sans-serif", size: 18 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed.y
          if (value == null) return `${ctx.dataset.label}: -`
          return `${ctx.dataset.label}: ${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}`
        },
      },
    },
    datalabels: {
      display: false,  
    },
  },
  scales: {
    x: {
      ticks: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 12 },
        maxTicksLimit: 12,
        autoSkip: true,
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: false,
      title: {
        display: true,
        text: 'ລະດັບນ້ຳ (m)',
        font: { family: "'Noto Sans Lao', sans-serif", size: 13 },
      },
      ticks: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 12 },
        callback: val => val.toLocaleString(),
      },
    },
  },
}))
</script>