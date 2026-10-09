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

    // NEW: any number of lines.
    // [{ field: 'D_MAIN_VOLUME', label: 'ຊື່', color?: '#...', area?: true, markPoint?: true }]
    series: {
        type: Array,
        default: () => []
    },

    // OLD props (still work if `series` is not passed)
    dataField: String,
    planField: String,
    dataLabel: String,
    planLabel: String
})

// Use `series` if given, otherwise fall back to the old two-line props
const seriesList = computed(() => {
    if (props.series.length) return props.series
    const list = []
    if (props.dataField) list.push({ field: props.dataField, label: props.dataLabel })
    if (props.planField) list.push({ field: props.planField, label: props.planLabel })
    return list
})

const sortedData = computed(() =>
    [...props.data].sort(
        (a, b) => new Date(a[props.xField]) - new Date(b[props.xField])
    )
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
        show: true,
        feature: {
            dataZoom: { yAxisIndex: 'none' },
            dataView: { readOnly: false },
            magicType: {},
            restore: {},
            saveAsImage: {}
        }
    },
    legend: {
        textStyle: { fontFamily: FONT, fontSize: 13 },
        data: seriesList.value.map(s => s.label)
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

    // one series per item in seriesList
    series: seriesList.value.map(s => ({
        name: s.label,
        type: 'line',
        smooth: true,
        areaStyle: s.area === false ? undefined : {},
        ...(s.color && {
            itemStyle: { color: s.color },
            lineStyle: { color: s.color }
        }),
        data: sortedData.value.map(i => Number(i[s.field])),
        markPoint: s.markPoint === false ? undefined : markPointOption
    }))
}))
</script>

<template>
    <VChart :option="option" autoresize />
</template>