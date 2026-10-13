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
    MarkPointComponent,
    MarkLineComponent
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
    MarkPointComponent,
    MarkLineComponent
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
    planLabel: String,
    dark: { type: Boolean, default: false },
    dayOnlyLabels: { type: Boolean, default: false },
    currentMarker: {
        type: Object,
        default: null
    }
})

function formatXAxisLabel(value) {
    if (!props.dayOnlyLabels) return value
    const label = String(value ?? '')
    const dateParts = label.match(/^\d{4}[-/]\d{1,2}[-/](\d{1,2})/)
    return dateParts ? dateParts[1].padStart(2, '0') : label
}

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

function numericValue(value) {
    if (value === undefined || value === null || value === '') return null
    const parsed = Number(String(value).replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
}

function valuesForSeries(series) {
    if (series.referenceLine) {
        const referenceValue = sortedData.value
            .map(row => numericValue(row[series.field]))
            .find(value => value !== null)
        return sortedData.value.map(() => referenceValue ?? null)
    }

    return sortedData.value.map(row => numericValue(row[series.field]))
}

const markPointOption = {
    symbolSize: 60,
    label: { fontFamily: FONT, fontSize: 11, color: '#fff' },
    data: [
        { type: 'max', name: 'ສູງສຸດ' },
        { type: 'min', name: 'ຕ່ຳສຸດ' }
    ]
}

const option = computed(() => ({
    backgroundColor: 'transparent',
    textStyle: { color: props.dark ? '#8f96a1' : '#333', fontFamily: FONT },
    title: {
        text: props.title,
        textStyle: { color: props.dark ? '#f4f5f7' : '#333', fontFamily: FONT, fontSize: 18 }
    },
    tooltip: {
        trigger: 'axis',
        backgroundColor: props.dark ? '#252930' : undefined,
        borderColor: props.dark ? '#3b404a' : undefined,
        textStyle: { color: props.dark ? '#f7f8fa' : undefined, fontFamily: FONT, fontSize: 13 }
    },
    toolbox: {
        show: true,
        iconStyle: { borderColor: props.dark ? '#7f8792' : '#666' },
        emphasis: { iconStyle: { borderColor: props.dark ? '#ff8a1f' : '#1976d2' } },
        feature: {
            dataZoom: { yAxisIndex: 'none' },
            dataView: { readOnly: false },
            magicType: {},
            restore: {},
            saveAsImage: {}
        }
    },
    legend: {
        top: 4,
        textStyle: { color: props.dark ? '#8f96a1' : '#333', fontFamily: FONT, fontSize: 13 },
        data: seriesList.value.filter(s => !s.hideInLegend).map(s => s.label)
    },
    grid: { left: 50, right: 20, top: 48, bottom: 70 },
    xAxis: {
        type: 'category',
        axisLabel: {
            color: props.dark ? '#8f96a1' : '#666',
            fontFamily: FONT,
            fontSize: 13,
            formatter: formatXAxisLabel
        },
        axisLine: { lineStyle: { color: props.dark ? 'rgba(255,255,255,.1)' : '#ccc' } },
        axisTick: { lineStyle: { color: props.dark ? 'rgba(255,255,255,.1)' : '#ccc' } },
        data: sortedData.value.map(i => i[props.xField])
    },
    yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: props.dark ? '#8f96a1' : '#666', fontFamily: FONT, fontSize: 13 },
        splitLine: { lineStyle: { color: props.dark ? 'rgba(255,255,255,.08)' : '#e5e5e5', type: props.dark ? 'dashed' : 'solid' } }
    },
    dataZoom: [{ type: 'inside' }, {
        type: 'slider',
        borderColor: props.dark ? '#343842' : '#ddd',
        backgroundColor: props.dark ? '#17191e' : '#fff',
        fillerColor: props.dark ? 'rgba(255,122,0,.12)' : 'rgba(25,118,210,.12)',
        textStyle: { color: props.dark ? '#8f96a1' : '#666' },
        labelFormatter: formatXAxisLabel
    }],

    // one series per item in seriesList
    series: seriesList.value.map((s, index) => ({
        name: s.label,
        type: 'line',
        smooth: s.referenceLine ? false : (s.smooth ?? true),
        showSymbol: s.showSymbol ?? false,
        connectNulls: true,
        z: s.referenceLine ? 2 : 3,
        lineStyle: {
            width: s.width ?? (s.referenceLine ? 1.75 : 2.5),
            type: s.lineType ?? (s.referenceLine ? 'dashed' : 'solid'),
            opacity: s.opacity ?? 1,
            ...(s.color ? { color: s.color } : {})
        },
        areaStyle: s.referenceLine || s.area === false ? undefined : { opacity: props.dark ? 0.12 : 0.25 },
        ...(s.color && {
            itemStyle: { color: s.color },
        }),
        data: valuesForSeries(s),
        markPoint: s.referenceLine || s.markPoint === false ? undefined : markPointOption,
        markLine: index === 0 && props.currentMarker?.value ? {
            silent: true,
            symbol: ['none', 'none'],
            animation: false,
            lineStyle: {
                color: props.currentMarker.color || '#ff6673',
                width: 2.25,
                type: 'solid',
                shadowBlur: 6,
                shadowColor: 'rgba(255,102,115,.32)'
            },
            label: {
                show: true,
                position: 'insideEndTop',
                formatter: props.currentMarker.label || 'Latest update',
                color: '#fff',
                backgroundColor: props.currentMarker.color || '#e85564',
                borderRadius: 6,
                padding: [5, 8],
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700
            },
            data: [{ xAxis: props.currentMarker.value }]
        } : undefined
    }))
}))
</script>

<template>
    <VChart :option="option" autoresize />
</template>
