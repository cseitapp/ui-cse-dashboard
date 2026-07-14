<template>
  <PolarArea :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
} from 'chart.js'
import { PolarArea } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
)

const backgroundColors = [
  '#42A5F5',
  '#66BB6A',
  '#FFA726',
  '#AB47BC',
  '#EC407A',
  '#26C6DA',
  '#FF7043',
]

const props = defineProps({
  items: { type: Array, default: () => [] },
  title: { type: String, default: 'Polar Area Chart' },
  dataKey: { type: String, default: 'data' },
  label: { type: String, default: 'Value' },
})

const chartData = computed(() => ({
  labels: props.items.map(item => item.code),
  datasets: [
    {
      label: props.label,
      data: props.items.map(item => item[props.dataKey]),
      backgroundColor: backgroundColors,
      borderWidth: 1,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 13 },
      },
    },
    title: {
      display: true,
      text: props.title,
      font: { family: "'Noto Sans Lao', sans-serif", size: 18 },
    },
  },
  scales: {
    r: {
      ticks: {
        backdropColor: 'transparent',
        font: { family: "'Noto Sans Lao', sans-serif", size: 11 },
      },
      pointLabels: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 12 },
      },
    },
  },
}))
</script>
