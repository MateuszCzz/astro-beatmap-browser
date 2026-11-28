<script setup lang="ts">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
} from "vue";
import {
    GENRES,
    LANGUAGES,
    MODS,
    TIERS,
    RANGES,
    FLAGS,
} from "../domain/beatmap";
import type { ModId, RangeDef, RangeKey, FlagKey } from "../domain/beatmap";
import { pillFor } from "../domain/pill";
import { useFilter } from "../composables/useFilter";
import { useLookup } from "../composables/useLookup";
import MultiSelect from "./MultiSelect.vue";
import RangeSlider from "./RangeSlider.vue";
import StepSlider from "./StepSlider.vue";

const props = defineProps<{ resultCount?: number }>();

const SHEET_MS = 220;
const SHEET_DURATION = `${SHEET_MS}ms`;

const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// get chips bg fg
const TIER_BUTTONS = TIERS.map((t) => ({
    tier: t,
    style: pillFor(`T${t}`).style,
}));

const MOD_BUTTONS = Object.entries(MODS).map(([id, key]) => {
    const pill = pillFor(key);
    return { id: Number(id) as ModId, label: pill.label, style: pill.style };
});

const FLAG_BUTTONS = (Object.keys(FLAGS) as FlagKey[]).map((k) => {
    const pill = pillFor(k);
    return { bit: FLAGS[k], label: pill.label, style: pill.style };
});

const { state, activeRangeCount, reset, flushSliders } = useFilter();
const { options, prefetch, name } = useLookup();

const searchInput = ref<HTMLInputElement | null>(null);
const searchActive = computed(() => !!state.search);
const openRanges = ref(false);
const openMobileSheet = ref(false);

function useScrollEdges(el: { value: HTMLElement | null }, axis: "x" | "y") {
    const edges = reactive({ start: false, end: false });
    let frame = 0;

    function measure() {
        const e = el.value;
        if (!e) return;
        const [pos, view, total] =
            axis === "x"
                ? [e.scrollLeft, e.clientWidth, e.scrollWidth]
                : [e.scrollTop, e.clientHeight, e.scrollHeight];
        edges.start = pos > 1;
        edges.end = pos + view < total - 1;
    }
    function schedule() {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(measure);
    }

    let resize: ResizeObserver | undefined;
    let mutate: MutationObserver | undefined;
    onMounted(() => {
        if (!el.value) return;
        resize = new ResizeObserver(schedule);
        resize.observe(el.value);
        mutate = new MutationObserver(schedule);
        mutate.observe(el.value, { childList: true, subtree: true });
        document.fonts?.ready.then(schedule);
        schedule();
    });
    onBeforeUnmount(() => {
        cancelAnimationFrame(frame);
        resize?.disconnect();
        mutate?.disconnect();
    });

    return { edges, measure: schedule };
}

const sheetEl = ref<HTMLElement | null>(null);
const flagsEl = ref<HTMLElement | null>(null);
const { edges: sheetEdges, measure: measureSheet } = useScrollEdges(
    sheetEl,
    "y",
);
const { edges: flagsEdges, measure: measureFlags } = useScrollEdges(
    flagsEl,
    "x",
);

function onFlagsWheel(e: WheelEvent) {
    const el = flagsEl.value;
    if (!el || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const next = Math.min(max, Math.max(0, el.scrollLeft + delta));
    if (next === el.scrollLeft) return;
    e.preventDefault();
    el.scrollLeft = next;
}

let flagsDrag: { x: number; left: number; moved: boolean } | null = null;
function onFlagsPointerDown(e: PointerEvent) {
    if (e.pointerType !== "mouse" || e.button !== 0 || !flagsEl.value) return;
    flagsDrag = { x: e.clientX, left: flagsEl.value.scrollLeft, moved: false };
}
function onFlagsPointerMove(e: PointerEvent) {
    const el = flagsEl.value;
    if (!flagsDrag || !el) return;
    if (!(e.buttons & 1)) {
        flagsDrag = null;
        return;
    }
    const dx = e.clientX - flagsDrag.x;
    if (!flagsDrag.moved) {
        if (Math.abs(dx) < 5) return;
        try {
            el.setPointerCapture(e.pointerId);
        } catch {
            flagsDrag = null;
            return;
        }
        flagsDrag.moved = true;
    }
    el.scrollLeft = flagsDrag.left - dx;
}
function endFlagsDrag(e: PointerEvent) {
    if (flagsDrag?.moved) {
        try {
            flagsEl.value?.releasePointerCapture(e.pointerId);
        } catch {
            // already released with the pointer
        }
    }
    flagsDrag = null;
}
function scrollFlags(dir: -1 | 1) {
    const el = flagsEl.value;
    if (!el) return;
    el.scrollBy({
        left: dir * el.clientWidth * 0.7,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
}

const drag = reactive({ y: 0, active: false });
const dim = computed(() => 1 - Math.min(1, drag.y / 360));

let touch: {
    x: number;
    y: number;
    lastY: number;
    lastT: number;
    speed: number;
    fromHead: boolean;
    live: boolean;
} | null = null;

function scrolledDown(target: EventTarget | null, root: HTMLElement) {
    for (
        let n = target as HTMLElement | null;
        n && n !== root;
        n = n.parentElement
    ) {
        if (n.scrollTop > 0) return true;
    }
    return root.scrollTop > 0;
}

function onSheetTouchStart(e: TouchEvent) {
    if (!openMobileSheet.value || e.touches.length !== 1) return;
    const { clientX: x, clientY: y } = e.touches[0];
    touch = {
        x,
        y,
        lastY: y,
        lastT: e.timeStamp,
        speed: 0,
        fromHead: !!(e.target as Element).closest(".sheet-head"),
        live: false,
    };
}

function onSheetTouchMove(e: TouchEvent) {
    const root = sheetEl.value;
    if (!touch || !root || e.touches.length !== 1) return;
    const { clientX: x, clientY: y } = e.touches[0];

    if (!touch.live) {
        if ((!touch.fromHead && scrolledDown(e.target, root)) || y <= touch.y) {
            touch.x = x;
            touch.y = y;
            touch.lastY = y;
            touch.lastT = e.timeStamp;
            return;
        }
        const dy = y - touch.y;
        if (dy < 8 || Math.abs(x - touch.x) > dy) return;
        if (!e.cancelable) {
            touch = null;
            return;
        }
        touch.live = true;
        drag.active = true;
    }

    e.preventDefault();
    drag.y = Math.max(0, y - touch.y);
    const dt = e.timeStamp - touch.lastT;
    if (dt > 0) touch.speed = (y - touch.lastY) / dt;
    touch.lastY = y;
    touch.lastT = e.timeStamp;
}

function onSheetTouchEnd() {
    const t = touch;
    touch = null;
    if (!t?.live) return;
    drag.active = false;
    const height = sheetEl.value?.clientHeight ?? 0;
    if (drag.y > Math.min(140, height * 0.25) || t.speed > 0.6) {
        // slide the rest of the way out, then close
        drag.y = height;
        window.setTimeout(
            () => (openMobileSheet.value = false),
            prefersReducedMotion() ? 0 : SHEET_MS,
        );
    } else {
        drag.y = 0;
    }
}

watch(openMobileSheet, (open) => {
    if (!open) {
        drag.y = 0;
        drag.active = false;
        touch = null;
    }
    nextTick(measureSheet);
});

const activeFlagCount = computed(
    () => FLAG_BUTTONS.filter((f) => state.flags & f.bit).length,
);

const categoryActiveCount = computed(
    () =>
        [state.tag, state.mapper, state.genre, state.language].filter(
            (v) => v.length,
        ).length,
);

const sheetActiveCount = computed(
    () =>
        activeRangeCount.value +
        activeFlagCount.value +
        categoryActiveCount.value,
);

const appliedFromBar = computed(() => [
    ...TIER_BUTTONS.filter((t) => t.tier === state.tier).map((t) => ({
        label: `T${t.tier}`,
        style: t.style,
    })),
    ...MOD_BUTTONS.filter((m) => state.mod.includes(m.id)).map((m) => ({
        label: m.label,
        style: m.style,
    })),
]);

function clearSearch() {
    state.search = "";
    searchInput.value?.focus();
}

// Esc clears text in the search box
function onSearchEsc(e: KeyboardEvent) {
    if (!searchActive.value) return;
    e.preventDefault();
    clearSearch();
}

// Esc closes a content inside sheet not the sheet
function onSheetEsc(e: KeyboardEvent) {
    if (!e.defaultPrevented) openMobileSheet.value = false;
}

const doneLabel = computed(() => {
    const n = props.resultCount;
    if (n === undefined) return "Show maps";
    if (n === 0) return "No maps match";
    return `Show ${n.toLocaleString()} maps`;
});

function toggleMod(id: ModId) {
    state.mod = state.mod.includes(id)
        ? state.mod.filter((m) => m !== id)
        : [...state.mod, id];
}

function toggleFlag(bit: number) {
    state.flags ^= bit;
}

const toOptions = (record: Record<number, string>) =>
    Object.entries(record).map(([id, label]) => ({ id: Number(id), label }));

const genreOptions = toOptions(GENRES);
const languageOptions = toOptions(LANGUAGES);

const RANGE_ORDER = [
    "ar",
    "od",
    "cs",
    "sr",
    "length",
    "bpm",
    "ranked date",
    "in top 25 rate",
    "aim/speed ratio",
    "max pp",
    "pp net gain",
    "score",
];
const rangeRank = (label: string) => {
    const i = RANGE_ORDER.indexOf(
        label.trim().replace(/\s+/g, " ").toLowerCase(),
    );
    return i === -1 ? RANGE_ORDER.length : i;
};
const rangeSliders = (Object.entries(RANGES) as [RangeKey, RangeDef][])
    .map(([key, def]) => ({ key, ...def }))
    .sort((a, b) => rangeRank(a.label) - rangeRank(b.label));

const mapperLabel = (id: number) => name("mappers", id);
const tagLabel = (id: number) => name("tags", id);
</script>

<template>
    <form class="filters" @submit.prevent>
        <div class="controls">
            <!-- text: string in artist, title or diff -->
            <div class="search" :class="{ active: searchActive }">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-4-4" />
                </svg>
                <input
                    ref="searchInput"
                    v-model="state.search"
                    type="search"
                    placeholder="Search artist, title or difficulty"
                    aria-label="Search maps"
                    @keydown.esc="onSearchEsc"
                />
                <button
                    v-if="searchActive"
                    type="button"
                    class="search-clear"
                    aria-label="Clear search"
                    @click="clearSearch"
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                </button>
            </div>

            <!-- tier -->
            <div class="group tier" role="radiogroup" aria-label="Tier">
                <span class="group-label" aria-hidden="true">Tier</span>
                <div class="segment">
                    <label
                        v-for="{ tier, style } in TIER_BUTTONS"
                        :key="tier"
                        class="chip"
                        :style="style"
                    >
                        <input
                            type="radio"
                            name="tier"
                            :value="tier"
                            v-model="state.tier"
                        />
                        {{ tier }}
                    </label>
                </div>
            </div>

            <!-- mods -->
            <div class="group mods" role="group" aria-label="Mods">
                <span class="group-label" aria-hidden="true">Mods</span>
                <div class="chips">
                    <button
                        v-for="mod in MOD_BUTTONS"
                        :key="mod.id"
                        type="button"
                        class="chip"
                        :style="mod.style"
                        :aria-pressed="state.mod.includes(mod.id)"
                        @click="toggleMod(mod.id)"
                    >
                        {{ mod.label }}
                    </button>
                </div>
            </div>

            <button
                type="button"
                class="ranges-toggle sheet-open"
                aria-controls="sheet"
                :aria-expanded="openMobileSheet"
                :aria-label="
                    sheetActiveCount
                        ? `More filters, ${sheetActiveCount} active`
                        : undefined
                "
                @click="openMobileSheet = true"
            >
                More filters
                <span
                    v-if="sheetActiveCount"
                    class="ranges-badge"
                    aria-hidden="true"
                >
                    {{ sheetActiveCount }}
                </span>
            </button>

            <!-- black overlay behind sheet -->
            <div
                v-if="openMobileSheet"
                class="sheet-scrim"
                :class="{ dragging: drag.active }"
                :style="{ opacity: dim }"
                aria-hidden="true"
                @click="openMobileSheet = false"
            />

            <!-- mobile filters sheet -->
            <div
                id="sheet"
                ref="sheetEl"
                class="sheet"
                :class="{
                    open: openMobileSheet,
                    dragging: drag.active,
                    'can-up': sheetEdges.start,
                    'can-down': sheetEdges.end,
                }"
                :style="{ '--drag': drag.y + 'px' }"
                @scroll.passive="measureSheet"
                @touchstart.passive="onSheetTouchStart"
                @touchmove="onSheetTouchMove"
                @touchend="onSheetTouchEnd"
                @touchcancel="onSheetTouchEnd"
                @keydown.esc="onSheetEsc"
            >
                <div class="sheet-head">
                    <span class="sheet-grab" aria-hidden="true" />
                    <h2>
                        More filters
                        <span
                            v-if="sheetActiveCount"
                            class="ranges-badge"
                            aria-hidden="true"
                        >
                            {{ sheetActiveCount }}
                        </span>
                    </h2>
                    <button
                        type="button"
                        class="sheet-close"
                        aria-label="Close filters"
                        @click="openMobileSheet = false"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>
                <div class="sheet-applied">
                    <span class="applied-label">In effect</span>
                    <span
                        v-for="a in appliedFromBar"
                        :key="a.label"
                        class="applied-chip"
                        :style="a.style"
                        >{{ a.label }}</span
                    >
                </div>

                <!-- multiselects -->
                <section class="sheet-section">
                    <h3 class="sheet-title">
                        Categories
                        <span v-if="categoryActiveCount" class="sheet-count">
                            {{ categoryActiveCount }} active
                        </span>
                    </h3>
                    <div class="selects">
                        <MultiSelect
                            v-model="state.tag"
                            :options="options.tags.value"
                            :resolve-label="tagLabel"
                            label="Tags"
                            @open="prefetch('tags')"
                            @clear="state.tagDepth = 3"
                        >
                            <template #footer>
                                <StepSlider
                                    v-model="state.tagDepth"
                                    label="Depth"
                                    :min="1"
                                    :max="5"
                                    title="How many top tags to match"
                                    @commit="flushSliders"
                                />
                            </template>
                        </MultiSelect>
                        <MultiSelect
                            v-model="state.mapper"
                            :options="options.mappers.value"
                            :resolve-label="mapperLabel"
                            label="Mapper"
                            @open="prefetch('mappers')"
                        />
                        <MultiSelect
                            v-model="state.genre"
                            :options="genreOptions"
                            label="Genre"
                        />
                        <MultiSelect
                            v-model="state.language"
                            :options="languageOptions"
                            label="Language"
                        />

                        <!-- toggle ranges / reset -->
                        <div class="actions">
                            <button
                                type="button"
                                class="ranges-toggle"
                                aria-controls="ranges"
                                :aria-expanded="openRanges"
                                :aria-label="
                                    activeRangeCount
                                        ? `More filters, ${activeRangeCount} active`
                                        : undefined
                                "
                                @click="openRanges = !openRanges"
                            >
                                More filters
                                <span
                                    v-if="activeRangeCount"
                                    class="ranges-badge"
                                    aria-hidden="true"
                                >
                                    {{ activeRangeCount }}
                                </span>
                            </button>
                            <button type="button" class="reset" @click="reset">
                                Reset
                            </button>
                        </div>
                    </div>
                </section>

                <!-- flags -->
                <section class="sheet-section">
                    <h3 class="sheet-title">
                        Badges
                        <span v-if="activeFlagCount" class="sheet-count">
                            {{ activeFlagCount }} active
                        </span>
                    </h3>
                    <div
                        class="flags-wrap"
                        :class="{
                            'can-left': flagsEdges.start,
                            'can-right': flagsEdges.end,
                        }"
                    >
                        <div
                            ref="flagsEl"
                            class="group flags sheet-flags"
                            role="group"
                            aria-label="Badges"
                            @scroll.passive="measureFlags"
                            @wheel="onFlagsWheel"
                            @pointerdown="onFlagsPointerDown"
                            @pointermove="onFlagsPointerMove"
                            @pointerup="endFlagsDrag"
                            @pointercancel="endFlagsDrag"
                        >
                            <button
                                v-for="flag in FLAG_BUTTONS"
                                :key="flag.bit"
                                type="button"
                                class="chip chip-sm"
                                :style="flag.style"
                                :aria-pressed="(state.flags & flag.bit) !== 0"
                                @click="toggleFlag(flag.bit)"
                            >
                                {{ flag.label }}
                            </button>
                        </div>

                        <button
                            type="button"
                            class="flags-edge start"
                            tabindex="-1"
                            aria-hidden="true"
                            @click="scrollFlags(-1)"
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M15 6l-6 6 6 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            class="flags-edge end"
                            tabindex="-1"
                            aria-hidden="true"
                            @click="scrollFlags(1)"
                        >
                            <svg viewBox="0 0 24 24">
                                <path d="M9 6l6 6-6 6" />
                            </svg>
                        </button>
                    </div>
                </section>

                <!-- ranges -->
                <section class="sheet-section">
                    <h3 class="sheet-title">
                        Ranges
                        <span v-if="activeRangeCount" class="sheet-count">
                            {{ activeRangeCount }} active
                        </span>
                    </h3>
                    <div
                        id="ranges"
                        class="ranges"
                        :class="{ collapsed: !openRanges }"
                        role="group"
                        aria-label="More filters"
                    >
                        <RangeSlider
                            v-for="range in rangeSliders"
                            :key="range.key"
                            v-model="state.range[range.key]"
                            :label="range.label"
                            :min="range.min"
                            :max="range.max"
                            :step="range.step"
                            :format="range.format"
                            @commit="flushSliders"
                        />
                    </div>
                </section>

                <div class="sheet-foot">
                    <button type="button" class="reset" @click="reset">
                        Reset
                    </button>
                    <button
                        type="button"
                        class="sheet-done"
                        :class="{ empty: resultCount === 0 }"
                        @click="openMobileSheet = false"
                    >
                        {{ doneLabel }}
                    </button>
                </div>
            </div>
        </div>

        <!-- footer -->
        <div class="footer">
            <!-- flags -->
            <div class="group flags" role="group" aria-label="Badges">
                <span class="group-label" aria-hidden="true">Badges</span>
                <button
                    v-for="flag in FLAG_BUTTONS"
                    :key="flag.bit"
                    type="button"
                    class="chip chip-sm"
                    :style="flag.style"
                    :aria-pressed="(state.flags & flag.bit) !== 0"
                    @click="toggleFlag(flag.bit)"
                >
                    {{ flag.label }}
                </button>
            </div>

            <!-- results count -->
            <p class="result-count" aria-live="polite">
                <template v-if="resultCount !== undefined">
                    <b>{{ resultCount.toLocaleString() }}</b> maps
                </template>
            </p>
            <button type="button" class="reset reset-bar" @click="reset">
                Reset
            </button>
        </div>
    </form>
</template>

<style scoped>
.filters {
    --line: var(--color-border);
    --field: color-mix(in srgb, var(--color-surface), var(--color-bg));
    --footer-bg: var(--field);
    --control-h: 2.25rem;
    --segment-pad: 3px;
    --segment-border: 1px;

    --chip-h: calc(
        var(--control-h) - 2 * (var(--segment-pad) + var(--segment-border))
    );
    --chip-sm-h: 1.5rem;

    --chip-w: calc(var(--chip-h) * 1.4);
    --chip-gap: 0.375rem;
    --track-inset: calc(var(--segment-pad) + var(--segment-border));
    --track-min: calc(
        4 * var(--chip-w) + 3 * var(--chip-gap) + 2 * var(--track-inset)
    );
    --label-w: 2.75rem;
    --group-gap: 0.75rem;

    display: flex;
    flex-direction: column;
    background: var(--color-surface);
    border: 1px solid var(--line);
    border-radius: 1rem;
    color: var(--color-text);
}

/* controls: search, tier, mods, selects, ranges */
.controls {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) auto auto;
    grid-template-areas:
        "search  tier    mods"
        "selects selects selects";
    align-items: center;
    gap: 0.75rem 1.5rem;
    padding: 0.75rem 0.75rem 0.7rem;
}

.selects {
    grid-area: selects;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
    gap: var(--space-sm) var(--space-md);
}
.ranges {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(var(--range-cols, 4), minmax(0, 1fr));
    grid-template-rows: repeat(var(--range-rows, 3), auto);
    grid-auto-flow: column;
    gap: 1.125rem 1.75rem;
    padding: 0.7rem 0.25rem 0;
    border-top: 1px solid var(--line);
}
.ranges.collapsed {
    display: none;
}
.tier {
    grid-area: tier;
}
.mods {
    grid-area: mods;
}
.flags {
    flex-wrap: wrap;
}
.flags .group-label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    padding-right: 0.5rem;
}

.search {
    grid-area: search;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    height: var(--control-h);
    padding: 0 0.75rem;
    color: var(--gray);
    background: var(--field);
    border: 1px solid var(--line);
    border-radius: 0.625rem;
}

.search svg,
.sheet-close svg,
.flags-edge svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.search svg {
    flex: none;
}
.search input {
    flex: 1;
    min-width: 0;
    font: inherit;
    color: var(--color-text);
    background: none;
    border: 0;
    outline: 0;
}
.search input::placeholder {
    color: var(--gray);
}

.search input::-webkit-search-cancel-button,
.search input::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
}

.search:focus-within,
.search.active {
    border-color: var(--color-accent);
}

.search-clear {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0;
    color: var(--gray);
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
}
.search-clear::before {
    content: "";
    position: absolute;
    inset: -0.375rem;
}
.search-clear svg {
    width: 0.75rem;
    height: 0.75rem;
}
.search-clear:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
}

.group {
    display: flex;
    align-items: center;
    gap: 5px;
}
.group-label {
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    color: var(--gray);
}

.segment,
.chips {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(var(--chip-w), var(--chip-col, auto));
    align-items: center;
    gap: var(--chip-gap);
}

.segment {
    padding: var(--segment-pad);
    background: var(--field);
    border: var(--segment-border) solid var(--line);
    border-radius: 999px;
}

.chips {
    padding-inline: var(--track-inset);
}
.segment .chip,
.chips .chip {
    min-width: 0;
}

.chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--chip-h);
    padding: 0 1rem;
    font: inherit;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1;
    color: var(--color-text);
    background: var(--field);
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
    transition:
        color var(--duration) ease,
        border-color var(--duration) ease,
        background-color var(--duration) ease,
        box-shadow var(--duration) ease,
        filter var(--duration) ease;
}

.segment .chip {
    padding: 0 0.75rem;
    border-color: transparent;
}
.chip input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: pointer;
}
.chip:hover {
    filter: brightness(1.1);
}

.chip:has(input:focus-visible),
.ranges-toggle:focus-visible,
.sheet-close:focus-visible,
.sheet-done:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}
.chip[aria-pressed="true"],
.chip:has(input:checked) {
    color: var(--pill-fg);
    background: var(--pill-bg);
    border-color: transparent;
    box-shadow: 0 0 0 2px var(--pill-fg);
    background-origin: border-box;
}

/* flags */
.chip-sm {
    height: var(--chip-sm-h);
    padding: 0 0.625rem;
    font-size: 0.75rem;
}

/* footer: flags, results count */
.footer {
    --field: color-mix(in srgb, var(--color-surface) 30%, var(--color-bg));

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-sm);
    padding: 0.625rem var(--space-md);
    background: var(--footer-bg);
    border-top: 1px solid var(--line);
    border-radius: 0 0 calc(1rem - 1px) calc(1rem - 1px);
}

.result-count {
    margin: 0 0 0 auto;
    color: var(--gray);
}
.result-count b {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}
.actions {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 0.5rem;
}
.ranges-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: var(--control-h);
    padding: 0 0.875rem;
    font: inherit;
    font-weight: 600;
    white-space: nowrap;
    color: var(--color-text);
    background: var(--field);
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
}
.ranges-toggle[aria-expanded="true"] {
    border-color: var(--color-accent);
}

.ranges-badge,
.sheet-count,
.applied-chip {
    padding: 0 0.5rem;
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.25rem;
    color: var(--color-bg);
    background: var(--color-accent);
    border-radius: 999px;
}
.ranges-badge {
    flex: none;
}

.reset {
    padding: 0.25rem 0;
    font: inherit;
    color: var(--gray);
    background: none;
    border: 0;
    cursor: pointer;
}
.reset:hover {
    color: var(--color-text);
}

/* mobile components */
.sheet,
.sheet-section {
    display: contents;
}
.sheet-open,
.sheet-scrim,
.sheet-head,
.sheet-title,
.sheet-applied,
.flags-wrap,
.sheet-foot,
.reset-bar {
    display: none;
}

@media (pointer: coarse) {
    .filters {
        --control-h: 2.75rem;
        --chip-sm-h: 2rem;
    }
    .reset {
        min-height: var(--control-h);
        padding-inline: 0.75rem;
        margin-right: -0.75rem;
    }
}

@container mapcontainer (max-width: 1100px) {
    .tier,
    .mods {
        flex-wrap: wrap;
        gap: 0.375rem var(--group-gap);
        min-width: 0;
    }
    .tier .group-label,
    .mods .group-label {
        flex: 0 0 var(--label-w);
    }
    .tier .segment,
    .mods .chips {
        --chip-col: 1fr;
        flex: 1 1 var(--track-min);
        min-width: 0;
    }
    .tier .chip,
    .mods .chip {
        padding-inline: 0.25rem;
        font-size: 0.875rem;
    }
}

@container mapcontainer (620px < width <= 1100px) {
    .filters {
        --col-gap: 0.75rem;
        --inset: calc(0.75rem + 1px);
        --group-min: calc(
            var(--label-w) + var(--group-gap) + var(--track-min) + var(--inset)
        );
    }

    .controls {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0 var(--col-gap);
        padding: 0.375rem 0.75rem 0.325rem;
    }

    .controls > :not(.sheet),
    .ranges,
    .selects > * {
        margin-block: 0.375rem;
    }

    .controls::before,
    .controls::after {
        content: "";
        flex: 0 0 100%;
        height: 0;
    }
    .controls::before {
        order: 3;
    }
    .controls::after {
        order: 6;
    }

    .selects {
        display: contents;
    }

    .search {
        order: 1;
        flex: 1 1 0;
        min-width: 0;
    }
    .actions {
        order: 2;
        flex: none;
    }

    .tier,
    .mods {
        flex: 1 1 var(--group-min);
        padding-left: var(--inset);
    }
    .tier {
        order: 4;
    }
    .mods {
        order: 5;
    }

    .selects > :not(.actions) {
        order: 7;
        flex: 1 1 0;
        min-width: 0;
    }

    .selects > :nth-last-child(2) :deep(.panel) {
        left: auto;
        right: 0;
    }

    .ranges {
        order: 8;
        flex: 1 1 100%;
        gap: 1rem 1.5rem;
        padding-inline: 0;
    }
}
/* narrow tablet ranges 2 columns instead of 4 */
@container mapcontainer (620px < width <= 960px) {
    .ranges {
        --range-cols: 2;
        --range-rows: 6;
    }
}

/* mobile view */
@container mapcontainer (max-width: 620px) {
    .controls {
        grid-template-columns: minmax(0, 1fr) auto;
        grid-template-areas:
            "search more"
            "tier   tier"
            "mods   mods";
        gap: 0.625rem 0.5rem;
    }

    .sheet-open {
        grid-area: more;
        display: inline-flex;
    }
    .actions,
    .footer .flags {
        display: none;
    }

    .footer {
        flex-wrap: nowrap;
    }
    .reset-bar {
        display: block;
        order: -1;
    }
    @media (pointer: coarse) {
        .reset-bar {
            margin-right: 0;
            margin-left: -0.75rem;
        }
    }

    .sheet-scrim {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 99;
        background: rgb(0 0 0 / 0.6);
        transition: opacity v-bind(SHEET_DURATION) ease;
    }
    .sheet {
        display: none;
    }
    .sheet.open {
        --pad: 1rem;
        --reveal-top: 5rem;
        --reveal-bottom: 6.5rem;
        position: fixed;
        inset: max(2.5rem, env(safe-area-inset-top)) 0 0;
        z-index: 100;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        overscroll-behavior: contain;
        scroll-padding-block: var(--reveal-top) var(--reveal-bottom);
        color: var(--color-text);
        background: var(--color-surface);
        border: 1px solid var(--line);
        border-bottom: 0;
        border-radius: 1.25rem 1.25rem 0 0;
        box-shadow: 0 -0.75rem 2.5rem rgb(0 0 0 / 0.45);
        transform: translateY(var(--drag, 0px));
        transition: transform v-bind(SHEET_DURATION) ease;
    }

    .sheet.dragging,
    .sheet-scrim.dragging {
        transition: none;
    }
    .sheet.dragging {
        will-change: transform;
    }
    .sheet > * {
        padding-inline: var(--pad);
    }

    .sheet-head {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 1.25rem;
        padding-bottom: 0.75rem;
        background: var(--color-surface);
        border-bottom: 1px solid var(--line);
        touch-action: none;
    }
    .sheet-grab {
        position: absolute;
        top: 0.5rem;
        left: 50%;
        width: 2.25rem;
        height: 4px;
        background: color-mix(in srgb, var(--color-text) 25%, var(--line));
        border-radius: 2px;
        transform: translateX(-50%);
    }
    .sheet-close {
        display: grid;
        place-items: center;
        flex: none;
        width: 2rem;
        height: 2rem;
        padding: 0;
        color: var(--gray);
        background: var(--field);
        border: 1px solid var(--line);
        border-radius: 50%;
        cursor: pointer;
    }
    .sheet-close:hover {
        color: var(--color-text);
    }
    .sheet-head h2 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
        font-size: 1.0625rem;
        font-weight: 600;
    }
    .sheet-applied {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.375rem;
        padding-block: 0.75rem;
        font-size: 0.8125rem;
        color: var(--gray);
    }
    .applied-label {
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--gray);
        margin-left: 0.25rem;
    }

    .applied-chip {
        color: var(--pill-fg);
        background: var(--pill-bg);
    }

    .sheet-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem var(--pad);
        border-top: 1px solid var(--line);
    }

    .sheet-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin: 0 0.25rem;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--gray);
    }

    .sheet-count {
        letter-spacing: 0;
        text-transform: none;
    }

    .selects {
        grid-template-columns: minmax(0, 1fr);
    }

    .selects :deep(.panel) {
        position: static;
        width: 100%;
        max-width: none;
        margin-top: 0.375rem;
        box-shadow: none;
    }

    .selects :deep(.list) {
        max-height: min(13rem, 38dvh);
        overscroll-behavior: auto;
    }

    .ranges,
    .ranges.collapsed {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: none;
        grid-auto-flow: row;
        gap: 1.25rem;
        padding: 0.25rem 0.25rem 0;
        border-top: 0;
    }

    .flags-wrap {
        display: block;
        position: relative;
        margin: -3px calc(var(--pad) * -1);
    }
    .sheet-flags {
        flex-wrap: nowrap;
        gap: 0.5rem;
        padding: 3px var(--pad);
        overflow-x: auto;
        overscroll-behavior-x: contain;
        scrollbar-width: none;
    }
    .sheet-flags::-webkit-scrollbar {
        display: none;
    }

    .flags-edge {
        position: absolute;
        top: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        width: 3rem;
        margin: 0;
        color: var(--gray);
        border: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .flags-edge.start {
        left: 0;
        justify-content: flex-start;
        padding-left: 0.375rem;
        background: linear-gradient(
            to right,
            var(--color-surface) 40%,
            transparent
        );
    }
    .flags-edge.end {
        right: 0;
        justify-content: flex-end;
        padding-right: 0.375rem;
        background: linear-gradient(
            to left,
            var(--color-surface) 40%,
            transparent
        );
    }
    .flags-wrap.can-left .flags-edge.start,
    .flags-wrap.can-right .flags-edge.end {
        opacity: 1;
        pointer-events: auto;
        cursor: pointer;
    }
    .flags-edge:hover {
        color: var(--color-text);
    }
    /* mouse: the row can be dragged */
    @media (hover: hover) and (pointer: fine) {
        .sheet-flags {
            cursor: grab;
            user-select: none;
        }
        .sheet-flags:active {
            cursor: grabbing;
        }
    }
    .sheet-flags .chip-sm {
        flex: none;
        height: 2rem;
        padding: 0 0.75rem;
        font-size: 0.8125rem;
    }

    .sheet-foot {
        position: sticky;
        bottom: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: auto;
        padding-top: 0.75rem;
        padding-bottom: max(1rem, env(safe-area-inset-bottom));
        background: color-mix(in srgb, var(--footer-bg) 94%, transparent);
        -webkit-backdrop-filter: blur(0.75rem);
        backdrop-filter: blur(0.75rem);
        border-top: 1px solid var(--line);
    }
    .sheet-foot .reset {
        flex: none;
        margin-right: 0;
    }
    .sheet-done {
        flex: 1;
        height: 3rem;
        font: inherit;
        font-size: 0.9375rem;
        font-weight: 700;
        color: var(--color-bg);
        background: var(--color-accent);
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        transition: transform 0.1s ease;
    }
    .sheet-done:active {
        transform: scale(0.98);
    }

    .sheet-done.empty {
        font-weight: 600;
        color: var(--gray);
        background: var(--color-surface);
        box-shadow: inset 0 0 0 1px var(--line);
    }

    .sheet-head::after,
    .sheet-foot::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    .sheet-head::after {
        top: calc(100% + 1px);
        height: 1.75rem;
        background: linear-gradient(
            to bottom,
            rgb(0 0 0 / 0.32),
            rgb(0 0 0 / 0.12) 45%,
            rgb(0 0 0 / 0.03) 80%,
            transparent
        );
    }
    .sheet-foot::before {
        bottom: calc(100% + 1px);
        height: 2rem;
        background: linear-gradient(
            to top,
            rgb(0 0 0 / 0.46),
            rgb(0 0 0 / 0.2) 45%,
            rgb(0 0 0 / 0.06) 80%,
            transparent
        );
    }
    .sheet.can-up .sheet-head::after,
    .sheet.can-down .sheet-foot::before {
        opacity: 1;
    }
}

@media (prefers-reduced-motion: reduce) {
    .chip,
    .sheet.open,
    .sheet-scrim,
    .sheet-head::after,
    .sheet-foot::before,
    .sheet-done,
    .flags-edge {
        transition: none;
    }
}
</style>
