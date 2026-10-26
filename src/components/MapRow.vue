<script setup lang="ts">
import {
    GENRES,
    LANGUAGES,
    MODS,
    type BeatmapParsed,
} from "../composables/beatmap";
const props = defineProps<{
    row: BeatmapParsed;
    playing?: boolean;
    eager?: boolean;
}>();

const emit = defineEmits<{
    preview: [mapsetId: number];
}>();

// on click save id to clipboard
async function copyId() {
    try {
        await navigator.clipboard.writeText(String(props.row.difficulty_id));
    } catch {
        // clipboard blocked
    }
}
</script>

<template>
    <li class="map-row">
        <!-- cover -->
        <div>
            <img
                class="map-row__cover"
                :src="`https://assets.ppy.sh/beatmaps/${row.mapset_id}/covers/card.jpg`"
                alt=""
                :loading="eager ? 'eager' : 'lazy'"
            />
        </div>

        <!-- main info -->
        <div>
            <div>
                <span>
                    <a
                        :href="`https://osu.ppy.sh/b/${row.difficulty_id}`"
                        target="_blank"
                        rel="noopener"
                    >
                        {{ row.difficulty_id }}
                    </a>
                </span>
                <span>T{{ row.user_tier }}</span>
                <span>{{ MODS[row.mods] ?? row.mods }}</span>
                <strong>{{ row.artist }} – {{ row.title }}</strong>
                <span>[{{ row.diff }}]</span>
                <small>
                    mapped by
                    <a
                        :href="`https://osu.ppy.sh/users/${row.mapper_id}`"
                        target="_blank"
                        rel="noopener"
                        >{{ row.mapper_id }}</a
                    >
                </small>
            </div>

            <!-- rest info -->
            <div>
                <small>
                    {{ GENRES[row.genre_id] ?? row.genre_id }} ·
                    {{ LANGUAGES[row.language_id] ?? row.language_id }} ·
                    {{ row.year }}
                </small>
            </div>

            <!-- diff markers -->
            <div>
                <span>{{ row.sr / 100 }}★</span>
                <span>{{ row.bpm }}bpm</span>
                <span>AR{{ row.ar / 100 }}</span>
                <span>OD{{ row.od / 100 }}</span>
                <span>CS{{ row.cs / 100 }}</span>
                <span>{{ row.length }}</span>
            </div>

            <!-- ratios -->
            <div>
                <span>pass {{ row.pass_ratio / 100 }}%</span>
                <span>HD {{ row.hidden_ratio / 100 }}%</span>
                <span>FC {{ row.fc_ratio / 100 }}%</span>
                <span>top25 {{ row.profile_top_25_ratio / 100 }}%</span>
                <span>aim/speed {{ row.aim_speed_ratio / 100 }}%</span>
            </div>

            <!-- tags -->
            <div>
                <span v-for="t in row.tags" :key="t">{{ t }}</span>
            </div>

            <!-- pp markers -->
            <div>
                <span>max {{ row.max_pp }}pp</span>
                <span>median gain {{ row.median_pp_gain }}pp</span>
            </div>

            <!-- score -->
            <div>
                <span>score {{ row.score }}</span>
            </div>

            <!-- action buttons -->
            <div>
                <button type="button" @click="copyId">Copy diff id</button>
                <a
                    :href="`osu://dl/${row.mapset_id}`"
                    target="_blank"
                    rel="noopener"
                    >In-Game Download</a
                >
            </div>

            <!-- audio preview -->
            <button
                type="button"
                :aria-pressed="playing"
                @click="emit('preview', row.mapset_id)"
            >
                {{ playing ? "Pause" : "Preview" }}
            </button>
        </div>
    </li>
</template>

<style scoped>
span {
    margin: 3px;
}
.map-row {
    border-bottom: 2px solid var(--line);
    padding: 0.75em;
    list-style: none;
}
</style>
