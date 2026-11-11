<script setup lang="ts">
import { computed } from "vue";
import {
    srColor,
    srFormat,
    scoreVars,
    bigIntFormat,
    lengthFormat,
    decimalFormat,
    ratioFormat,
    aimSpeedScale,
} from "../domain/display.ts";
import { GENRES, LANGUAGES, type BeatmapParsed } from "../domain/beatmap";
import { tip, tipLazy, tipAttrs, tipText } from "../domain/tooltip";
import { pillsCreate } from "../domain/pill.ts";
import { useAudio } from "../composables/useAudio.ts";
import { useLookup } from "../composables/useLookup.ts";
import { useFoldingTags } from "../composables/useFoldingTags.ts";
import RatioRing from "./RatioRing.vue";
import RatioBar from "./RatioBar.vue";

const props = defineProps<{
    row: BeatmapParsed;
    eager?: boolean;
}>();

const { playingId, toggle } = useAudio();
const { name: lookup } = useLookup();
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
const pills = computed(() => pillsCreate(props.row));

const aim = computed(() => aimSpeedScale(props.row.aim_speed_ratio));

// both cover variants are rendered, CSS shows exactly one (see .cover__banner)
const covers = computed(() => {
    const base = `https://assets.ppy.sh/beatmaps/${props.row.mapset_id}/covers`;
    return {
        square: {
            src: `${base}/list.jpg`,
            srcset: `${base}/list.jpg 1x, ${base}/list@2x.jpg 2x`,
        },
        banner: {
            src: `${base}/card.jpg`,
            srcset: `${base}/card.jpg 1x, ${base}/card@2x.jpg 2x`,
        },
    };
});

// empty stringed in look up means deleted account
const mapper = computed(
    () => lookup("mappers", props.row.mapper_id) || "<deleted>",
);
const tags = computed(() =>
    props.row.tags.map((id) => ({ id, label: lookup("tags", id) })),
);

const { shown, rest, moreFits, bind: bindTags } = useFoldingTags(tags);
const hiddenTagsTip = computed(() => {
    const n = rest.value.length;
    return tipText(
        `${n} more tag${n > 1 ? "s:" : ":"}`,
        rest.value.map((t) => t.label).join("\n"),
    );
});
</script>

<template>
    <li class="map-row">
        <!-- pills -->
        <div class="pills">
            <span
                v-for="p in pills"
                :key="p.key"
                v-bind="tip(p.key)"
                :style="p.style"
                class="pill"
                >{{ p.label }}</span
            >
        </div>

        <div class="card">
            <!-- cover -->
            <div class="cover">
                <img
                    class="cover__square"
                    :src="covers.square.src"
                    :srcset="covers.square.srcset"
                    alt=""
                    :loading="eager ? 'eager' : 'lazy'"
                />
                <img
                    class="cover__banner"
                    :src="covers.banner.src"
                    :srcset="covers.banner.srcset"
                    alt=""
                    loading="lazy"
                />
                <!-- action buttons -->
                <button
                    class="cover-btn play"
                    type="button"
                    @click="toggle(row.mapset_id)"
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
                        <div class="title" v-bind="tipLazy('folded')">
                            <a
                                :href="`https://osu.ppy.sh/b/${row.difficulty_id}`"
                                target="_blank"
                                rel="noopener"
                                >{{ row.title }}</a
                            >
                            <span>{{ row.artist }}</span>
                        </div>
                        <div class="diff" v-bind="tipLazy('folded')">
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
                                    >{{ mapper }}</a
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
                        <div class="stat" data-fold v-bind="tip('top25')">
                            <small>TOP25<span class="sfx"> RATE</span></small
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
                        <div class="stat" data-fold v-bind="tip('hd')">
                            <small>HD<span class="sfx"> USAGE</span></small>
                            <b>{{ ratioFormat(row.hidden_ratio) }}</b>
                        </div>
                    </div>

                    <div class="aim_speed_split">
                        <div class="stat spacing" v-bind="tip('aimbias')">
                            <small>Spacing</small><b>{{ aim.spacing }}%</b>
                        </div>
                        <div class="stat density" v-bind="tip('aimbias')">
                            <small>Density</small><b>{{ aim.density }}%</b>
                        </div>
                    </div>

                    <!-- ratio rings -->
                    <div class="rings">
                        <RatioRing
                            label="TOP25 RATE"
                            :value="row.profile_top_25_ratio"
                            style="--ring-color: var(--gold)"
                            v-bind="tip('top25')"
                        />
                        <RatioRing
                            label="HD USAGE"
                            :value="row.hidden_ratio"
                            style="--ring-color: var(--blue)"
                            v-bind="tip('hd')"
                        />
                    </div>

                    <!-- pp data -->
                    <div class="payoff" :style="scoreVars(row.score)">
                        <div class="gains">
                            <div class="stat gain" v-bind="tip('avg')">
                                <small>NET GAIN</small>
                                <b
                                    >+{{ bigIntFormat(row.median_pp_gain)
                                    }}<span> pp</span></b
                                >
                            </div>
                            <div class="stat peak" v-bind="tip('max')">
                                <small>MAX PP</small>
                                <b
                                    >{{ bigIntFormat(row.max_pp)
                                    }}<span> pp</span></b
                                >
                            </div>
                        </div>
                        <div class="score" v-bind="tip('score')">
                            <small>SCORE</small>
                            <span>{{ bigIntFormat(row.score) }}</span>
                        </div>
                    </div>
                </div>

                <div class="foot">
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
                    <div v-if="row.tags.length" :ref="bindTags" class="tags">
                        <span v-for="t in shown" :key="t.id">{{
                            t.label
                        }}</span>
                        <span
                            v-if="rest.length"
                            v-show="moreFits"
                            class="more"
                            v-bind="tipAttrs(hiddenTagsTip)"
                            >+{{ rest.length }}</span
                        >
                    </div>
                    <!-- map style -->
                    <div class="bar" v-bind="tip('aimbias')">
                        <RatioBar :ratio="row.aim_speed_ratio" />
                    </div>
                </div>
            </div>
        </div>
    </li>
</template>

<style scoped>
/* now whole row wrap */
.map-row {
    --line: var(--color-border);
    container: row / inline-size;
    position: relative;
    isolation: isolate;
    line-height: 1.25;
    list-style: none;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

/* new map row */
.card {
    content-visibility: auto;
    contain-intrinsic-size: auto 140px;
    display: flex;
    flex-wrap: wrap;
    background: var(--color-surface);
    border: 1px solid var(--line);
    border-radius: 18px;
}

/* links  */
a {
    color: inherit;
    text-decoration: none;
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
    filter: brightness(0.65);
}
.cover svg {
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
}
/* mobile img. */
.cover__banner {
    display: none;
}

/* pills */
.pills {
    position: absolute;
    z-index: 1;
    left: -5px;
    top: -8px;
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
    height: 138px;
}
.top {
    flex: 1;
    min-height: 0;
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

/* allow overflow to truncate */
.title,
.diff {
    display: flex;
    align-items: baseline;
    column-gap: 8px;
}
.title > *,
.diff > * {
    flex: 1 1 0%;
    min-width: 0;
    max-width: max-content;
    overflow: hidden;
    text-overflow: ellipsis; /* Chromium/Safari */
    text-overflow: ".."; /* Firefox */
}

.title > :first-child {
    flex-grow: 3;
}
.diff > :first-child {
    flex-grow: 2;
}

.title {
    font-size: 20px;
    font-weight: 700;
}
.title span {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray);
}
.diff {
    column-gap: 4px;
    font-size: 15px;
    font-weight: 600;
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
.payoff,
.bar {
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
    align-self: stretch;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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
.score small {
    margin-bottom: 3px;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.25;
    letter-spacing: 0.08em;
    color: var(--gray);
    text-shadow: none;
}
.score span {
    text-box: trim-both cap alphabetic;
}

.foot {
    --bar-bg: color-mix(in srgb, var(--color-surface), var(--color-bg));
    flex: none;
    height: 38px;
    display: flex;
    align-items: center;
    padding: 0 24px 0 16px;
    background: var(--bar-bg);
    border-top: 1px solid var(--line);
    border-radius: 0 0 17px 0;
    font-size: 13px;
    font-weight: 600;
}
.meta {
    flex: none;
    padding-right: 16px;
}
.meta span + span::before {
    content: "\00b7";
    margin: 0 8px;
    font-weight: 400;
    color: color-mix(in srgb, var(--gray) 75%, var(--color-bg));
}
.tags {
    flex: 1 1 0;
    min-width: 0;
    height: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    border-left: 1px solid var(--line);
    overflow: hidden;
}
.tags span {
    flex: none;
    padding: 1px 8px;
    border: 1px solid var(--line);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text);
}

.payoff,
.bar {
    flex: none;
    width: 320px;
}
.payoff {
    justify-content: space-between;
    --gain: light-dark(oklch(0.55 0.11 160), var(--green));
    --peak: light-dark(oklch(0.55 0.11 85), var(--gold));
    display: flex;
    align-items: center;
    gap: 16px;
    border-left-color: color-mix(in srgb, var(--sc) 40%, var(--line));
}
.gains {
    flex: none;
    display: flex;
    flex-direction: column;
    gap: 9px;
}

.gains b {
    font-size: 16px;
    font-weight: 700;
    line-height: 19px;
}
.gain b {
    color: var(--gain);
}

.peak b {
    color: var(--peak);
}

.gains b span {
    font-size: 12px;
}

.bar {
    margin: 5px 0 5px auto;
    display: flex;
    align-items: center;
}

.aim_speed_split {
    display: none;
}

/* semi long view */
@container row (max-width: 1200px) {
    .rings {
        display: none;
    }
    .stat[data-fold] {
        display: flex;
    }
    .stats {
        grid-template-columns: 80px 80px 56px 80px;
    }
}

/* tablet/mobile view */
@container row (max-width: 1050px) {
    .sfx,
    .bar {
        display: none;
    }
}

/* tablet view */
@container row (535px < width <= 1050px) {
    .card {
        contain-intrinsic-size: auto 214.5px;
    }

    .cover {
        width: clamp(112px, 13cqw, 140px);
    }
    .actions .cover-btn {
        width: 40px;
        height: 40px;
    }

    .body {
        height: auto;
    }

    .top {
        flex: none;
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        grid-template-rows: minmax(68px, auto);
        grid-template-areas:
            "info info info info score   score"
            ".    .    .    .    spacing gain"
            ".    .    .    .    density peak";
        align-items: center;
        gap: 9px 16px;
        padding: 4px 20px 10px 20px;
    }

    .stats,
    .aim_speed_split,
    .payoff,
    .gains {
        display: contents;
    }

    .info {
        grid-area: info;
        padding-right: 20px;
    }
    .score {
        grid-area: score;
        font-size: 60px;
    }
    .spacing {
        grid-area: spacing;
    }
    .density {
        grid-area: density;
    }
    .gain {
        grid-area: gain;
    }
    .peak {
        grid-area: peak;
    }

    .foot {
        padding-right: 20px;
    }
    .tags {
        padding-right: 0;
    }
}

/* mobile view */
@container row (max-width: 535px) {
    /* placeholder height for off-screen rows */
    .card {
        contain-intrinsic-size: auto 283px;
    }

    /* swap song img */
    .cover__square {
        display: none;
    }
    .cover__banner {
        display: block;
    }

    /* cover banner */
    .cover {
        flex: 0 0 100%;
        height: 44px;
        border-right: 0;
        border-radius: 17px 17px 0 0;
    }
    .pills {
        left: -3px;
        top: -10px;
        gap: 6px;
    }
    .pill {
        padding: 2px 9px;
        font-size: 12px;
        line-height: 15px;
        box-shadow: 0 0 0 2px var(--color-bg);
    }

    .play {
        width: 100%;
        height: 100%;
        border-radius: inherit;
        color: rgba(255, 255, 255, 0.88);
    }
    .play:active {
        transform: none;
    }
    .play:active svg {
        transform: scale(0.9);
    }
    .play svg {
        width: 24px;
        height: 24px;
    }
    .play__tri {
        margin-left: 2px;
    }

    .actions {
        top: 0;
        right: 2px;
        bottom: auto;
        left: auto;
        gap: 0;
    }
    .actions .cover-btn {
        width: 44px;
        height: 44px;
        color: #fff;
    }
    .actions svg {
        width: 18px;
        height: 18px;
    }

    /* body grid */
    .body {
        flex: 1 0 100%;
        height: auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas:
            "info  score"
            "meta  gains"
            "stats stats"
            "tags  tags";
        column-gap: 10px;
        padding: 14px;
    }
    .top,
    .foot,
    .payoff {
        display: contents;
    }

    /* row 1 title block + score */
    .info {
        grid-area: info;
        padding-right: 0;
        gap: 5px;
    }
    .title {
        column-gap: 6px;
        font-size: 17px;
    }
    .title span {
        font-size: 12px;
    }
    .diff {
        font-size: 14px;
    }
    .diff small {
        font-size: 12px;
    }
    .score {
        grid-area: score;
        align-self: center;
        font-size: 38px;
        line-height: 1.05;
    }
    .score small {
        display: none;
    }

    /* row 2 genre / language / year + pp numbers */
    .meta {
        grid-area: meta;
        align-self: center;
        min-width: 0;
        margin-top: 8px;
        padding: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        color: color-mix(in srgb, var(--color-text) 25%, var(--gray));
    }
    .meta span + span::before {
        content: none;
    }
    .meta span + span {
        margin-left: 10px;
    }
    .gains {
        grid-area: gains;
        align-self: center;
        flex-direction: row;
        align-items: baseline;
        gap: 10px;
        margin-top: 8px;
    }
    .gains small {
        display: none;
    }
    .gains b {
        font-size: 15px;
        line-height: 17px;
    }
    .gains b span {
        font-size: 11px;
    }

    /* row 3 five columns */
    .stats,
    .aim_speed_split {
        grid-area: stats;
        margin: 12px 0 0;
        padding: 12px 0 0;
        border: 0;
        border-top: 1px solid var(--line);
    }
    .stats {
        width: 80%;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px 0;
    }
    .aim_speed_split {
        width: 20%;
        justify-self: end;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .stat small {
        font-size: 10px;
    }
    .stat b {
        font-size: 14px;
    }
    .sr-pill {
        font-size: 14px;
    }

    /* row 4 tags */
    .tags {
        grid-area: tags;
        height: auto;
        margin: 14px -14px -14px;
        padding: 10px 14px;
        background: var(--bar-bg);
        border-top: 1px solid var(--line);
        border-left: 0;
        border-radius: 0 0 17px 17px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .cover img,
    .actions,
    .cover-btn {
        transition: none;
    }
}
/* pointer behavior, not mobile */
@media (hover: hover) {
    a:hover {
        text-decoration: underline;
    }
    .cover-btn:hover {
        color: rgba(255, 255, 255, 0.95);
    }
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

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
    .cover img {
        transition: filter 0.15s;
    }
    .actions {
        transition: opacity 0.15s;
    }
}
</style>
