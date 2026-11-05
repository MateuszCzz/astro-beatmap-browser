<script setup lang="ts">
import { computed, toRef } from "vue";
import FilterBar from "./FilterBar.vue";
import MapList from "./MapList.vue";
import AudioPlayer from "./AudioPlayer.vue";
import TooltipBox from "./TooltipBox.vue";
import type { DataFiles } from "../composables/data";
import { useData } from "../composables/useData";
import { provideLookups } from "../composables/useLookups.ts";
import { provideAudioPreview } from "../composables/useAudio.ts";
import { useFilters } from "../composables/useFilters";

const props = defineProps<{ files: DataFiles }>();

provideAudioPreview();

const { state, matcher } = useFilters();
const { rows, phase, restError, retry } = useData(
    toRef(state, "tier"),
    props.files.tiers,
);

// rendering waits for the core tables
const { ready } = provideLookups(props.files.lookups);

const loading = computed(
    () =>
        phase.value !== "error" && (phase.value === "loading" || !ready.value),
);

// apply filters
const filtered = computed(() => rows.value.filter(matcher.value));
const queryKey = computed(() => [state.tier, matcher.value] as const);
const failed = computed(() => phase.value === "error" || restError.value);
</script>

<template>
    <div class="farm">
        <FilterBar />
        <!-- placeholder while loading -->
        <div v-if="loading" class="skeleton" aria-hidden="true">
            <div v-for="n in 4" :key="n" class="skeleton-card" />
        </div>

        <template v-else>
            <p v-if="phase !== 'error'" class="notice" aria-live="polite">
                {{ filtered.length.toLocaleString() }} maps.
            </p>
            <MapList
                :rows="filtered"
                :reset-key="queryKey"
                :loading-more="phase === 'core'"
                :failed="failed"
                @retry="retry"
            />
        </template>
        <AudioPlayer />
        <TooltipBox />
    </div>
</template>

<style scoped>
.farm {
    --bg: var(--color-bg);
    --surface: var(--color-surface);
    --line: var(--color-border);
    --text: var(--color-text);

    /* derived, theme */
    --surface-2: color-mix(in srgb, var(--color-surface) 60%, var(--color-bg));
    --muted: color-mix(in srgb, var(--color-text) 65%, var(--color-bg));

    font-size: 0.8rem;
    line-height: 1.3;
    font-family: var(--font-sans);
}

.notice {
    margin: 0 1.5em 1em;
    color: var(--muted);
}

/* Loading placeholder */
.skeleton {
    --sk-hi: color-mix(in srgb, var(--surface) 96%, var(--text));
    display: grid;
    gap: 1em;
    padding: 1.5em;
    opacity: 0;
    animation: reveal 0s 150ms forwards;
}
@keyframes reveal {
    to {
        opacity: 1;
    }
}
.skeleton-card {
    min-height: 8.75em;
    border-radius: 1.4em;
    background: var(--surface);
    border: 1px solid var(--line);
    animation: pulse 1.2s ease-in-out infinite alternate;
}
@keyframes pulse {
    to {
        background: var(--sk-hi);
    }
}
@media (prefers-reduced-motion: reduce) {
    .skeleton-card {
        animation: none;
        background: var(--sk-hi);
    }
}
</style>
