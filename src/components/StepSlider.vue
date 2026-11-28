<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ min: number; max: number; label: string }>();

const model = defineModel<number>({ required: true });

const emit = defineEmits<{ commit: [] }>();

const stops = computed(() =>
    Array.from({ length: props.max - props.min + 1 }, (_, i) => props.min + i),
);
const p = computed(() => (model.value - props.min) / (props.max - props.min));

function onInput(e: Event) {
    model.value = Number((e.target as HTMLInputElement).value);
}

function pick(v: number) {
    model.value = v;
    emit("commit");
}
</script>

<template>
    <div class="step">
        <span class="label">{{ label }}</span>

        <div class="inputs">
            <div class="rail" aria-hidden="true">
                <span class="fill" :style="{ '--p': p }" />
            </div>
            <input
                type="range"
                :min="min"
                :max="max"
                step="1"
                :value="model"
                :aria-label="label"
                @input="onInput"
                @change="emit('commit')"
            />
        </div>

        <div class="ticks" aria-hidden="true">
            <span
                v-for="s in stops"
                :key="s"
                :class="{ cur: s === model }"
                @click="pick(s)"
                >{{ s }}</span
            >
        </div>
    </div>
</template>

<style scoped>
.step {
    --thumb: 0.75rem;
    --track: 0.25rem;

    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: 0 0.75rem;
}

.label {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: var(--thumb);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--gray);
}

.inputs {
    position: relative;
    min-width: 5rem;
    height: var(--thumb);
}

.rail {
    position: absolute;
    inset: calc((var(--thumb) - var(--track)) / 2) 0;
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
    border-radius: 999px;
}

.fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--p));
    background: var(--color-accent);
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
    border: 2px solid var(--color-accent);
    border-radius: 50%;
    cursor: grab;
}
input::-moz-range-thumb {
    box-sizing: border-box;
    width: var(--thumb);
    height: var(--thumb);
    background: var(--color-text);
    border: 2px solid var(--color-accent);
    border-radius: 50%;
    cursor: grab;
}
input:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--color-accent) 35%, transparent);
}
input:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px
        color-mix(in srgb, var(--color-accent) 35%, transparent);
}

.ticks {
    grid-column: 2;
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
    color: var(--gray);
    cursor: pointer;
    user-select: none;
}
.ticks .cur {
    font-weight: 700;
    color: var(--color-text);
}

@media (pointer: coarse) {
    .step {
        --thumb: 1.25rem;
    }
}
</style>
