<script setup lang="ts">
import {
    srColor,
    srFormat,
    scoreVars,
    bigIntFormat,
    lengthFormat,
    ratioFormat,
    decimalFormat,
} from "../composables/rowDisplay";
import {
    GENRES,
    LANGUAGES,
    MODS,
    type BeatmapParsed,
} from "../composables/beatmap";

import { tip } from "../composables/tooltip";

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
                <span v-bind="tip(`T${row.user_tier}`)"
                    >T{{ row.user_tier }}</span
                >
                <span v-bind="tip(MODS[row.mods])">{{
                    MODS[row.mods] ?? row.mods
                }}</span>
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
                    <span v-bind="tip('genre')">{{
                        GENRES[row.genre_id] ?? row.genre_id
                    }}</span>
                    ·
                    <span v-bind="tip('lang')">{{
                        LANGUAGES[row.language_id] ?? row.language_id
                    }}</span>
                    ·
                    <span v-bind="tip('year')">{{ row.year }}</span>
                </small>
            </div>

            <!-- diff markers -->
            <div>
                <!-- sr pill -->
                <div
                    v-bind="tip('sr')"
                    class="sr-pill"
                    :style="{
                        '--sr-bg': srColor(row.sr),
                        '--sr-fg': row.sr >= 650 ? '#FFD700' : '#000',
                    }"
                >
                    <span>{{ srFormat(row.sr) }}</span>
                </div>
                <span v-bind="tip('bpm')">{{ row.bpm }} bpm</span>
                <span v-bind="tip('ar')">AR{{ decimalFormat(row.ar) }}</span>
                <span v-bind="tip('od')">OD{{ decimalFormat(row.od) }}</span>
                <span v-bind="tip('cs')">CS{{ decimalFormat(row.cs) }}</span>
                <span v-bind="tip('length')">{{
                    lengthFormat(row.length)
                }}</span>
            </div>

            <!-- ratios -->
            <div>
                <span v-bind="tip('pass')"
                    >pass {{ ratioFormat(row.pass_ratio) }}</span
                >
                <span v-bind="tip('hd')"
                    >HD {{ ratioFormat(row.hidden_ratio) }}</span
                >
                <span v-bind="tip('top25')"
                    >top25 {{ ratioFormat(row.profile_top_25_ratio) }}</span
                >
                <span v-bind="tip('aimbias')"
                    >aim/speed {{ ratioFormat(row.aim_speed_ratio) }}
                </span>
            </div>

            <!-- tags -->
            <div>
                <span v-for="t in row.tags" :key="t">{{ t }}</span>
            </div>

            <!-- pp markers -->
            <div>
                <span v-bind="tip('max')"
                    >max
                    <span style="font-weight: 700"
                        >{{ bigIntFormat(row.max_pp) }}pp</span
                    ></span
                >
                <span v-bind="tip('avg')"
                    >median gain
                    <span style="font-weight: 700"
                        >+{{ bigIntFormat(row.median_pp_gain) }}pp</span
                    ></span
                >
            </div>

            <!-- score -->
            <div
                v-bind="tip('score')"
                class="score"
                :style="scoreVars(row.score)"
            >
                score {{ bigIntFormat(row.score) }}
            </div>

            <!-- action buttons -->
            <div>
                <button v-bind="tip('copy')" type="button" @click="copyId">
                    Copy diff id
                </button>
                <a
                    v-bind="tip('dl')"
                    :href="`osu://b/${row.difficulty_id}`"
                    rel="noopener"
                    >In-Game Open</a
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

.sr-pill {
    display: inline-block;
    padding: 0.1em 0.45em;
    border-radius: 999px;

    background: var(--sr-bg);
    color: var(--sr-fg);

    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;

    outline: 1px solid currentColor;
    outline-offset: -1px;
    box-shadow: inset 0 0 0 1px currentColor;
}

.score {
    color: var(--sc);
    text-shadow: 0 0 calc(var(--g) * 10px) var(--sc);
    font-weight: 600;
    font-size: 2em;
}
</style>
