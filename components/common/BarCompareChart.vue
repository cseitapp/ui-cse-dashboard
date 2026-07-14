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
  title: { type: String, default: 'Data vs Plan' },
  dataLabel: { type: String, default: 'ຕົວຈິງ' },
  planLabel: { type: String, default: 'ແຜນ' },
  totalLabel: { type: String, default: '' },
  percentLabel: { type: String, default: '' },
  extraOptions: { type: Object, default: () => ({}) },
})

const chartData = computed(() => {
  const datasets = [
    {
      label: props.dataLabel,
      data: props.items.map(i => i.data),
      backgroundColor: '#42A5F5',
    },
    {
      label: props.planLabel,
      data: props.items.map(i => i.plan),
      backgroundColor: '#42A5A5',
    },
  ]

  if (props.percentLabel) {
    datasets.push({
      label: props.percentLabel,
      data: props.items.map(i => i.percent ?? 0),
      backgroundColor: '#66BB6A',
      yAxisID: 'yPercent',
    })
  }

  if (props.totalLabel) {
    datasets.push({
      label: props.totalLabel,
      data: props.items.map(i => i.total ?? 0),
      backgroundColor: '#FFA726',
    })
  }

  return { labels: props.items.map(i => i.code), datasets }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.extraOptions,
  plugins: {
    legend: {
      position: 'top',
      labels: { font: { family: "'Noto Sans Lao', sans-serif", size: 14 } },
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
        size: 12,
        weight: 'bold',
      },
      formatter: (value, ctx) => {
        if (props.percentLabel && ctx.datasetIndex === 2) {
          return value + '%'
        }
        if (value == null || value === 0) return ''
        return Number(value).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      },
    },
  },
  scales: {
    x: { ticks: { font: { family: "'Noto Sans Lao', sans-serif", size: 13 } } },
    y: {
      beginAtZero: true,
      ticks: { font: { family: "'Noto Sans Lao', sans-serif", size: 13 } },
    },
    yPercent: {
      display: !!props.percentLabel,
      position: 'right',
      beginAtZero: true,
      grid: { drawOnChartArea: false },
      ticks: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 13 },
        callback: val => val + '%',
      },
    },
  },
}))
</script>
