<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'

// Renderer
import { CanvasRenderer } from 'echarts/renderers'

// Charts
import { LineChart } from 'echarts/charts'

import { graphic } from 'echarts/core'
import { ToolboxComponent } from 'echarts/components'

// Components
import {
    TitleComponent,
    TooltipComponent,
    LegendComponent,
    GridComponent,
    DataZoomComponent,
    MarkPointComponent // <-- ADDED
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
    MarkPointComponent // <-- ADDED
])

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
    dataField: String,
    planField: String,
    dataLabel: String,
    planLabel: String
})

const sortedData = computed(() =>
    [...props.data].sort(
        (a, b) => new Date(a[props.xField]) - new Date(b[props.xField])
    )
)
const option = computed(() => ({
    title: {
        text: props.title,
        textStyle: {
            fontFamily: "'Noto Sans Lao', sans-serif",
            fontSize: 18
        }
    },
    tooltip: {
        trigger: 'axis',
        textStyle: {
            fontFamily: "'Noto Sans Lao', sans-serif",
            fontSize: 13
        }
    },
    toolbox: {
        show: true,
        feature: {
            dataZoom: {
                yAxisIndex: 'none'
            },
            dataView: { readOnly: false },
            magicType: {},
            restore: {},
            saveAsImage: {}
        }
    },
    legend: {
        textStyle: {
            fontFamily: "'Noto Sans Lao', sans-serif",
            fontSize: 13
        },
        data: [props.dataLabel, props.planLabel]
    },
    grid: {
        left: 50,
        right: 20,
        bottom: 70
    },
    xAxis: {
        type: 'category',
        textStyle: {
            fontFamily: "'Noto Sans Lao', sans-serif",
            fontSize: 13
        },
        data: sortedData.value.map(i => i[props.xField])
    },
    yAxis: {
        type: 'value',
        scale: true,
        textStyle: {
            fontFamily: "'Noto Sans Lao', sans-serif",
            fontSize: 13
        }
    },
    dataZoom: [
        { type: 'inside' },
        { type: 'slider' }
    ],
    series: [
        {
            name: props.dataLabel,
            type: 'line',
            smooth: true,
            areaStyle: {},
            data: sortedData.value.map(i => Number(i[props.dataField])),
            markPoint: {
                symbolSize: 60,
                label: {
                    fontFamily: "'Noto Sans Lao', sans-serif",
                    fontSize: 11,
                    color: '#fff'
                },
                data: [
                    { type: 'max', name: 'ສູງສຸດ' },
                    { type: 'min', name: 'ຕ່ຳສຸດ' }
                ]
            }
        },
        {
            name: props.planLabel,
            type: 'line',
            smooth: true,
            areaStyle: {},
            data: sortedData.value.map(i => Number(i[props.planField])),
            markPoint: {
                symbolSize: 60,
                label: {
                    fontFamily: "'Noto Sans Lao', sans-serif",
                    fontSize: 11,
                    color: '#fff'
                },
                data: [
                    { type: 'max', name: 'ສູງສຸດ' },
                    { type: 'min', name: 'ຕ່ຳສຸດ' }
                ]
            }
        }
    ]
}))
</script>

<template>
    <VChart :option="option" autoresize />
</template>