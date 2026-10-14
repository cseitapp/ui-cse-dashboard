<script setup>
const props = defineProps({
  actual: { type: [Number, String], default: 0 },
  plan: { type: [Number, String], default: 0 },
  unit: { type: String, default: "" },
  accent: { type: String, default: "#9ee85c" },
  icon: { type: String, default: "lucide:zap" },
  performance: { type: Object, default: () => ({}) },
});

function numeric(value) {
  const parsed = Number(String(value ?? 0).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const actualValue = computed(() => numeric(props.actual));
const planValue = computed(() => numeric(props.plan));
const ratio = computed(() => (planValue.value > 0 ? actualValue.value / planValue.value : 0));
const normalizedProgress = computed(() => Math.min(1, Math.max(0, ratio.value)));
const displayPercentage = computed(() => (
  props.performance?.percentage && props.performance.percentage !== "—"
    ? props.performance.percentage
    : planValue.value > 0
      ? `${(ratio.value * 100).toFixed(1)}%`
      : "—"
));
const consoleStyle = computed(() => ({
  "--console-accent": props.accent,
  "--console-progress": `${normalizedProgress.value * 300}deg`,
  "--console-width": `${normalizedProgress.value * 100}%`,
}));
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
</script>

<template>
  <div class="power-console" :class="performance?.tone || 'neutral'" :style="consoleStyle">
    <div class="console-orbit" aria-hidden="true">
      <div class="console-ticks" />
      <div class="console-arc">
        <div class="console-center">
          <span class="console-icon"><Icon :name="icon" size="17" /></span>
          <strong>{{ numberFormatter.format(actualValue) }}</strong>
          <small>{{ unit }}</small>
          <span class="console-capacity"><b>{{ displayPercentage }}</b> ຂອງແຜນ</span>
        </div>
      </div>
    </div>

    <div class="console-information">
      <div class="console-state">
        <span class="console-state-light" />
        <span>LIVE PERFORMANCE</span>
      </div>

      <div class="console-value-grid">
        <div class="console-value plan">
          <span class="console-value-icon"><Icon name="lucide:target" size="15" /></span>
          <small>ແຜນ</small>
          <strong>{{ numberFormatter.format(planValue) }} <i>{{ unit }}</i></strong>
        </div>
        <div class="console-value actual">
          <span class="console-value-icon"><Icon :name="icon" size="15" /></span>
          <small>ຕົວຈິງ</small>
          <strong>{{ numberFormatter.format(actualValue) }} <i>{{ unit }}</i></strong>
        </div>
      </div>

      <div class="console-progress" aria-hidden="true"><span /></div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
/*
 * Navy / teal glass surface that matches the dashboard shell
 * (rgba(7, 39, 57) → rgba(5, 27, 47)) while the per-metric accent
 * drives the arc, highlights and actual value.
 */
.power-console {
  --console-line: rgba(112, 227, 230, 0.18);
  --console-text: #eef9fc;
  --console-muted: #a3c7d3;
  --console-faint: #7fa6b5;
  --console-ring: rgba(14, 82, 110, 0.95);

  position: relative;
  display: grid;
  min-height: 238px;
  grid-template-columns: minmax(190px, 0.92fr) minmax(190px, 1.08fr);
  align-items: center;
  gap: clamp(12px, 1.4vw, 22px);
  padding: clamp(13px, 1.4vw, 19px);
  overflow: hidden;
  isolation: isolate;
  border: 1px solid rgba(112, 227, 230, 0.2);
  border-radius: 20px;
  background:
    radial-gradient(70% 70% at 22% 45%, color-mix(in srgb, var(--console-accent) 8%, transparent), transparent 60%),
    linear-gradient(160deg, rgba(22, 118, 142, 0.34), rgba(10, 62, 96, 0.26) 55%, rgba(8, 40, 78, 0.3));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 12px 30px -14px rgba(1, 13, 38, 0.45);
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

/* Accent hairline along the top edge */
.power-console::before {
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  z-index: -1;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--console-accent) 70%, white), transparent);
  content: "";
  opacity: 0;
}

/* Fine engineering grid texture */
.power-console::after {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(rgba(140, 210, 230, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140, 210, 230, 0.035) 1px, transparent 1px);
  background-size: 22px 22px;
  content: "";
  display: none;
  -webkit-mask: radial-gradient(ellipse at 30% 50%, #000 0%, transparent 72%);
  mask: radial-gradient(ellipse at 30% 50%, #000 0%, transparent 72%);
  pointer-events: none;
}

.power-console:hover {
  border-color: rgba(130, 232, 236, 0.32);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 16px 34px -14px rgba(1, 13, 38, 0.55);
}

/* ---------- Orbit gauge ---------- */
.console-orbit {
  position: relative;
  display: grid;
  width: clamp(180px, 17vw, 220px);
  aspect-ratio: 1;
  place-self: center;
  place-items: center;
}

.console-ticks {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(from 210deg, color-mix(in srgb, var(--console-accent) 55%, #9fd4e2) 0 1deg, transparent 1deg 7.5deg);
  opacity: 0.42;
  -webkit-mask: radial-gradient(circle, transparent 65%, #000 66% 70%, transparent 71%);
  mask: radial-gradient(circle, transparent 65%, #000 66% 70%, transparent 71%);
}

.console-arc {
  position: relative;
  display: grid;
  width: 82%;
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  background: conic-gradient(
    from 210deg,
    color-mix(in srgb, var(--console-accent) 55%, #1d6f86) 0,
    var(--console-accent) var(--console-progress),
    rgba(4, 30, 56, 0.45) var(--console-progress) 300deg,
    transparent 300deg 360deg
  );
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--console-accent) 20%, transparent));
  animation: console-arc-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.console-arc::before {
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(150, 214, 232, 0.1);
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--console-accent) 9%, transparent), transparent 58%),
    radial-gradient(circle, #0f4262 0 52%, #0b3454 80%);
  content: "";
  box-shadow:
    inset 0 2px 12px rgba(1, 13, 38, 0.4),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05),
    0 0 0 5px var(--console-ring);
}

.console-arc::after {
  position: absolute;
  top: 5px;
  right: 35px;
  width: 8px;
  height: 8px;
  border: 2px solid #f1fcff;
  border-radius: 50%;
  background: var(--console-accent);
  content: "";
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--console-accent) 22%, transparent), 0 0 12px var(--console-accent);
  animation: console-pulse 2.4s ease-in-out infinite;
}

.console-center {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--console-text);
  text-align: center;
}

.console-icon {
  display: inline-grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--console-accent) 30%, transparent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--console-accent) 12%, transparent);
  color: var(--console-accent);
}

.console-center > strong {
  max-width: 145px;
  margin-top: 6px;
  overflow: hidden;
  font-size: clamp(1.38rem, 2vw, 1.9rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-center > small {
  margin-top: 3px;
  color: var(--console-muted);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.console-capacity {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  margin-top: 8px;
  padding: 3px 9px;
  border: 1px solid color-mix(in srgb, var(--console-accent) 22%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--console-accent) 12%, rgba(8, 48, 78, 0.55));
  color: var(--console-muted);
  font-size: 0.58rem;
  font-weight: 700;
  white-space: nowrap;
}

.console-capacity b {
  color: var(--console-accent);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

/* ---------- Information column ---------- */
.console-information {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.console-state {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: var(--console-muted);
  font-size: 0.54rem;
  font-weight: 800;
  letter-spacing: 0.16em;
}

.console-state-light {
  position: relative;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--console-accent);
  box-shadow: 0 0 8px var(--console-accent);
}

.console-state-light::after {
  position: absolute;
  inset: -3px;
  border: 1px solid var(--console-accent);
  border-radius: 50%;
  content: "";
  opacity: 0;
  animation: console-ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.console-value-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.console-value {
  position: relative;
  min-width: 0;
  min-height: 92px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--console-line);
  border-radius: 14px;
  background: rgba(10, 60, 92, 0.42);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 4px 12px -8px rgba(1, 13, 38, 0.55);
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

.console-value::before {
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 0;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: rgba(140, 190, 208, 0.35);
  content: "";
}

.console-value.actual {
  border-color: color-mix(in srgb, var(--console-accent) 20%, var(--console-line));
  background:
    radial-gradient(90% 80% at 100% 0%, color-mix(in srgb, var(--console-accent) 10%, transparent), transparent 60%),
    rgba(10, 60, 92, 0.42);
}

.console-value.actual::before {
  background: var(--console-accent);
  opacity: 0.7;
}

.console-value:hover {
  border-color: color-mix(in srgb, var(--console-accent) 38%, var(--console-line));
  transform: translateY(-1px);
}

.console-value-icon {
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 8px;
  background: rgba(150, 210, 225, 0.12);
  color: #b4d6e1;
}

.console-value.actual .console-value-icon {
  background: color-mix(in srgb, var(--console-accent) 14%, transparent);
  color: var(--console-accent);
}

.console-value small {
  display: block;
  margin-top: 8px;
  color: var(--console-muted);
  font-size: 0.62rem;
  font-weight: 700;
}

.console-value strong {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  color: var(--console-text);
  font-size: clamp(0.85rem, 1.15vw, 1.08rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.console-value.actual strong {
  color: var(--console-accent);
}

.console-value i {
  color: var(--console-faint);
  font-size: 0.54rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* ---------- Progress ---------- */
.console-progress {
  position: relative;
  height: 4px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(150, 210, 225, 0.12);
}

.console-progress span {
  position: relative;
  display: block;
  width: var(--console-width);
  max-width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(90deg, color-mix(in srgb, var(--console-accent) 45%, #1d6f86), var(--console-accent));
  box-shadow: 0 0 4px color-mix(in srgb, var(--console-accent) 40%, transparent);
  animation: console-bar-in 900ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.console-progress span::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  content: "";
  transform: translateX(-100%);
  animation: console-shimmer 2.8s ease-in-out 1s infinite;
}

/* ---------- Motion ---------- */
@keyframes console-arc-in {
  from { opacity: 0; transform: rotate(-24deg) scale(0.96); }
  to { opacity: 1; transform: none; }
}

@keyframes console-bar-in {
  from { transform: scaleX(0); transform-origin: left; }
  to { transform: scaleX(1); transform-origin: left; }
}

@keyframes console-shimmer {
  0% { transform: translateX(-100%); }
  60%, 100% { transform: translateX(100%); }
}

@keyframes console-pulse {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--console-accent) 22%, transparent), 0 0 12px var(--console-accent); }
  50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--console-accent) 10%, transparent), 0 0 16px var(--console-accent); }
}

@keyframes console-ping {
  0% { opacity: 0.7; transform: scale(0.6); }
  80%, 100% { opacity: 0; transform: scale(1.9); }
}

@media (prefers-reduced-motion: reduce) {
  .console-arc,
  .console-arc::after,
  .console-state-light::after,
  .console-progress span,
  .console-progress span::after {
    animation: none;
  }
}

/* ---------- Mobile ---------- */
@media (max-width: 600px) {
  .power-console {
    min-height: 184px;
    grid-template-columns: 132px minmax(0, 1fr);
    gap: 9px;
    padding: 10px;
    border-radius: 18px;
  }

  .console-orbit {
    width: 130px;
  }

  .console-arc::before {
    inset: 7px;
  }

  .console-arc::after {
    top: 3px;
    right: 23px;
    width: 6px;
    height: 6px;
  }

  .console-icon {
    width: 20px;
    height: 20px;
  }

  .console-center > strong {
    max-width: 84px;
    margin-top: 4px;
    font-size: 1.02rem;
  }

  .console-center > small,
  .console-capacity {
    font-size: 0.48rem;
  }

  .console-capacity {
    margin-top: 4px;
    padding: 2px 6px;
  }

  .console-capacity b {
    font-size: 0.62rem;
  }

  .console-state {
    margin-bottom: 7px;
    font-size: 0.45rem;
  }

  .console-value-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .console-value {
    display: grid;
    min-height: 0;
    grid-template-columns: 24px 1fr;
    grid-template-areas: "icon label" "icon value";
    column-gap: 8px;
    padding: 8px 9px;
    border-radius: 11px;
  }

  .console-value::before {
    top: 8px;
    bottom: 8px;
  }

  .console-value-icon {
    grid-area: icon;
    align-self: center;
    width: 24px;
    height: 24px;
    border-radius: 7px;
  }

  .console-value small {
    grid-area: label;
    margin-top: 0;
    font-size: 0.5rem;
  }

  .console-value strong {
    grid-area: value;
    margin-top: 1px;
    font-size: 0.7rem;
  }

  .console-progress {
    height: 3px;
    margin-top: 8px;
  }
}
</style>
