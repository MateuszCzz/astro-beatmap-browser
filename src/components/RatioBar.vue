<script setup lang="ts">
import { computed } from "vue";
import { clamp, aimSpeedScale } from "../domain/display";

const props = defineProps<{ ratio: number }>();

// on which % aim leads color max
const LEAD_COLOR_MAX = 75;

const bar = computed(() => {
    const { spacing, density } = aimSpeedScale(props.ratio);
    const leadPct = Math.max(spacing, density);

    return {
        spacing,
        density,
        leadPct,
        lead: spacing >= density ? "spacing" : "density",
        mix: clamp(((leadPct - 50) * 100) / (LEAD_COLOR_MAX - 50), 0, 100),
    };
});
</script>

<template>
    <div
        class="ratio-bar"
        :data-lead="bar.lead"
        :style="{ '--lead-mix': bar.mix + '%' }"
    >
        <span class="bar-title">PP SOURCE</span>
        <span class="bar-label" :class="{ 'is-lead': bar.lead === 'spacing' }">
            Spacing
        </span>

        <div class="bar-track" :style="{ '--split': bar.spacing / 100 }">
            <div class="bar-line">
                <span
                    v-if="bar.spacing"
                    class="bar-segment bar-segment-spacing"
                    :style="{ flexGrow: bar.spacing }"
                />
                <span
                    v-if="bar.density"
                    class="bar-segment bar-segment-density"
                    :style="{ flexGrow: bar.density }"
                />
            </div>
            <span class="bar-pill">{{ bar.leadPct }}%</span>
        </div>

        <span class="bar-label" :class="{ 'is-lead': bar.lead === 'density' }">
            Density
        </span>
    </div>
</template>

<style scoped>
.ratio-bar {
    --density: light-dark(
        oklch(from var(--blue) 0.55 0.16 h),
        oklch(from var(--blue) 0.76 0.12 h)
    );
    --spacing: light-dark(
        oklch(from var(--red) 0.58 0.18 h),
        oklch(from var(--red) 0.76 0.14 h)
    );
    --void: light-dark(
        oklch(from var(--gray) 0.93 0.008 h),
        oklch(from var(--gray) 0.26 0.008 h)
    );
    --tie: light-dark(
        oklch(from var(--gray) 0.565 0 none),
        oklch(from var(--gray) 0.75 0 none)
    );

    --lead: color-mix(in oklab, var(--side) var(--lead-mix), var(--tie));

    --line-h: 0.45em;
    --pill-w: 3.2em;
    --pill-h: 1.5em;
    --ring: 0.15em;

    font-size: 12px;

    display: flex;
    align-items: center;
    gap: 0.5em;
    width: 100%;
}

.ratio-bar[data-lead="spacing"] {
    --side: var(--spacing);
}

.ratio-bar[data-lead="density"] {
    --side: var(--density);
}

.bar-title {
    flex: none;
    margin-inline-end: 0.8em;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--gray);
}

.bar-label {
    flex: none;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--tie);
    text-box: trim-both cap alphabetic;
}

.bar-label.is-lead {
    color: var(--lead);
}

.bar-track {
    position: relative;
    flex: 1;
    min-width: 6em;
    height: var(--pill-h);
    display: flex;
    align-items: center;
}

.bar-line {
    display: flex;
    gap: var(--ring);
    width: 100%;
    height: var(--line-h);
    border-radius: 999px;
    overflow: hidden;
    background: var(--void);
}

.bar-segment {
    flex-basis: 0;
}

.bar-segment-spacing {
    background: var(--spacing);
}

.bar-segment-density {
    background: var(--density);
}

.bar-pill {
    position: absolute;
    top: 50%;

    left: calc(var(--pill-w) / 2 + (100% - var(--pill-w)) * var(--split));
    translate: -50% -50%;
    width: var(--pill-w);
    height: var(--pill-h);
    border-radius: 999px;
    background: var(--lead);
    box-shadow: 0 0 0 var(--ring) var(--void);
    font-weight: 700;
    line-height: var(--pill-h);
    text-align: center;
    color: light-dark(#fff, #0b0b0b);
}
</style>
