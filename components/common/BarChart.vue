<template>
  <div ref="el" :style="{ width: '100%', height }" />
</template>

<script setup>
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart, GridComponent, TooltipComponent, LegendComponent,
  TitleComponent, DataZoomComponent, CanvasRenderer,
]);
const FONT = "'Noto Sans Lao', sans-serif";
const props = defineProps({
  title: { type: String, default: "" },
  labels: { type: Array, default: () => [] },   // x axis, e.g. PERIOD_LABEL
  series: { type: Array, default: () => [] },   // [{ name, data, color? }]
  unit: { type: String, default: "" },          // e.g. "GWh"
  height: { type: String, default: "360px" },
  loading: { type: Boolean, default: false },
  stack: { type: Boolean, default: false },
});

const el = ref(null);
const chart = shallowRef(null);
let ro = null;

// MySQL DECIMAL arrives as a string, so convert; blank stays null (gap in the chart)
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const buildOption = () => ({
    textStyle: { fontFamily: FONT },
  title: { text: props.title, left: "center", textStyle: { fontSize: 16, fontFamily: FONT }, },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    valueFormatter: (v) => (v == null ? "-" : `${v}${props.unit ? " " + props.unit : ""}`),
  },
  legend: { top: 40 ,textStyle: { fontFamily: FONT }},
  grid: { left: 16, right: 16, top: 70, bottom: 40, containLabel: true },
  xAxis: { type: "category", data: props.labels, axisTick: { alignWithLabel: true } },
  yAxis: { type: "value", name: props.unit },
  dataZoom: props.labels.length > 20 ? [{ type: "slider" }, { type: "inside" }] : [],
  series: props.series.map((s) => ({
    name: s.name,
    type: "bar",
    stack: props.stack ? "total" : undefined,
    barMaxWidth: 40,
    data: (s.data || []).map(toNum),
    itemStyle: s.color ? { color: s.color } : undefined,
    emphasis: { focus: "series" },
  })),
});

const render = () => {
  if (!chart.value) return;
  chart.value.setOption(buildOption(), true);   // true = replace, so old series don't linger
  props.loading ? chart.value.showLoading() : chart.value.hideLoading();
};

onMounted(() => {
  chart.value = echarts.init(el.value);
  render();
  ro = new ResizeObserver(() => chart.value?.resize());
  ro.observe(el.value);
});

watch(() => [props.labels, props.series, props.title, props.unit, props.stack, props.loading], render, { deep: true });

onBeforeUnmount(() => {
  ro?.disconnect();
  chart.value?.dispose();
});
</script>