<script setup lang="ts">
import { onMounted, ref, shallowRef, computed } from "vue";
import FilterBar from "./FilterBar.vue";
import MapList from "./MapList.vue";
import { toParse, type BeatmapRaw } from "../composables/beatmap";

const loading = ref(true);

// delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

//TEMP: hand-made json records
const SAMPLE: BeatmapRaw[] = [
    {
        difficulty_id: 3601629,
        mods: 1,
        user_tier: 4,
        mapset_id: 1759729,
        mapper_id: 896613,
        artist: "kakichoco",
        title: "Zanei",
        diff: "Illusion",
        sr: 640,
        bpm: 180,
        ar: 930,
        od: 900,
        cs: 420,
        length: 255,
        year: 2022,
        genre_id: 4,
        language_id: 3,
        pass_ratio: 875,
        hidden_ratio: 514,
        fc_ratio: 120,
        max_pp: 333,
        median_pp_gain: 25,
        profile_top_25_ratio: 3822,
        aim_speed_ratio: 5757,
        tag_1: 76,
        tag_2: 50,
        tag_3: 17,
        tag_4: 62,
        tag_5: 37,
        score: 516,
    },
    {
        difficulty_id: 1818428,
        mods: 1,
        user_tier: 4,
        mapset_id: 869019,
        mapper_id: 6280862,
        artist: "Okazaki Taiiku",
        title: "Kimi no Bouken (TV Size)",
        diff: "SquareTudes Extra",
        sr: 602,
        bpm: 200,
        ar: 940,
        od: 930,
        cs: 400,
        length: 86,
        year: 2018,
        genre_id: 3,
        language_id: 3,
        pass_ratio: 877,
        hidden_ratio: 330,
        fc_ratio: 439,
        max_pp: 307,
        median_pp_gain: 12,
        profile_top_25_ratio: 2442,
        aim_speed_ratio: 6640,
        tag_1: 50,
        tag_2: null,
        tag_3: null,
        tag_4: null,
        tag_5: null,
        score: 271,
    },
    {
        difficulty_id: 1570203,
        mods: 1,
        user_tier: 4,
        mapset_id: 744772,
        mapper_id: 2308676,
        artist: "toby fox",
        title: "Last Goodbye",
        diff: "Determination",
        sr: 632,
        bpm: 180,
        ar: 930,
        od: 950,
        cs: 400,
        length: 86,
        year: 2019,
        genre_id: 2,
        language_id: 5,
        pass_ratio: 1041,
        hidden_ratio: 712,
        fc_ratio: 367,
        max_pp: 358,
        median_pp_gain: 66,
        profile_top_25_ratio: 5742,
        aim_speed_ratio: 6903,
        tag_1: 33,
        tag_2: 37,
        tag_3: 50,
        tag_4: 72,
        tag_5: 18,
        score: 2082,
    },
];

const loadedJson = shallowRef<BeatmapRaw[]>(SAMPLE);

const beatmapRows = computed(() => loadedJson.value.map(toParse));

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
            <MapList :rows="beatmapRows" />
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
