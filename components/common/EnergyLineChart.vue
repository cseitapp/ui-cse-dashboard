<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { computed } from 'vue'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ChartDataLabels
)

const DEFAULT_FIELD_LABELS = {
  total_power: 'ລວມກຳລັງຜະລິດ',
  energy_planning: 'ແຜນພະລັງງານ',
}

const props = defineProps({
  allData: {
    type: Array,
    default: () => [],
  },
  yAxisLabel: {
    type: String,
    default: 'MW',
  },
  fields: {
    type: Array,
    default: () => ['total_power', 'energy_planning'],
  },
  fieldLabels: {
    type: Object,
    default: () => ({}),
  },
  colors: {
    type: Object,
    default: () => ({}),
  },
  title: {
    type: String,
    default: '',
  },
  extraOptions: {
    type: Object,
    default: () => ({}),
  },
  activeType: {
    type: String,
    default: 'Y',
  },
})

// Fields actually rendered — drops energy_planning for D/H granularity
const visibleFields = computed(() =>
  ['D', 'H'].includes(props.activeType)
    ? props.fields.filter(f => f !== 'energy_planning')
    : props.fields
)

const defaultColors = [
  '#1D63B8',
  '#00277c',
  '#FFA726',
  '#AB47BC',
  '#EF5350',
  '#26C6DA',
]
const getFieldLabel = (field) =>
  props.fieldLabels[field] ?? DEFAULT_FIELD_LABELS[field] ?? field
const getFieldColor = (field, index) =>
  props.colors[field] ?? defaultColors[index % defaultColors.length]
const toNumber = (value) => {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const chartData = computed(() => ({
  labels: props.allData.map(item => item.period ?? ''),
  datasets: visibleFields.value.map((field, index) => ({
    label: getFieldLabel(field),
    data: props.allData.map(item => toNumber(item[field])),
    backgroundColor: getFieldColor(field, index),
    borderRadius: 4,
  })),
}))
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  ...props.extraOptions,
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
      font: {
        family: "'Noto Sans Lao', sans-serif",
        size: 18,
      },
    },
    datalabels: {
      anchor: 'center',
      align: 'center',
      color: '#fff',
      rotation: -90,
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
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const value = ctx.parsed.y
          if (value == null) return `${ctx.dataset.label}: -`
          return `${ctx.dataset.label}: ${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${props.yAxisLabel}`
        },
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'ໄລຍະເວລາ',
        font: { family: "'Noto Sans Lao', sans-serif", size: 13 },
      },
      ticks: {
        font: { family: "'Noto Sans Lao', sans-serif", size: 12 },
        maxTicksLimit: 12,
        autoSkip: true,
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: props.yAxisLabel,
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