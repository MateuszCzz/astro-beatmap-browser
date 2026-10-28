<script setup lang="ts">
import { ratioFormat } from "../composables/rowDisplay";

defineProps<{ label: string; value: number }>();
</script>

<template>
    <div class="ring">
        <span class="ring__label">{{ label }}</span>
        <div class="ring__gauge" :style="{ '--ring-pct': value / 100 }">
            <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
                <circle class="ring__track" cx="29" cy="29" r="23" />
                <circle
                    class="ring__arc"
                    cx="29"
                    cy="29"
                    r="23"
                    pathLength="100"
                    transform="rotate(-90 29 29)"
                />
            </svg>
            <span class="ring__value">{{ ratioFormat(value) }}</span>
        </div>
    </div>
</template>

<style scoped>
.ring {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 80px;
}

.ring__label {
    font-size: 10px;
    letter-spacing: 0.12em;
    color: var(--gray);
}

.ring__gauge {
    display: grid;
    place-items: center;
}
.ring__gauge > * {
    grid-area: 1 / 1;
}

.ring__gauge svg {
    fill: none;
    stroke-width: 5;
}
.ring__track {
    stroke: var(--line);
}
.ring__arc {
    stroke: var(--ring-color);
    stroke-linecap: round;
    stroke-dasharray: var(--ring-pct) 100;
}

.ring__value {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
}
</style>
