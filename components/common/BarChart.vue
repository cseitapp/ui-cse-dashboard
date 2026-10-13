<template>
  <div ref="el" class="bar-chart" :style="{ height }" />
</template>

<script setup>
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent,
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
  dark: { type: Boolean, default: false },
  showLegend: { type: Boolean, default: true },
  hideXAxisLabels: { type: Boolean, default: false },
  showAllXAxisLabels: { type: Boolean, default: false },
  xAxisSubLabels: { type: Array, default: () => [] },
});

const el = ref(null);
const chart = shallowRef(null);
const compactLayout = ref(false);
let ro = null;
let labelFrame = null;
let resizeFrame = null;
let resizeTimer = null;

// MySQL DECIMAL arrives as a string, so convert; blank stays null (gap in the chart)
const toNum = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const buildOption = () => {
  const textColor = props.dark ? "#8f96a1" : "#666";
  const titleColor = props.dark ? "#f4f5f7" : "#333";
  const gridColor = props.dark ? "rgba(255, 255, 255, .08)" : "#e5e5e5";
  const valueBarCount = props.series.filter(series => series.type !== "line" && series.showValues).length;
  const compactComparisonLabels = compactLayout.value && valueBarCount > 1;

  return ({
  backgroundColor: "transparent",
  textStyle: { fontFamily: FONT, color: textColor },
  title: { text: props.title, left: "center", textStyle: { color: titleColor, fontSize: 16, fontFamily: FONT }, },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    backgroundColor: props.dark ? "#252930" : undefined,
    borderColor: props.dark ? "#3b404a" : undefined,
    textStyle: { color: props.dark ? "#f7f8fa" : undefined, fontFamily: FONT },
    valueFormatter: (v) => (v == null ? "-" : `${v}${props.unit ? " " + props.unit : ""}`),
  },
  legend: {
    show: props.showLegend,
    top: props.title ? 40 : 0,
    icon: "roundRect",
    itemWidth: compactLayout.value ? 14 : 20,
    itemHeight: 5,
    itemGap: compactLayout.value ? 7 : 14,
    textStyle: {
      color: textColor,
      fontFamily: FONT,
      fontSize: compactLayout.value ? 10 : 13,
      fontWeight: 600,
      lineHeight: 19,
    },
  },
  grid: {
    left: 16,
    right: 16,
    top: props.showLegend ? (props.title ? 70 : 40) : 22,
    // containLabel already reserves the rendered x-axis text. Keep only a
    // compact breathing space here so multi-line achievement badges do not
    // create a second, empty footer inside the canvas.
    bottom: props.hideXAxisLabels ? 8 : (props.xAxisSubLabels.length ? 12 : 18),
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: props.labels,
    axisTick: { alignWithLabel: true, lineStyle: { color: gridColor } },
    axisLine: { lineStyle: { color: gridColor } },
    axisLabel: {
      show: !props.hideXAxisLabels,
      interval: props.showAllXAxisLabels ? 0 : "auto",
      hideOverlap: !props.showAllXAxisLabels,
      color: textColor,
      fontFamily: FONT,
      fontSize: props.showAllXAxisLabels ? 11 : 12,
      fontWeight: props.showAllXAxisLabels ? 600 : 400,
      overflow: "truncate",
      width: props.showAllXAxisLabels ? 56 : 92,
      lineHeight: 20,
      formatter: props.xAxisSubLabels.length
        ? (value, index) => {
            const badge = props.xAxisSubLabels[index];
            if (!badge) return `{axisName|${value}}`;
            const tone = badge.tone === "positive" ? "positive" : "warning";
            return `{axisName|${value}}\n{${tone}|${badge.text}}`;
          }
        : undefined,
      rich: {
        axisName: {
          color: textColor,
          fontFamily: FONT,
          fontSize: props.showAllXAxisLabels ? 10 : 11,
          fontWeight: 700,
          lineHeight: 18,
        },
        warning: {
          color: "#ffc45e",
          backgroundColor: "rgba(44, 59, 76, .92)",
          borderColor: "rgba(243, 174, 53, .65)",
          borderWidth: 1,
          borderRadius: 8,
          padding: [2, 4],
          fontFamily: FONT,
          fontSize: 8,
          fontWeight: 800,
          lineHeight: 16,
        },
        positive: {
          color: "#72edb3",
          backgroundColor: "rgba(12, 70, 65, .92)",
          borderColor: "rgba(83, 218, 157, .65)",
          borderWidth: 1,
          borderRadius: 8,
          padding: [2, 4],
          fontFamily: FONT,
          fontSize: 8,
          fontWeight: 800,
          lineHeight: 16,
        },
      },
    },
  },
  yAxis: {
    type: "value",
    name: props.unit,
    nameTextStyle: { color: textColor },
    axisLabel: { color: textColor },
    splitLine: { lineStyle: { color: gridColor, type: props.dark ? "dashed" : "solid" } },
  },
  dataZoom: props.labels.length > 20 ? [{ type: "slider" }, { type: "inside" }] : [],
  series: props.series.map((s, seriesIndex) => ({
    name: s.name,
    type: s.type || "bar",
    stack: props.stack ? "total" : undefined,
    barMaxWidth: s.barMaxWidth || 40,
    barGap: s.barGap,
    data: (s.data || []).map(toNum),
    smooth: Boolean(s.smooth),
    symbol: s.symbol || "circle",
    symbolSize: s.symbolSize || 7,
    showSymbol: s.showSymbol !== false,
    connectNulls: true,
    lineStyle: s.type === "line" ? { color: s.color, width: s.lineWidth || 3 } : undefined,
    label: {
      show: Boolean(s.showValues),
      position: s.labelPosition || "top",
      distance: compactComparisonLabels ? 3 : (s.labelDistance ?? 5),
      align: compactComparisonLabels ? "center" : (s.labelAlign || "center"),
      verticalAlign: s.labelVerticalAlign || "bottom",
      offset: compactComparisonLabels
        ? [seriesIndex % 2 === 0 ? -3 : 3, seriesIndex % 2 === 0 ? 0 : -11]
        : (s.labelOffset || [0, 0]),
      color: s.labelColor || (props.dark ? "#dfe3ea" : "#4b5563"),
      fontFamily: FONT,
      fontSize: compactComparisonLabels ? 8 : (s.labelFontSize || 9),
      fontWeight: 700,
      textBorderColor: props.dark ? "rgba(5, 35, 70, .9)" : "rgba(255, 255, 255, .9)",
      textBorderWidth: 2,
      formatter: ({ value }) => {
        const number = Number(value);
        if (!Number.isFinite(number)) return "-";
        return new Intl.NumberFormat("en-US", {
          maximumFractionDigits: s.valueDecimals ?? 2,
        }).format(number);
      },
    },
    labelLayout: { hideOverlap: false, moveOverlap: "shiftY" },
    itemStyle: s.type === "line"
      ? { color: s.color, borderColor: props.dark ? "#1a1d22" : "#fff", borderWidth: 2 }
      : { color: s.color, borderRadius: s.radius || [6, 6, 1, 1] },
    z: s.type === "line" ? 3 : 2,
    emphasis: { focus: "series" },
  })),
  });
};

const buildCenterLabelGraphics = () => {
  if (!chart.value) return [];

  const graphics = [];
  props.series.forEach((series, seriesIndex) => {
    if (!Array.isArray(series.centerLabels)) return;

    const seriesModel = chart.value.getModel().getSeriesByIndex(seriesIndex);
    const seriesData = seriesModel?.getData?.();
    if (!seriesData) return;

    series.centerLabels.forEach((badge, dataIndex) => {
      if (!badge) return;
      const layout = seriesData.getItemLayout(dataIndex);
      if (!layout || !Number.isFinite(layout.x) || !Number.isFinite(layout.y)) return;

      const width = Number(layout.width || 0);
      const height = Number(layout.height || 0);
      if (Math.abs(width) < 2 || Math.abs(height) < 10) return;

      const positive = badge.tone === "positive";
      graphics.push({
        type: "text",
        id: `bar-center-label-${seriesIndex}-${dataIndex}`,
        x: layout.x + (width / 2),
        y: layout.y + (height / 2),
        z: 100,
        silent: true,
        style: {
          text: badge.text,
          align: "center",
          verticalAlign: "middle",
          fill: positive ? "#7ff2bd" : "#ffd166",
          backgroundColor: positive ? "rgba(8, 75, 65, .9)" : "rgba(49, 62, 77, .94)",
          borderColor: positive ? "rgba(89, 224, 169, .72)" : "rgba(246, 200, 95, .72)",
          borderWidth: 1,
          borderRadius: 8,
          padding: [2, 4],
          font: `700 8px ${FONT}`,
        },
      });
    });
  });

  return graphics;
};

const syncCenterLabels = () => {
  if (!chart.value) return;
  if (labelFrame) cancelAnimationFrame(labelFrame);
  labelFrame = requestAnimationFrame(() => {
    if (!chart.value) return;
    chart.value.setOption(
      { graphic: buildCenterLabelGraphics() },
      { replaceMerge: ["graphic"] },
    );
    labelFrame = null;
  });
};

const render = () => {
  if (!chart.value) return;
  chart.value.setOption(buildOption(), true);   // true = replace, so old series don't linger
  props.loading ? chart.value.showLoading() : chart.value.hideLoading();
  syncCenterLabels();
};

const resizeChart = () => {
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    const node = el.value;
    const instance = chart.value;
    if (!node || !instance) return;

    const rect = node.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const chartHeight = Math.floor(rect.height);
    if (width > 0 && chartHeight > 0) {
      const nextCompactLayout = width <= 480;
      const layoutChanged = compactLayout.value !== nextCompactLayout;
      compactLayout.value = nextCompactLayout;
      instance.resize({ width, height: chartHeight, silent: true });
      if (layoutChanged) instance.setOption(buildOption(), true);
      syncCenterLabels();
    }
    resizeFrame = null;
  });
};

onMounted(() => {
  compactLayout.value = (el.value?.getBoundingClientRect().width || 0) <= 480;
  chart.value = echarts.init(el.value);
  render();
  ro = new ResizeObserver(resizeChart);
  ro.observe(el.value);
  window.addEventListener("resize", resizeChart, { passive: true });
  window.visualViewport?.addEventListener("resize", resizeChart, { passive: true });

  // Mobile browsers and responsive drawers can finish sizing after mount.
  // A settling resize prevents ECharts from retaining its wider initial canvas.
  resizeChart();
  resizeTimer = window.setTimeout(resizeChart, 240);
});

watch(() => [props.labels, props.series, props.title, props.unit, props.stack, props.loading, props.dark, props.showLegend, props.hideXAxisLabels, props.showAllXAxisLabels, props.xAxisSubLabels], render, { deep: true });

onBeforeUnmount(() => {
  if (labelFrame) cancelAnimationFrame(labelFrame);
  if (resizeFrame) cancelAnimationFrame(resizeFrame);
  if (resizeTimer) window.clearTimeout(resizeTimer);
  window.removeEventListener("resize", resizeChart);
  window.visualViewport?.removeEventListener("resize", resizeChart);
  ro?.disconnect();
  chart.value?.dispose();
});
</script>

<style scoped>
.bar-chart {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}
</style>
