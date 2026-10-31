<script setup lang="ts">
import { computed, inject, type Ref } from "vue";
import {
    srColor,
    srFormat,
    scoreVars,
    bigIntFormat,
    lengthFormat,
    decimalFormat,
    ratioFormat,
} from "../composables/rowDisplay";
import {
    GENRES,
    LANGUAGES,
    MODS,
    type BeatmapParsed,
} from "../composables/beatmap";

import { tip } from "../composables/tooltip";
import { pillsOf } from "../composables/pill.ts";
import RatioRing from "./RatioRing.vue";

const props = defineProps<{
    row: BeatmapParsed;
    eager?: boolean;
}>();

const emit = defineEmits<{
    preview: [mapsetId: number];
}>();

const playingId = inject<Ref<number | null>>("playingId")!;
const playing = computed(() => playingId.value === props.row.mapset_id);

// on click save id to clipboard
async function copyId() {
    try {
        await navigator.clipboard.writeText(String(props.row.difficulty_id));
    } catch {
        // clipboard blocked
    }
}
// gen or take by mask already done pills
const pills = computed(() => pillsOf(props.row));
</script>

<template>
    <li class="map-row">
        <!-- cover -->
        <div class="cover">
            <img
                :src="`https://assets.ppy.sh/beatmaps/${row.mapset_id}/covers/card.jpg`"
                alt=""
                :loading="eager ? 'eager' : 'lazy'"
            />
            <!--  pills  -->
            <div class="pills">
                <span
                    v-for="p in pills"
                    :key="p.key"
                    v-bind="p.attrs"
                    class="pill"
                    >{{ p.label }}</span
                >
            </div>
            <!-- action buttons -->
            <button
                class="cover-btn play"
                type="button"
                :aria-pressed="playing"
                :aria-label="playing ? 'Pause preview' : 'Play preview'"
                @click="emit('preview', row.mapset_id)"
            >
                <svg v-if="playing" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6.5" y="5" width="4" height="14" rx="1.2" />
                    <rect x="13.5" y="5" width="4" height="14" rx="1.2" />
                </svg>
                <svg
                    v-else
                    class="play__tri"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M7 4.5v15l13-7.5z" />
                </svg>
            </button>
            <div class="actions">
                <button
                    v-bind="tip('copy')"
                    class="cover-btn"
                    type="button"
                    aria-label="Copy difficulty ID"
                    @click="copyId"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="9" y="9" width="11" height="11" rx="2" />
                        <path d="M5 15V6a2 2 0 0 1 2-2h9" />
                    </svg>
                </button>
                <a
                    v-bind="tip('dl')"
                    class="cover-btn"
                    :href="`osu://b/${row.difficulty_id}`"
                    rel="noopener"
                    aria-label="Open in game"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M14 4h6v6" />
                        <path d="M20 4l-9 9" />
                        <path
                            d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"
                        />
                    </svg>
                </a>
            </div>
        </div>

        <div class="body">
            <div class="top">
                <!-- main info -->
                <div class="info">
                    <div class="title">
                        <a
                            :href="`https://osu.ppy.sh/b/${row.difficulty_id}`"
                            target="_blank"
                            rel="noopener"
                            >{{ row.title }}</a
                        >
                        <span>{{ row.artist }}</span>
                    </div>
                    <div class="diff">
                        <a
                            :href="`https://osu.ppy.sh/b/${row.difficulty_id}`"
                            target="_blank"
                            rel="noopener"
                            >{{ row.diff }}</a
                        >
                        <small>
                            by
                            <a
                                :href="`https://osu.ppy.sh/users/${row.mapper_id}`"
                                target="_blank"
                                rel="noopener"
                                >{{ row.mapper_id }}</a
                            >
                        </small>
                    </div>
                </div>

                <!-- stats grid -->
                <div class="stats">
                    <div class="stat" v-bind="tip('sr')">
                        <small>SR</small>
                        <span
                            class="sr-pill"
                            :style="{
                                '--sr-bg': srColor(row.sr),
                                '--sr-fg':
                                    row.sr >= 650 ? 'var(--gold)' : '#000',
                            }"
                            >{{ srFormat(row.sr) }}</span
                        >
                    </div>
                    <!-- row 1 -->
                    <div class="stat" v-bind="tip('length')">
                        <small>LENGTH</small>
                        <b>{{ lengthFormat(row.length) }}</b>
                    </div>
                    <div class="stat" v-bind="tip('bpm')">
                        <small>BPM</small> <b>{{ row.bpm }}</b>
                    </div>
                    <div class="stat" data-fold="1" v-bind="tip('aimbias')">
                        <small>AIM BIAS</small>
                        <b>{{ ratioFormat(row.aim_speed_ratio) }}</b>
                    </div>
                    <div class="stat" data-fold="2" v-bind="tip('top25')">
                        <small>TOP25 RATE</small
                        ><b>{{ ratioFormat(row.profile_top_25_ratio) }}</b>
                    </div>

                    <!-- row 2 -->
                    <div class="stat" v-bind="tip('cs')">
                        <small>CS</small> <b>{{ decimalFormat(row.cs) }}</b>
                    </div>
                    <div class="stat" v-bind="tip('ar')">
                        <small>AR</small> <b>{{ decimalFormat(row.ar) }}</b>
                    </div>
                    <div class="stat" v-bind="tip('od')">
                        <small>OD</small> <b>{{ decimalFormat(row.od) }}</b>
                    </div>
                    <div class="stat" data-fold="1" v-bind="tip('pass')">
                        <small>PASS RATE</small>
                        <b>{{ ratioFormat(row.pass_ratio) }}</b>
                    </div>
                    <div class="stat" data-fold="2" v-bind="tip('hd')">
                        <small>HD USAGE</small>
                        <b>{{ ratioFormat(row.hidden_ratio) }}</b>
                    </div>
                </div>

                <!-- ratio rings -->
                <div class="rings">
                    <RatioRing
                        :data-fold="1"
                        label="AIM BIAS"
                        :value="row.aim_speed_ratio"
                        style="--ring-color: var(--gold)"
                        v-bind="tip('aimbias')"
                    />
                    <RatioRing
                        :data-fold="1"
                        label="PASS RATE"
                        :value="row.pass_ratio"
                        style="--ring-color: var(--green)"
                        v-bind="tip('pass')"
                    />
                    <RatioRing
                        :data-fold="2"
                        label="TOP25 RATE"
                        :value="row.profile_top_25_ratio"
                        style="--ring-color: var(--pink)"
                        v-bind="tip('top25')"
                    />
                    <RatioRing
                        :data-fold="2"
                        label="HD USAGE"
                        :value="row.hidden_ratio"
                        style="--ring-color: var(--blue)"
                        v-bind="tip('hd')"
                    />
                </div>

                <!-- score -->
                <div
                    class="score"
                    v-bind="tip('score')"
                    :style="scoreVars(row.score)"
                >
                    {{ bigIntFormat(row.score) }}
                </div>
            </div>

            <div class="bar">
                <!-- rest info -->
                <div class="meta">
                    <span v-bind="tip('genre')">{{
                        GENRES[row.genre_id] ?? row.genre_id
                    }}</span>
                    <span v-bind="tip('lang')">{{
                        LANGUAGES[row.language_id] ?? row.language_id
                    }}</span>
                    <span v-bind="tip('year')">{{ row.year }}</span>
                </div>
                <!-- tags -->
                <div v-if="row.tags.length" class="tags">
                    <span v-for="t in row.tags" :key="t">{{ t }}</span>
                </div>
                <!-- pp markers -->
                <div class="pp">
                    <div v-bind="tip('avg')" style="--pp: var(--green)">
                        <small>NET GAIN:</small>
                        <b
                            >+{{ bigIntFormat(row.median_pp_gain)
                            }}<span> pp</span></b
                        >
                    </div>
                    <div v-bind="tip('max')" style="--pp: var(--gold)">
                        <small>MAX PP:</small>
                        <b>{{ bigIntFormat(row.max_pp) }}<span> pp</span></b>
                    </div>
                </div>
            </div>
        </div>
    </li>
</template>

<style scoped>
.map-row {
    --line: var(--color-border);
    container: row / inline-size;
    overflow-clip-margin: 16px;
    display: flex;
    height: 140px;
    line-height: 1.25;
    list-style: none;
    background: var(--color-surface);
    border: 1px solid var(--line);
    border-radius: 18px;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

/* tooltips  */
a {
    color: inherit;
    text-decoration: none;
}
a:hover {
    text-decoration: underline;
}
[data-tip] {
    cursor: help;
}

/* cover */
.cover {
    position: relative;
    flex: none;
    width: 138px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-surface) 95%, var(--color-text));
    border-right: 1px solid var(--line);
    border-radius: 17px 0 0 17px;
}
.cover img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
    /* mobile */
    filter: brightness(0.65);
    transition: filter 0.15s;
}
.map-row:hover .cover img,
.map-row:has(:focus-visible) .cover img {
    filter: brightness(0.5);
}
.cover svg {
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}

/* pills */
.pills {
    position: absolute;
    left: -6px;
    top: -6px;
    display: flex;
    gap: 8px;
}
.pill {
    padding: 3px 9px;
    border-radius: 999px;
    background: var(--pill-bg);
    color: var(--pill-fg);
    box-shadow: 0 0 0 2px var(--pill-fg);
    font-size: 13px;
    font-weight: 700;
    line-height: 18px;
}

/* buttons */
.cover-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    background: none;
    color: rgba(255, 255, 255, 0.72);
    cursor: pointer;
    transition:
        color 0.15s,
        transform 0.15s;
}
.cover-btn:hover {
    color: rgba(255, 255, 255, 0.95);
}
.play {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: 12px;
}
.play:active {
    transform: scale(0.92);
}
.play svg {
    width: 34px;
    height: 34px;
    fill: currentColor;
}
.play__tri {
    margin-left: 3px;
}
.actions {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    display: flex;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.15s;
}
.map-row:hover .actions,
.map-row:has(:focus-visible) .actions {
    opacity: 1;
}
.actions .cover-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
}
.actions svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
}

/* row top bar */
.body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
}
.top {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 24px 0 20px;
}
.info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
}
.title {
    font-size: 20px;
    font-weight: 700;
    overflow: hidden;
}
.title span {
    margin-left: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--gray);
}
.diff {
    font-size: 15px;
    font-weight: 500;
    overflow: hidden;
}
.diff small {
    font-size: 13px;
    color: var(--gray);
}
.diff small a {
    font-weight: 700;
    color: var(--color-text);
}

.stats,
.rings,
.score {
    align-self: stretch;
    margin: 10px 0;
    padding-left: 22px;
    border-left: 1px solid var(--line);
}

/* stats rings */
.stats {
    flex: none;
    display: grid;
    grid-template-columns: 80px 80px 56px;
    align-content: center;
    align-items: start;
    gap: 9px 0;
}
.stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.stat[data-fold] {
    display: none;
}
.stat small {
    margin-bottom: 3px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--gray);
}
.stat b {
    font-size: 15px;
    font-weight: 700;
}

.sr-pill {
    margin: -2px 0 -2px -9px;
    padding: 5px 9px;
    border-radius: 999px;
    background: var(--sr-bg);
    color: var(--sr-fg);
    font-size: 15px;
    font-weight: 700;
    text-box: trim-both cap alphabetic;
    outline: 2px solid currentColor;
    outline-offset: -1px;
}

.rings {
    display: flex;
    align-items: center;
    margin-left: -16px;
    padding-left: 12px;
}
.rings :deep(.ring__label) {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
}
.rings :deep(.ring__value) {
    font-size: 12px;
    font-weight: 700;
}

.score {
    flex: none;
    display: flex;
    align-items: center;
    width: 224px;
    justify-content: flex-end;
    font-size: 68px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--sc);
    text-shadow:
        0 0 calc(2px + 16px * var(--g))
            color-mix(in srgb, var(--sc) calc(60% * var(--g)), transparent),
        0 0 calc(26px * var(--g))
            color-mix(in srgb, var(--sc) calc(35% * var(--g)), transparent);
}

.bar {
    flex: none;
    height: 46px;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 0 24px 0 16px;
    background: color-mix(in srgb, var(--color-surface), var(--color-bg));
    border-top: 1px solid var(--line);
    border-radius: 0 0 17px 0;
    font-size: 14px;
    font-weight: 600;
}
.meta {
    flex: none;
    width: 250px;
}
.meta span + span::before {
    content: "·";
    margin: 0 8px;
    font-weight: 400;
    color: color-mix(in srgb, var(--gray) 75%, var(--color-bg));
}
.tags {
    flex: 1 1 0;
    min-width: 0;
    height: 24px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 18px;
    border-left: 1px solid var(--line);
    overflow: hidden;
}
.tags span {
    flex: none;
    padding: 2px 10px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    color: var(--gray);
}
/* rest info */
.pp {
    flex: none;
    display: flex;
    gap: 10px;
    margin-left: auto;
}
.tags + .pp::before {
    content: "";
    align-self: center;
    width: 1px;
    height: 24px;
    margin-right: 8px;
    background: var(--line);
}
.pp > div {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: baseline;
    align-content: center;
    column-gap: 8px;
    box-sizing: border-box;
    height: 30px;
    padding: 0 12px;
    border-radius: 10px;
}
.pp > div::before {
    content: "";
    align-self: center;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--pp);
    margin-top: 3.5px;
}
.pp small {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--gray);
}
.pp b {
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    color: var(--color-text);
}

.pp b span {
    font-size: 12px;
    font-weight: 600;
    color: var(--gray);
}

/* responsive change rings to strings */
/* 2/4 rings */
@container row (max-width: 1285px) {
    .rings [data-fold="1"] {
        display: none;
    }
    .stat[data-fold="1"] {
        display: flex;
    }
    .stats {
        grid-template-columns: repeat(4, 80px);
    }
}
/* 0/4 rings */
@container row (max-width: 1230px) {
    .rings {
        display: none;
    }
    .stat[data-fold="2"] {
        display: flex;
    }
    .stats {
        grid-template-columns: repeat(5, 80px);
    }
}
/* 1140 requires more views */


@media (prefers-reduced-motion: reduce) {
    .cover img,
    .actions,
    .cover-btn {
        transition: none;
    }
}
/* pointer behavior, not mobile */
@media (hover: hover) {
    .cover img {
        filter: brightness(0.82);
    }
    .actions {
        opacity: 0;
    }
    .map-row:hover .cover img,
    .map-row:has(:focus-visible) .cover img {
        filter: brightness(0.5);
    }
    .map-row:hover .actions,
    .map-row:has(:focus-visible) .actions {
        opacity: 1;
    }
}
</style>
