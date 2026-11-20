<script setup lang="ts">
import { computed, ref } from "vue";
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
import SliderSelect from "./SliderSelect.vue";

defineProps<{ resultCount?: number }>();

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

function clearSearch() {
    state.search = "";
    searchInput.value?.focus();
}

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

const rangeSliders = (Object.entries(RANGES) as [RangeKey, RangeDef][]).map(
    ([key, def]) => ({ key, ...def }),
);

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
                    @keydown.esc="
                        searchActive && ($event.preventDefault(), clearSearch())
                    "
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

            <!-- multiselects -->
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
                        <SliderSelect
                            v-model="state.tagDepth"
                            :min="1"
                            :max="5"
                            :neutral="null"
                            label="Depth"
                            ticks
                            inline
                            :show-value="false"
                            hint="How many top tags to match"
                            @change="flushSliders"
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

            <!-- ranges -->
            <div
                v-if="openRanges"
                id="ranges"
                class="ranges"
                role="group"
                aria-label="More filters"
                @change="flushSliders"
            >
                <SliderSelect
                    v-for="range in rangeSliders"
                    :key="range.key"
                    v-model="state.range[range.key]"
                    :label="range.label"
                    :min="range.min"
                    :max="range.max"
                    :step="range.step"
                    :format="range.format"
                />
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
        "selects selects selects"
        "ranges  ranges  ranges";
    align-items: center;
    gap: 0.75rem 1.5rem;
    padding: 0.75rem 0.75rem 0.7rem;
}

.controls:not(:has(.ranges)) {
    grid-template-areas:
        "search  tier    mods"
        "selects selects selects";
}

.selects {
    grid-area: selects;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
    gap: var(--space-sm) var(--space-md);
}
.ranges {
    grid-area: ranges;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.125rem 1.75rem;
    padding: 0.7rem 0.25rem 0;
    border-top: 1px solid var(--line);
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
.search svg {
    flex: none;
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
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

.segment {
    display: flex;
    gap: 2px;
    padding: var(--segment-pad);
    background: var(--field);
    border: var(--segment-border) solid var(--line);
    border-radius: 999px;
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
    min-width: 2.25rem;
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
.chip:has(input:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}
.chip[aria-pressed="true"],
.chip:has(input:checked) {
    color: var(--pill-fg);
    background: var(--pill-bg);
    border-color: transparent;
    box-shadow: 0 0 0 2px var(--pill-fg);
}

/* flags */
.chip-sm {
    height: 1.5rem;
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
.ranges-toggle:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}

.ranges-badge {
    flex: none;
    padding: 0 0.4rem;
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.25rem;
    color: var(--color-bg);
    background: var(--color-accent);
    border-radius: 999px;
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

@media (prefers-reduced-motion: reduce) {
    .chip {
        transition: none;
    }
}
/* tablet view */
@container mapcontainer (560px < width <= 1100px) {
}
/* mobile view */
@container mapcontainer (max-width: 560px) {
}
</style>
