<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    ToolboxComponent,
    MarkPointComponent
} from 'echarts/components'

use([
    CanvasRenderer,
    LineChart,
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    ToolboxComponent,
    MarkPointComponent
])

const FONT = "'Noto Sans Lao', sans-serif"

const props = defineProps({
    title: String,
    data: {
        type: Array,
        default: () => []
    },
    xField: {
        type: String,
        default: 'datetime'
    },
    // [{ field: 'D_MAIN_VOLUME', label: 'ຊື່', color?: '#...' }]
    series: {
        type: Array,
        default: () => []
    },
    smooth: {
        type: Boolean,
        default: false
    }
})

const sortedData = computed(() =>
    [...props.data].sort(
        (a, b) => new Date(a[props.xField]) - new Date(b[props.xField])
    )
)

// A value counts when it is a number (and > 0 unless hideZero is false)
const isValid = (v, s) => {
    const n = Number(v)
    if (v === null || v === undefined || v === '' || Number.isNaN(n)) return false
    return s.hideZero === false || n > 0
}

// Series with no valid value at all are removed (line and legend)
const visibleSeries = computed(() =>
    props.series.filter(s => sortedData.value.some(i => isValid(i[s.field], s)))
)

const markPointOption = {
    symbolSize: 60,
    label: { fontFamily: FONT, fontSize: 11, color: '#fff' },
    data: [
        { type: 'max', name: 'ສູງສຸດ' },
        { type: 'min', name: 'ຕ່ຳສຸດ' }
    ]
}

const option = computed(() => ({
    title: {
        text: props.title,
        textStyle: { fontFamily: FONT, fontSize: 18 }
    },
    tooltip: {
        trigger: 'axis',
        textStyle: { fontFamily: FONT, fontSize: 13 }
    },
    toolbox: {
        feature: {
            dataZoom: { yAxisIndex: 'none' },
            restore: {},
            saveAsImage: {}
        }
    },
    legend: {
        textStyle: { fontFamily: FONT, fontSize: 13 },
        data: visibleSeries.value.map(s => s.label)
    },
    grid: { left: 50, right: 20, bottom: 70 },
    xAxis: {
        type: 'category',
        axisLabel: { fontFamily: FONT, fontSize: 13 },
        data: sortedData.value.map(i => i[props.xField])
    },
    yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { fontFamily: FONT, fontSize: 13 }
    },
    dataZoom: [{ type: 'inside' }, { type: 'slider' }],
    series: visibleSeries.value.map(s => ({
        name: s.label,
        type: 'line',
        smooth: props.smooth,
        showSymbol: false,
        ...(s.color && {
            itemStyle: { color: s.color },
            lineStyle: { color: s.color }
        }),
        connectNulls: s.connectNulls ?? false,
        data: sortedData.value.map(i =>
            isValid(i[s.field], s) ? Number(i[s.field]) : null
        ),
        markPoint: s.markPoint ? markPointOption : undefined
    }))
}))
</script>

<template>
    <VChart :option="option" autoresize />
</template>