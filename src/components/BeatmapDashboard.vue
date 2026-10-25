<script setup lang="ts">
import { onMounted, ref } from "vue";
import FilterBar from "./FilterBar.vue";
import MapList from "./MapList.vue";

const loading = ref(true);

// delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

onMounted(async () => {
    try {
        // TODO: replace with json successful load confirmation
        await delay(5000);
    } finally {
        loading.value = false;
    }
});
</script>

<template>
    <div class="farm">
        <FilterBar />
        <!-- placeholder while content is loading -->
        <div v-if="loading" class="skeleton" aria-hidden="true">
            <div v-for="n in 4" :key="n" class="skeleton-card" />
        </div>

        <template v-else>
            <MapList />
        </template>
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
