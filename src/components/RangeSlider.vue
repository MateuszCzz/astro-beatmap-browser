<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
    defineProps<{
        min: number;
        max: number;
        step?: number;
        label: string;
        format?: (n: number) => string;
    }>(),
    { step: 1 },
);

const model = defineModel<[number, number]>({ required: true });

const emit = defineEmits<{ commit: [] }>();

// normalize output if thumbs cross 10-5 to 5-10
const thumbs = ref<[number, number]>([...model.value]);
watch(model, ([lo, hi]) => {
    const [a, b] = thumbs.value;
    if (Math.min(a, b) !== lo || Math.max(a, b) !== hi) thumbs.value = [lo, hi];
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

const frac = (v: number) => (v - props.min) / (props.max - props.min);
const fmt = (n: number) => (props.format ? props.format(n) : String(n));

const active = computed(
    () => model.value[0] > props.min || model.value[1] < props.max,
);

// show <= if only one range else give brackets
const text = computed(() => {
    if (!active.value) return "Any";
    const [lo, hi] = model.value;
    if (lo <= props.min) return `≤${fmt(hi)}`;
    if (hi >= props.max) return `≥${fmt(lo)}`;
    return lo === hi ? fmt(lo) : `${fmt(lo)} – ${fmt(hi)}`;
});

function set(a: number, b: number) {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (lo !== model.value[0] || hi !== model.value[1]) model.value = [lo, hi];
}

function onInput(i: number, e: Event) {
    const next: [number, number] = [...thumbs.value];
    next[i] = snap(Number((e.target as HTMLInputElement).value));
    thumbs.value = next;
    set(next[0], next[1]);
}

// drag started on thumb and ended over the rail
let grabbedThumb = false;
function rememberGrab(e: PointerEvent) {
    grabbedThumb = e.target instanceof HTMLInputElement;
}

// click move the nearest handle there
function onTrackClick(e: MouseEvent) {
    if (grabbedThumb || e.target instanceof HTMLInputElement) return;
    const el = e.currentTarget as HTMLElement;
    const r = el.getBoundingClientRect();
    const th = el.offsetHeight; // = thumb size
    const f = (e.clientX - r.left - th / 2) / (r.width - th);
    const v = snap(props.min + f * (props.max - props.min));
    const [lo, hi] = model.value;
    if (Math.abs(v - hi) < Math.abs(v - lo)) set(lo, v);
    else set(v, hi);
    emit("commit");
}

function thumbLabel(i: number) {
    const [a, b] = thumbs.value;
    const isMin = i === 0 ? a <= b : b < a;
    return `${props.label} ${isMin ? "minimum" : "maximum"}`;
}
</script>

<template>
    <div class="slider" :class="{ active }">
        <span class="label">{{ label }}</span>
        <span class="value">{{ text }}</span>

        <div class="inputs" @pointerdown="rememberGrab" @click="onTrackClick">
            <div class="rail" aria-hidden="true">
                <span
                    class="fill"
                    :style="{ '--a': frac(model[0]), '--b': frac(model[1]) }"
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
                :aria-valuetext="fmt(v)"
                @input="onInput(i, $event)"
                @change="emit('commit')"
            />
        </div>
    </div>
</template>

<style scoped>
.slider {
    --thumb: 0.75rem;
    --track: 0.25rem;
    --edge: var(--line, var(--color-border));
    --rail: color-mix(in srgb, var(--color-text) 12%, transparent);
    --kept: color-mix(in srgb, var(--color-text) 28%, transparent);
    --ring: color-mix(in srgb, var(--color-text) 40%, var(--edge));

    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.375rem 0.75rem;
}
.slider.active {
    --kept: var(--color-accent);
    --ring: var(--color-accent);
}

.label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis; /* Chromium/Safari */
    text-overflow: ".."; /* Firefox */
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--gray);
}

.value {
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

.inputs {
    grid-column: 1 / -1;
    position: relative;
    min-width: 5rem;
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

@media (pointer: coarse) {
    .slider {
        --thumb: 1.25rem;
    }
}
</style>
