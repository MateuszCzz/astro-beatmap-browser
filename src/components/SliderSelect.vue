<script setup lang="ts" generic="V extends number | [number, number]">
import { computed, ref, watch } from "vue";

const props = withDefaults(
    defineProps<{
        min: number;
        max: number;
        step?: number;
        label?: string;
        neutral?: V | null; // always colored; tags 1-5
        ticks?: boolean;
        showValue?: boolean; // window with value
        anyLabel?: string;
        inline?: boolean; // label, track and value window in one row
        format?: (n: number) => string;
        unit?: string;
        hint?: string;
    }>(),
    { step: 1, showValue: true, anyLabel: "Any" },
);

const model = defineModel<V>({ required: true });

const isRange = computed(() => Array.isArray(model.value));

const values = computed<number[]>(() => {
    const m = model.value as number | [number, number];
    return Array.isArray(m) ? [...m].sort((a, b) => a - b) : [m];
});

// normalize output if thumbs cross 10-5 to 5-10
const thumbs = ref<number[]>([...values.value]);
watch(values, (v) => {
    const mine = [...thumbs.value].sort((a, b) => a - b);
    if (mine.length !== v.length || mine.some((x, i) => x !== v[i]))
        thumbs.value = [...v];
});

// format out decimal noise
const places = (n: number) => (String(n).split(".")[1] ?? "").length;
const decimals = computed(() =>
    Math.max(places(props.step), places(props.min)),
);

function snap(v: number) {
    const c = Math.min(props.max, Math.max(props.min, v));
    const n = Math.round((c - props.min) / props.step) * props.step + props.min;
    return Number(Math.min(props.max, n).toFixed(decimals.value));
}

const neutralValues = computed<number[]>(() => {
    const n = (props.neutral ??
        (isRange.value ? [props.min, props.max] : props.max)) as
        | number
        | number[];
    return Array.isArray(n) ? n : [n];
});

const active = computed(
    () =>
        props.neutral === null ||
        values.value.some((v, i) => v !== neutralValues.value[i]),
);

const frac = (v: number) => (v - props.min) / (props.max - props.min);

const fill = computed(() => {
    const [a, b] = values.value.map(frac);
    if (isRange.value) return { a, b, edge: "" };
    return neutralValues.value[0] <= props.min
        ? { a, b: 1, edge: "to-end" }
        : { a: 0, b: a, edge: "from-start" };
});

const stops = computed(() => {
    const n = Math.floor((props.max - props.min) / props.step + 1e-9);
    return Array.from({ length: n + 1 }, (_, i) =>
        snap(props.min + i * props.step),
    );
});

const fmt = (n: number) => (props.format ? props.format(n) : String(n));

// show <= if only one range else give brackets
const text = computed(() => {
    if (!active.value) return props.anyLabel;
    const u = props.unit ?? "";
    const [lo, hi] = values.value;
    if (!isRange.value) return fmt(lo) + u;
    const loOpen = lo <= props.min;
    const hiOpen = hi >= props.max;
    if (loOpen && hiOpen) return props.anyLabel;
    if (loOpen) return `≤${fmt(hi)}${u}`;
    if (hiOpen) return `≥${fmt(lo)}${u}`;
    return lo === hi ? fmt(lo) + u : `${fmt(lo)} – ${fmt(hi)}${u}`;
});

function commit(next: number[]) {
    const sorted = [...next].sort((a, b) => a - b);
    if (sorted.every((v, i) => v === values.value[i])) return;
    model.value = (isRange.value ? [sorted[0], sorted[1]] : sorted[0]) as V;
}

function onInput(i: number, e: Event) {
    const next = [...thumbs.value];
    next[i] = snap(Number((e.target as HTMLInputElement).value));
    thumbs.value = next;
    commit(next);
}

// onclick move the nearest handle there
function pick(raw: number) {
    const v = snap(raw);
    const next = [...values.value];
    const nearest =
        isRange.value && Math.abs(v - next[1]) < Math.abs(v - next[0]) ? 1 : 0;
    next[nearest] = v;
    commit(next);
}

function onTrackDown(e: PointerEvent) {
    if (e.target instanceof HTMLInputElement || e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const th = el.offsetHeight;
    const f = (e.clientX - r.left - th / 2) / (r.width - th);
    pick(props.min + f * (props.max - props.min));
}

function thumbLabel(i: number) {
    if (!props.label) return undefined;
    if (!isRange.value) return props.label;
    const [a, b] = thumbs.value;
    const isMin = i === 0 ? a <= b : b < a;
    return `${props.label} ${isMin ? "minimum" : "maximum"}`;
}
</script>

<template>
    <div class="slider" :class="{ active, inline }" :title="hint">
        <span v-if="label" class="label">{{ label }}</span>

        <div class="track">
            <div class="inputs" @pointerdown="onTrackDown">
                <div class="rail" aria-hidden="true">
                    <span
                        class="fill"
                        :class="fill.edge"
                        :style="{ '--a': fill.a, '--b': fill.b }"
                    />
                </div>
                <input
                    v-for="(v, i) in thumbs"
                    :key="i"
                    type="range"
                    :min="min"
                    :max="max"
                    :step="step"
                    :value="v"
                    :aria-label="thumbLabel(i)"
                    :aria-valuetext="fmt(v) + (unit ?? '')"
                    @input="onInput(i, $event)"
                />
            </div>

            <div v-if="ticks" class="ticks" aria-hidden="true">
                <span
                    v-for="s in stops"
                    :key="s"
                    :class="{ cur: values.includes(s) }"
                    @click="pick(s)"
                    >{{ fmt(s) }}</span
                >
            </div>
        </div>

        <span v-if="showValue" class="value">{{ text }}</span>
    </div>
</template>

<style scoped>
.slider {
    --thumb: 0.875rem;
    --track: 0.25rem;
    --edge: var(--line, var(--color-border));
    --rail: color-mix(in srgb, var(--color-text) 12%, transparent);
    --kept: color-mix(in srgb, var(--color-text) 28%, transparent);
    --ring: color-mix(in srgb, var(--color-text) 40%, var(--edge));

    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
        "label value"
        "track track";
    align-items: center;
    gap: 0.375rem 0.75rem;
}
.slider.active {
    --kept: var(--color-accent);
    --ring: var(--color-accent);
}
.slider.inline {
    grid-template-columns: auto 1fr auto;
    grid-template-areas: "label track value";
    align-items: start;
}

.label {
    grid-area: label;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--gray);
}
.inline .label {
    line-height: var(--thumb);
}

.value {
    grid-area: value;
    min-width: 4.25rem;
    padding: 0.1875rem 0.625rem;
    font-size: 0.8125rem;
    line-height: 1.25;
    font-variant-numeric: tabular-nums;
    text-align: center;
    white-space: nowrap;
    color: var(--gray);
    background: var(
        --field,
        color-mix(in srgb, var(--color-surface), var(--color-bg))
    );
    border: 1px solid var(--edge);
    border-radius: 0.5rem;
}
.active .value {
    font-weight: 600;
    color: var(--color-accent);
    border-color: color-mix(in srgb, var(--color-accent) 45%, var(--edge));
}

.track {
    grid-area: track;
    min-width: 5rem;
}
.inputs {
    position: relative;
    height: var(--thumb);
}

.rail {
    position: absolute;
    inset: calc((var(--thumb) - var(--track)) / 2) 0;
    background: var(--rail);
    border-radius: 999px;
}
/* thumb centres travel from thumb/2 to width - thumb/2 */
.fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--a));
    width: calc((100% - var(--thumb)) * (var(--b) - var(--a)));
    background: var(--kept);
    border-radius: 999px;
}
.fill.from-start {
    left: 0;
    width: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--b));
}
.fill.to-end {
    width: calc(100% - var(--thumb) / 2 - (100% - var(--thumb)) * var(--a));
}

/* inputs are only there for their thumbs; the rail is drawn above */
input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background: none;
    pointer-events: none;
    appearance: none;
    -webkit-appearance: none;
}
input:focus-visible {
    outline: none;
}
input::-webkit-slider-runnable-track {
    height: var(--thumb);
    background: transparent;
}
input::-moz-range-track {
    height: var(--thumb);
    background: transparent;
}

input::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    box-sizing: border-box;
    width: var(--thumb);
    height: var(--thumb);
    background: var(--color-text);
    border: 2px solid var(--ring);
    border-radius: 50%;
    cursor: grab;
    pointer-events: auto;
}
input::-moz-range-thumb {
    box-sizing: border-box;
    width: var(--thumb);
    height: var(--thumb);
    background: var(--color-text);
    border: 2px solid var(--ring);
    border-radius: 50%;
    cursor: grab;
    pointer-events: auto;
}
input:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--color-accent) 35%, transparent);
}
input:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--color-accent) 35%, transparent);
}

/* each number is as wide as the thumb, so it sits right under its stop */
.ticks {
    display: flex;
    justify-content: space-between;
    margin-top: 0.125rem;
}
.ticks span {
    width: var(--thumb);
    font-size: 0.6875rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    text-align: center;
    white-space: nowrap;
    color: var(--gray);
    cursor: pointer;
    user-select: none;
}
.ticks .cur {
    font-weight: 700;
    color: var(--color-text);
}
</style>
