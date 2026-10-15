<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
const isCompact = ref(false)

function syncChartLayout() {
    isCompact.value = window.innerWidth <= 560
}

onMounted(() => {
    syncChartLayout()
    window.addEventListener('resize', syncChartLayout, { passive: true })
})

onBeforeUnmount(() => window.removeEventListener('resize', syncChartLayout))

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
    // tag each data line with its value at the currentMarker date
    showLatestValues: { type: Boolean, default: false },
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

// Tag each data line with its value at the "latest data" marker date.
// Actual lines are tagged left of the marker, plan lines (dashed / *PLAN* field) right,
// so an actual value and its plan never overlap.
function isPlanSeries(series) {
    return series.lineType === 'dashed' || /PLAN/i.test(String(series.field || ''))
}

function latestValueMarkPoints(series, values) {
    const markerX = props.currentMarker?.value
    if (!props.showLatestValues || !markerX || series.referenceLine || series.hideInLegend) return []
    const index = sortedData.value.findIndex(row => row[props.xField] === markerX)
    const value = index >= 0 ? values[index] : null
    if (value === null || value === undefined) return []

    const color = series.color || '#4fe0dc'
    const onLeft = !isPlanSeries(series)
    // small quantities (e.g. volume in MCM) need a third decimal
    const digits = Math.abs(Number(value)) < 10 ? 3 : 2
    return [{
        name: 'ລ່າສຸດ',
        coord: [markerX, value],
        value,
        symbol: 'circle',
        symbolSize: isCompact.value ? 7 : 9,
        itemStyle: { color, borderColor: '#f1fcff', borderWidth: 2 },
        label: {
            show: true,
            position: onLeft ? 'left' : 'right',
            distance: 8,
            formatter: () => Number(value).toFixed(digits),
            color: '#06263a',
            backgroundColor: color,
            borderRadius: 6,
            padding: isCompact.value ? [2, 5] : [3, 7],
            fontFamily: FONT,
            fontSize: isCompact.value ? 9 : 11,
            fontWeight: 800
        }
    }]
}

const markPointOption = {
    symbolSize: 50,
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
        confine: true,
        padding: isCompact.value ? [7, 9] : undefined,
        backgroundColor: props.dark ? 'rgba(7, 38, 62, 0.94)' : undefined,
        borderColor: props.dark ? 'rgba(112, 227, 230, 0.32)' : undefined,
        borderWidth: 1,
        textStyle: { color: props.dark ? '#f7f8fa' : undefined, fontFamily: FONT, fontSize: isCompact.value ? 10 : 13 },
        extraCssText: `max-width:calc(100% - ${isCompact.value ? 12 : 16}px);white-space:normal;overflow-wrap:anywhere;border-radius:12px;${props.dark ? 'box-shadow:0 12px 28px rgba(1,13,38,.55);backdrop-filter:blur(8px);' : ''}`
    },
    toolbox: {
        show: true,
        top: isCompact.value ? 28 : 30,
        right: 4,
        itemSize: isCompact.value ? 13 : 15,
        itemGap: isCompact.value ? 6 : 10,
        iconStyle: { borderColor: props.dark ? '#8fb3c1' : '#666' },
        emphasis: { iconStyle: { borderColor: props.dark ? '#4fe0dc' : '#1976d2', textFill: props.dark ? '#4fe0dc' : undefined } },
        feature: {
            dataZoom: { yAxisIndex: 'none' },
            dataView: { readOnly: false },
            magicType: {},
            restore: {},
            saveAsImage: {}
        }
    },
    legend: {
        type: 'scroll',
        orient: 'horizontal',
        top: 0,
        left: 'center',
        right: 'auto',
        width: isCompact.value ? '96%' : '90%',
        icon: props.dark ? 'circle' : undefined,
        itemWidth: props.dark ? (isCompact.value ? 8 : 10) : (isCompact.value ? 13 : 25),
        itemHeight: props.dark ? (isCompact.value ? 8 : 10) : (isCompact.value ? 8 : 14),
        itemGap: props.dark ? (isCompact.value ? 12 : 22) : (isCompact.value ? 7 : 10),
        inactiveColor: props.dark ? 'rgba(143, 179, 193, 0.32)' : undefined,
        pageIconSize: isCompact.value ? 10 : 12,
        pageButtonGap: isCompact.value ? 4 : 6,
        pageIconColor: props.dark ? '#4fe0dc' : undefined,
        pageIconInactiveColor: props.dark ? 'rgba(143, 179, 193, 0.3)' : undefined,
        pageTextStyle: { color: props.dark ? '#a3c7d3' : '#333', fontFamily: FONT },
        textStyle: {
            color: props.dark ? '#cfe5ec' : '#333',
            fontFamily: FONT,
            fontSize: isCompact.value ? 10.5 : 12.5,
            fontWeight: 600,
            lineHeight: isCompact.value ? 17 : 20,
            padding: props.dark ? [0, 0, 0, 2] : undefined
        },
        data: seriesList.value.filter(s => !s.hideInLegend).map(s => s.label)
    },
    grid: {
        left: isCompact.value ? 42 : 50,
        right: isCompact.value ? 12 : 20,
        top: isCompact.value ? 64 : 66,
        bottom: isCompact.value ? 58 : 70
    },
    xAxis: {
        type: 'category',
        axisLabel: {
            color: props.dark ? '#93b4c1' : '#666',
            fontFamily: FONT,
            fontSize: isCompact.value ? 10 : 12,
            hideOverlap: true,
            formatter: formatXAxisLabel
        },
        axisLine: { lineStyle: { color: props.dark ? 'rgba(255,255,255,.1)' : '#ccc' } },
        axisTick: { lineStyle: { color: props.dark ? 'rgba(255,255,255,.1)' : '#ccc' } },
        data: sortedData.value.map(i => i[props.xField])
    },
    yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { color: props.dark ? '#93b4c1' : '#666', fontFamily: FONT, fontSize: isCompact.value ? 10 : 12, hideOverlap: true },
        splitLine: { lineStyle: { color: props.dark ? 'rgba(150, 210, 225, 0.1)' : '#e5e5e5', type: props.dark ? 'dashed' : 'solid' } }
    },
    // always open on the full selected date range
    dataZoom: [{ type: 'inside', start: 0, end: 100 }, {
        type: 'slider',
        start: 0,
        end: 100,
        bottom: isCompact.value ? 4 : undefined,
        height: isCompact.value ? 16 : undefined,
        handleSize: isCompact.value ? 12 : undefined,
        borderColor: props.dark ? 'rgba(112, 227, 230, 0.18)' : '#ddd',
        borderRadius: props.dark ? 8 : undefined,
        backgroundColor: props.dark ? 'rgba(4, 30, 56, 0.45)' : '#fff',
        fillerColor: props.dark ? 'rgba(79, 224, 220, 0.14)' : 'rgba(25,118,210,.12)',
        dataBackground: props.dark ? {
            lineStyle: { color: 'rgba(79, 224, 220, 0.45)', width: 1 },
            areaStyle: { color: 'rgba(79, 224, 220, 0.12)' }
        } : undefined,
        selectedDataBackground: props.dark ? {
            lineStyle: { color: '#4fe0dc', width: 1 },
            areaStyle: { color: 'rgba(79, 224, 220, 0.22)' }
        } : undefined,
        handleStyle: props.dark ? { color: '#4fe0dc', borderColor: '#f1fcff', borderWidth: 1.5 } : undefined,
        moveHandleStyle: props.dark ? { color: 'rgba(79, 224, 220, 0.5)' } : undefined,
        emphasis: props.dark ? { handleStyle: { color: '#7ff0ec' }, moveHandleStyle: { color: '#4fe0dc' } } : undefined,
        textStyle: { color: props.dark ? '#93b4c1' : '#666', fontSize: isCompact.value ? 9 : 11 },
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
        labelLayout: isCompact.value ? { hideOverlap: true, moveOverlap: 'shiftY' } : undefined,
        data: valuesForSeries(s),
        markPoint: (() => {
            const pins = s.referenceLine || s.markPoint === false ? [] : markPointOption.data
            const latest = latestValueMarkPoints(s, valuesForSeries(s))
            if (!pins.length && !latest.length) return undefined
            return {
                ...markPointOption,
                symbolSize: isCompact.value ? 32 : markPointOption.symbolSize,
                label: {
                    ...markPointOption.label,
                    fontSize: isCompact.value ? 7.5 : markPointOption.label.fontSize
                },
                data: [...pins, ...latest]
            }
        })(),
        markLine: index === 0 && props.currentMarker?.value ? {
            silent: true,
            symbol: ['none', 'none'],
            animation: false,
            lineStyle: {
                color: props.currentMarker.color || '#ff6673',
                width: 1.75,
                type: props.currentMarker.lineType || 'solid',
                shadowBlur: 6,
                shadowColor: props.currentMarker.shadowColor || 'rgba(228, 243, 248, 0.35)'
            },
            label: {
                show: true,
                position: 'insideEndTop',
                rotate: 0,
                align: 'left',
                verticalAlign: 'middle',
                offset: [10, 0],
                formatter: props.currentMarker.label || 'Latest update',
                color: props.currentMarker.textColor || '#fff',
                backgroundColor: props.currentMarker.color || '#e85564',
                shadowBlur: 8,
                shadowColor: 'rgba(1, 13, 38, 0.45)',
                borderRadius: 6,
                padding: isCompact.value ? [3, 5] : [5, 8],
                fontFamily: FONT,
                fontSize: isCompact.value ? 9 : 11,
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
