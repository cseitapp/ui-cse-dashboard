<script setup>
const props = defineProps({
  actual: { type: [Number, String], default: 0 },
  plan: { type: [Number, String], default: 0 },
  unit: { type: String, default: "" },
  actualColor: { type: String, default: "#4fe0dc" },
  planColor: { type: String, default: "#ffbd49" },
  icon: { type: String, default: "lucide:git-compare-arrows" },
  performance: { type: Object, default: () => ({}) },
  yesterdayActual: { type: [Number, String], default: 0 },
  yesterdayPlan: { type: [Number, String], default: 0 },
  hasYesterdayActual: { type: Boolean, default: false },
  hasYesterdayPlan: { type: Boolean, default: false },
});
const componentId = useId().replace(/:/g, "");
const needleGradientId = `dual-needle-${componentId}`;

/* Speedometer: 270deg sweep from bottom-left (0%) over the top to bottom-right (100%).
   Needle is drawn pointing straight up (50%) in a 200x200 box centred on the pivot. */
const NEEDLE_PATH = "M100 38 L110 97 A10.4 10.4 0 1 1 90 97 Z";

function numeric(value) {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const actualValue = computed(() => numeric(props.actual));
const planValue = computed(() => numeric(props.plan));
const percentageValue = computed(() => (
  planValue.value > 0 ? (actualValue.value / planValue.value) * 100 : 0
));
const arcCompletion = computed(() => Math.min(100, Math.max(0, percentageValue.value)));
const displayPercentage = computed(() => (
  props.performance?.percentage && props.performance.percentage !== "—"
    ? props.performance.percentage
    : planValue.value > 0
      ? `${percentageValue.value.toFixed(1)}%`
      : "—"
));
const trendIcon = computed(() => {
  if (planValue.value <= 0) return "lucide:minus";
  return percentageValue.value >= 100 ? "lucide:trending-up" : "lucide:trending-down";
});
const needleAngle = computed(() => -135 + arcCompletion.value * 2.7);
/* Keep the readout in the half of the dial the needle is NOT in: under the pivot
   while the needle points up, above it once the needle swings below horizontal
   (under ~17% or over ~83%), so the tip never runs through the value. */
const readoutPosition = computed(() => (Math.abs(needleAngle.value) > 90 ? "top" : "bottom"));
const dualStyle = computed(() => ({
  "--dual-actual": props.actualColor,
  "--dual-plan": props.planColor,
  "--needle-angle": `${needleAngle.value}deg`,
}));
const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const yesterdayNumberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
</script>

<template>
  <div class="dual-arc-card" :class="performance?.tone || 'neutral'" :style="dualStyle">
    <div class="dual-gauge">
      <!-- 270deg colour band (conic gradient masked into a ring) -->
      <div class="dual-gauge-band-wrap" aria-hidden="true">
        <span class="dual-gauge-band" />
        <span class="dual-gauge-band-shine" />
      </div>

      <!-- raised dial face -->
      <div class="dual-gauge-disc" aria-hidden="true" />

      <!-- tapered needle -->
      <svg class="dual-gauge-needle" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient :id="needleGradientId" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#f6fcfe" />
            <stop offset=".5" stop-color="#dbe9ee" />
            <stop offset="1" stop-color="#9fb8c2" />
          </linearGradient>
        </defs>
        <g class="dual-needle">
          <path :d="NEEDLE_PATH" :fill="`url(#${needleGradientId})`" />
          <circle class="dual-needle-cap" cx="100" cy="100" r="4" />
        </g>
      </svg>

      <Transition name="dual-readout" mode="out-in">
        <div :key="readoutPosition" class="dual-center-readout" :class="`is-${readoutPosition}`">
          <strong>{{ displayPercentage }}</strong>
          <small class="dual-trend">
            <Icon :name="trendIcon" size="12" />
            ທຽບກັບແຜນ
          </small>
        </div>
      </Transition>
    </div>

    <div class="dual-compare">
      <div class="dual-tile plan">
        <div class="dual-tile-head">
          <span class="dual-dot" />
          <small>ແຜນ</small>
        </div>
        <strong class="dual-tile-value">{{ numberFormatter.format(planValue) }} <i>{{ unit }}</i></strong>
        <div class="dual-tile-foot" title="ແຜນມື້ວານ">
          <span><Icon name="lucide:history" size="12" /> ມື້ວານ</span>
          <b>{{ hasYesterdayPlan ? yesterdayNumberFormatter.format(numeric(yesterdayPlan)) : '—' }} <i>{{ unit }}</i></b>
        </div>
      </div>

      <span class="dual-compare-icon" aria-hidden="true"><Icon name="lucide:arrow-left-right" size="12" /></span>

      <div class="dual-tile actual">
        <div class="dual-tile-head">
          <small>ຕົວຈິງ</small>
          <span class="dual-dot" />
        </div>
        <strong class="dual-tile-value">{{ numberFormatter.format(actualValue) }} <i>{{ unit }}</i></strong>
        <div class="dual-tile-foot" title="ຕົວຈິງມື້ວານ">
          <span><Icon name="lucide:history" size="12" /> ມື້ວານ</span>
          <b>{{ hasYesterdayActual ? yesterdayNumberFormatter.format(numeric(yesterdayActual)) : '—' }} <i>{{ unit }}</i></b>
        </div>
      </div>
    </div>

    <slot />
  </div>
</template>

<style scoped>
/* ================= Card shell (soft raised glass) ================= */
.dual-arc-card {
  --dual-line: rgba(112, 227, 230, 0.18);
  --dual-text: #eef9fc;
  --dual-muted: #a3c7d3;
  --dual-faint: #7fa6b5;
  --dual-ring: rgba(14, 82, 110, 0.95);
  --dual-tone: var(--dual-muted);

  position: relative;
  padding: 10px 16px 14px;
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(112, 227, 230, 0.2);
  border-radius: 20px;
  background:
    radial-gradient(70% 55% at 50% 0%, rgba(110, 235, 235, 0.12), transparent 70%),
    linear-gradient(160deg, rgba(22, 118, 142, 0.34), rgba(10, 62, 96, 0.26) 55%, rgba(8, 40, 78, 0.3));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 30px -14px rgba(1, 13, 38, 0.45);
  transition: border-color 220ms ease, box-shadow 220ms ease;
}

.dual-arc-card.warning { --dual-tone: #ffc95c; }
.dual-arc-card.positive { --dual-tone: #6ff0c8; }

.dual-arc-card:hover {
  border-color: rgba(130, 232, 236, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 16px 34px -14px rgba(1, 13, 38, 0.55);
}

/* ================= Speedometer ================= */
.dual-gauge {
  position: relative;
  width: min(100%, 236px);
  aspect-ratio: 1 / 0.9;
  margin: 6px auto 0;
}

/* wrapper carries the drop shadow (a filter on the masked band itself would be clipped) */
.dual-gauge-band-wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  aspect-ratio: 1;
  filter: drop-shadow(0 6px 10px rgba(1, 13, 38, 0.45));
}

.dual-gauge-band,
.dual-gauge-band-shine {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.dual-gauge-band {
  background: conic-gradient(
    from 225deg,
    #d8101c 0deg,
    #ec3a10 45deg,
    #f57806 90deg,
    #f2b805 135deg,
    #a3c40a 185deg,
    #4dae18 230deg,
    #1c9a34 270deg,
    transparent 270deg
  );
  filter: saturate(1.2) contrast(1.06);
  -webkit-mask: radial-gradient(farthest-side, transparent 80.5%, #000 81.5%);
  mask: radial-gradient(farthest-side, transparent 80.5%, #000 81.5%);
  animation: dual-fade-in 500ms ease both;
}

/* soft light along the band mid-line + top for a rounded, dimensional feel */
.dual-gauge-band-shine {
  background:
    radial-gradient(farthest-side, transparent 82%, rgba(255, 255, 255, 0.12) 89%, transparent 97%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 60%);
  -webkit-mask:
    radial-gradient(farthest-side, transparent 80.5%, #000 81.5%),
    conic-gradient(from 225deg, #000 0deg 270deg, transparent 270deg);
  -webkit-mask-composite: source-in;
  mask:
    radial-gradient(farthest-side, transparent 80.5%, #000 81.5%) intersect,
    conic-gradient(from 225deg, #000 0deg 270deg, transparent 270deg);
  mix-blend-mode: soft-light;
}

/* raised navy dial face */
.dual-gauge-disc {
  position: absolute;
  top: 14%;
  left: 14%;
  width: 72%;
  aspect-ratio: 1;
  border: 1px solid rgba(160, 225, 238, 0.18);
  border-radius: 50%;
  background:
    radial-gradient(90% 70% at 50% 18%, rgba(130, 220, 235, 0.18), transparent 60%),
    linear-gradient(180deg, #145574, #0b3554 70%, #0a2f4c);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    inset 0 -6px 14px rgba(1, 13, 38, 0.35),
    0 10px 22px rgba(1, 13, 38, 0.5),
    0 2px 4px rgba(1, 13, 38, 0.35);
}

.dual-gauge-needle {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  aspect-ratio: 1;
  overflow: visible;
}

/* needle: rotates about the pivot from 0% (bottom-left) to 100% (bottom-right) */
.dual-needle {
  transform: rotate(var(--needle-angle));
  transform-box: view-box;
  transform-origin: 100px 100px;
  transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: dual-needle-in 1100ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both;
  filter: drop-shadow(1px 3px 3px rgba(1, 13, 38, 0.55));
}

.dual-needle-cap {
  fill: #8aa6b1;
}

/* Value sits in whichever half of the dial the needle leaves free.
   Pivot is at 100/180 of the gauge height (1 : 0.9 box); the needle cap reaches
   ~13/180 above it, so the top position ends just clear of the cap. */
.dual-center-readout {
  position: absolute;
  left: 50%;
  z-index: 3;
  display: flex;
  align-items: center;
  flex-direction: column;
  transform: translateX(-50%);
  text-align: center;
}

.dual-center-readout.is-bottom {
  top: 66%;
}

.dual-center-readout.is-top {
  bottom: 53.5%;
}

.dual-readout-enter-active,
.dual-readout-leave-active {
  transition: opacity 180ms ease, translate 180ms ease;
}

.dual-readout-enter-from.is-top,
.dual-readout-leave-to.is-top {
  opacity: 0;
  translate: 0 6px;
}

.dual-readout-enter-from.is-bottom,
.dual-readout-leave-to.is-bottom {
  opacity: 0;
  translate: 0 -6px;
}

.dual-center-readout strong {
  color: #f4fcff;
  font-size: clamp(1.4rem, 2vw, 1.7rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 10, 24, 0.45);
}

.dual-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 5px;
  padding: 2px 9px;
  border: 1px solid color-mix(in srgb, var(--dual-tone) 34%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dual-tone) 12%, rgba(8, 48, 78, 0.55));
  color: color-mix(in srgb, var(--dual-tone) 80%, #e8f6fa);
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

/* ================= Comparison tiles ================= */
.dual-compare {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.dual-tile {
  --tile-color: var(--dual-plan);

  position: relative;
  min-width: 0;
  padding: 12px 14px 11px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tile-color) 20%, var(--dual-line));
  border-radius: 14px;
  /* faint tint in the outer corner only */
  background:
    radial-gradient(90% 80% at 0% 0%, color-mix(in srgb, var(--tile-color) 10%, transparent), transparent 60%),
    rgba(10, 60, 92, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 12px -8px rgba(0, 10, 24, 0.55);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.dual-tile.actual {
  --tile-color: var(--dual-actual);

  background:
    radial-gradient(90% 80% at 100% 0%, color-mix(in srgb, var(--tile-color) 10%, transparent), transparent 60%),
    rgba(10, 60, 92, 0.42);
  text-align: right;
}

/* thin top edge on the outer side, fading toward the centre */
.dual-tile::before {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--tile-color), transparent 55%);
  content: "";
  opacity: 0.55;
}

.dual-tile.actual::before {
  background: linear-gradient(270deg, var(--tile-color), transparent 55%);
}

.dual-tile:hover {
  border-color: color-mix(in srgb, var(--tile-color) 36%, var(--dual-line));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 8px 16px -8px rgba(0, 10, 24, 0.65);
  transform: translateY(-1px);
}

.dual-tile-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dual-tile.actual .dual-tile-head {
  justify-content: flex-end;
}

.dual-tile-head small {
  color: var(--dual-muted);
  font-size: 0.74rem;
  font-weight: 700;
}

.dual-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--tile-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--tile-color) 20%, transparent), 0 0 8px var(--tile-color);
}

.dual-tile-value {
  display: block;
  margin-top: 6px;
  overflow: hidden;
  color: var(--tile-color);
  font-size: clamp(1rem, 1.3vw, 1.2rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dual-tile i {
  color: var(--dual-faint);
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 700;
}

.dual-tile-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px dashed rgba(150, 220, 235, 0.22);
}

.dual-tile.actual .dual-tile-foot {
  flex-direction: row-reverse;
}

.dual-tile-foot > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--dual-faint);
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

.dual-tile-foot b {
  min-width: 0;
  overflow: hidden;
  color: #d3e8ef;
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dual-tile-foot b i {
  font-size: 0.58rem;
}

/* compare badge between tiles */
.dual-compare-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(150, 214, 232, 0.26);
  border-radius: 50%;
  background: linear-gradient(180deg, #1c6385, #0d3a5c);
  color: #a9d3df;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 0 0 4px var(--dual-ring),
    0 4px 10px rgba(0, 10, 24, 0.45);
}

/* ================= Motion ================= */
@keyframes dual-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dual-needle-in {
  from { transform: rotate(-135deg); }
}

@media (prefers-reduced-motion: reduce) {
  .dual-gauge-band,
  .dual-needle,
  .dual-readout-enter-active,
  .dual-readout-leave-active {
    animation: none;
    transition: none;
  }
}

/* ================= Mobile ================= */
@media (max-width: 600px) {
  .dual-arc-card {
    padding: 8px 10px 10px;
    border-radius: 16px;
  }

  .dual-gauge {
    width: min(100%, 220px);
  }

  .dual-center-readout strong {
    font-size: 1.3rem;
  }

  .dual-trend {
    margin-top: 5px;
    font-size: 0.64rem;
  }

  .dual-compare {
    gap: 10px;
    margin-top: 6px;
  }

  .dual-tile {
    padding: 10px 10px 9px;
    border-radius: 12px;
  }

  .dual-tile-head small {
    font-size: 0.7rem;
  }

  .dual-tile-value {
    margin-top: 4px;
    font-size: 0.9rem;
  }

  .dual-tile-foot {
    margin-top: 7px;
    padding-top: 6px;
  }

  .dual-tile-foot > span {
    font-size: 0.64rem;
  }

  .dual-tile-foot b {
    font-size: 0.7rem;
  }

  .dual-compare-icon {
    width: 24px;
    height: 24px;
  }
}
</style>
