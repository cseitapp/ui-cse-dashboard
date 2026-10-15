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
const planGradientId = `dual-plan-${componentId}`;
const actualGradientId = `dual-actual-${componentId}`;
const glowFilterId = `dual-glow-${componentId}`;

/* Arc geometry (viewBox 0 5 260 135 – top trimmed to the tick ring): centre (130,128), radius 102 */
const CX = 130;
const CY = 128;
const R = 102;
const PLAN_PATH = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX} ${CY - R}`;
const ACTUAL_PATH = `M${CX} ${CY - R} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const TRACK_PATH = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;
const HR = R + 2.4;
const PLAN_HIGHLIGHT = `M${CX - HR} ${CY} A${HR} ${HR} 0 0 1 ${CX} ${CY - HR}`;
const ACTUAL_HIGHLIGHT = `M${CX} ${CY - HR} A${HR} ${HR} 0 0 1 ${CX + HR} ${CY}`;
const TR = R + 15;
const TICK_PATH = `M${CX - TR} ${CY} A${TR} ${TR} 0 0 1 ${CX + TR} ${CY}`;

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
/* Knob sits at the leading edge of the actual arc */
const knob = computed(() => {
  const theta = (Math.PI / 2) * (1 - arcCompletion.value / 100);
  return { x: CX + R * Math.cos(theta), y: CY - R * Math.sin(theta) };
});
const dualStyle = computed(() => ({
  "--dual-actual": props.actualColor,
  "--dual-plan": props.planColor,
  "--actual-offset": `${100 - arcCompletion.value}`,
}));
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
</script>

<template>
  <div class="dual-arc-card" :class="performance?.tone || 'neutral'" :style="dualStyle">
    <div class="dual-arc-stage" aria-hidden="true">
      <span class="dual-floor" />

      <svg class="dual-arc-svg" viewBox="0 5 260 135">
        <defs>
          <linearGradient :id="planGradientId" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style="stop-color: var(--dual-plan)" stop-opacity=".5" />
            <stop offset=".55" style="stop-color: var(--dual-plan)" />
            <stop offset="1" style="stop-color: color-mix(in srgb, var(--dual-plan) 75%, white)" />
          </linearGradient>
          <linearGradient :id="actualGradientId" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style="stop-color: color-mix(in srgb, var(--dual-actual) 80%, white)" />
            <stop offset=".45" style="stop-color: var(--dual-actual)" />
            <stop offset="1" style="stop-color: var(--dual-actual)" stop-opacity=".55" />
          </linearGradient>
          <filter :id="glowFilterId" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <!-- Scale -->
        <path class="dual-tick-minor" :d="TICK_PATH" pathLength="100" />
        <path class="dual-tick-major" :d="TICK_PATH" pathLength="100" />

        <!-- Soft track -->
        <path class="dual-track" :d="TRACK_PATH" />

        <!-- Value arcs -->
        <path class="dual-plan-arc" :stroke="`url(#${planGradientId})`" :filter="`url(#${glowFilterId})`" :d="PLAN_PATH" pathLength="100" />
        <path class="dual-actual-arc" :stroke="`url(#${actualGradientId})`" :filter="`url(#${glowFilterId})`" :d="ACTUAL_PATH" pathLength="100" />

        <!-- Gentle sheen along the outer edge gives the arc a rounded feel -->
        <path class="dual-gloss" :d="PLAN_HIGHLIGHT" pathLength="100" />
        <path class="dual-gloss dual-gloss-actual" :d="ACTUAL_HIGHLIGHT" pathLength="100" />

        <g v-if="arcCompletion > 0" class="dual-knob">
          <circle class="dual-knob-halo" :cx="knob.x" :cy="knob.y" r="9" />
          <circle class="dual-knob-body" :cx="knob.x" :cy="knob.y" r="5" />
        </g>
      </svg>

      <span class="dual-apex">
        <svg
          v-if="icon === 'reservoir-volume'"
          class="dual-apex-reservoir"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path class="reservoir-basin" d="M3.5 6.5h17L19 19.5H5L3.5 6.5Z" />
          <path class="water-fill" d="M5 12.5c1.4-1 2.8-1 4.2 0s2.8 1 4.2 0 2.8-1 4.2 0c.55.4 1.1.65 1.65.72L18.6 18H5.4L5 12.5Z" />
          <path class="volume-surface" d="M5 12.5c1.4-1 2.8-1 4.2 0s2.8 1 4.2 0 2.8-1 4.2 0c.55.4 1.1.65 1.65.72" />
          <path class="capacity-mark" d="M7 9h3" />
        </svg>
        <Icon v-else :name="icon" size="14" />
      </span>

      <div class="dual-center-readout">
        <strong>{{ displayPercentage }}</strong>
        <small class="dual-trend">
          <Icon :name="trendIcon" size="12" />
          ທຽບກັບແຜນ
        </small>
      </div>
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
          <b>{{ hasYesterdayPlan ? numberFormatter.format(numeric(yesterdayPlan)) : '—' }} <i>{{ unit }}</i></b>
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
          <b>{{ hasYesterdayActual ? numberFormatter.format(numeric(yesterdayActual)) : '—' }} <i>{{ unit }}</i></b>
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

/* ================= Arc stage ================= */
.dual-arc-stage {
  position: relative;
  width: min(100%, 320px);
  aspect-ratio: 260 / 135;
  margin: 0 auto;
}

.dual-arc-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* soft colour pool under the arc */
.dual-floor {
  position: absolute;
  bottom: -4%;
  left: 10%;
  right: 10%;
  height: 22%;
  border-radius: 50%;
  background: linear-gradient(90deg, color-mix(in srgb, var(--dual-plan) 26%, transparent), transparent 50%, color-mix(in srgb, var(--dual-actual) 26%, transparent));
  filter: blur(18px);
  opacity: 0.6;
  pointer-events: none;
}

.dual-tick-minor,
.dual-tick-major {
  fill: none;
  stroke-linecap: butt;
}

.dual-tick-minor {
  stroke: rgba(160, 210, 225, 0.22);
  stroke-width: 4;
  stroke-dasharray: 0.2 1.8;
}

.dual-tick-major {
  stroke: rgba(200, 235, 245, 0.45);
  stroke-width: 7;
  /* majors at 25 / 50 / 75 only – no stray dashes at the arc ends */
  stroke-dasharray: 0.4 24.6 0.4 24.6 0.4 49.6;
  stroke-dashoffset: -24.8;
}

.dual-track,
.dual-plan-arc,
.dual-actual-arc,
.dual-gloss {
  fill: none;
  stroke-linecap: round;
}

.dual-track {
  stroke: rgba(4, 30, 56, 0.45);
  stroke-width: 12;
}

.dual-plan-arc,
.dual-actual-arc {
  stroke-width: 10;
}

.dual-plan-arc {
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
  animation: dual-arc-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.dual-actual-arc {
  stroke-dasharray: 100;
  stroke-dashoffset: var(--actual-offset);
  transition: stroke-dashoffset 600ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: dual-arc-in 1100ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both;
}

.dual-gloss {
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 1.2;
  stroke-dasharray: 100;
  animation: dual-arc-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.dual-gloss-actual {
  stroke-dashoffset: var(--actual-offset);
  animation: dual-arc-in 1100ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both;
}

.dual-knob {
  animation: dual-fade-in 400ms ease 1000ms both;
}

.dual-knob-halo {
  fill: color-mix(in srgb, var(--dual-actual) 22%, transparent);
  animation: dual-halo 2.6s ease-in-out 1.4s infinite;
  transform-box: fill-box;
  transform-origin: center;
}

.dual-knob-body {
  fill: var(--dual-actual);
  stroke: #f1fcff;
  stroke-width: 2.2;
  filter: drop-shadow(0 2px 3px rgba(0, 10, 24, 0.55));
}

/* apex badge */
.dual-apex {
  position: absolute;
  top: calc(21 / 135 * 100%);
  left: 50%;
  z-index: 2;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(202, 244, 242, 0.3);
  border-radius: 50%;
  background: linear-gradient(180deg, #1c6385, #0d3a5c);
  color: #e9fcfb;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 0 0 4px var(--dual-ring),
    0 6px 14px rgba(0, 10, 24, 0.45);
}

.dual-apex-reservoir {
  width: 18px;
  height: 18px;
  overflow: visible;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.9;
  filter: drop-shadow(0 0 3px rgba(103, 234, 219, 0.3));
}

.dual-apex-reservoir .reservoir-basin { stroke-width: 1.9; }
.dual-apex-reservoir .water-fill {
  fill: currentColor;
  stroke: none;
  opacity: 0.38;
}
.dual-apex-reservoir .volume-surface { stroke-width: 1.9; }
.dual-apex-reservoir .capacity-mark { opacity: 0.8; }

.dual-center-readout {
  position: absolute;
  top: 48%;
  left: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  flex-direction: column;
  transform: translateX(-50%);
  text-align: center;
}

.dual-center-readout strong {
  color: #f4fcff;
  font-size: clamp(1.55rem, 2.2vw, 2rem);
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
  margin-top: 8px;
  padding: 3px 10px;
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
@keyframes dual-arc-in {
  from { stroke-dashoffset: 100; }
}

@keyframes dual-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dual-halo {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.35); }
}

@media (prefers-reduced-motion: reduce) {
  .dual-plan-arc,
  .dual-actual-arc,
  .dual-gloss,
  .dual-knob,
  .dual-knob-halo {
    animation: none;
  }
}

/* ================= Mobile ================= */
@media (max-width: 600px) {
  .dual-arc-card {
    padding: 8px 10px 10px;
    border-radius: 16px;
  }

  .dual-arc-stage {
    width: min(100%, 280px);
  }

  .dual-apex {
    width: 26px;
    height: 26px;
  }

  .dual-center-readout strong {
    font-size: 1.45rem;
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
