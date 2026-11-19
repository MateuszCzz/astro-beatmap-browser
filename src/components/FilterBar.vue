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

defineProps<{ count?: number }>();

const { state, reset, flushSliders } = useFilter();
const { options, prefetch, name } = useLookup();

const searchInput = ref<HTMLInputElement | null>(null);
const searchActive = computed(() => !!state.search);

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

const genreOptions = Object.entries(GENRES).map(([id, label]) => ({
    id: Number(id),
    label,
}));
const languageOptions = Object.entries(LANGUAGES).map(([id, label]) => ({
    id: Number(id),
    label,
}));

const rangeSliders = (Object.entries(RANGES) as [RangeKey, RangeDef][]).map(
    ([key, { label, min, max, step, format }]) => ({
        key,
        label,
        min,
        max,
        step,
        format,
    }),
);

const mapperLabel = (id: number) => name("mappers", id);
const tagLabel = (id: number) => name("tags", id);
</script>

<template>
    <form class="filters" @submit.prevent>
        <!-- text: string in artist, title or diff -->
        <label class="search" :class="{ active: searchActive }">
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
                class="clear"
                aria-label="Clear search"
                @click="clearSearch"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
        </label>

        <!-- tier 1–4 -->
        <div class="group tier" role="radiogroup" aria-label="Tier">
            <span class="label" aria-hidden="true">Tier</span>
            <div class="segment">
                <label
                    v-for="t in TIER_BUTTONS"
                    :key="t.tier"
                    class="chip"
                    :style="t.style"
                >
                    <input
                        type="radio"
                        name="tier"
                        :value="t.tier"
                        v-model="state.tier"
                    />
                    {{ t.tier }}
                </label>
            </div>
        </div>

        <!-- mods -->
        <div class="group mods" role="group" aria-label="Mods">
            <span class="label" aria-hidden="true">Mods</span>
            <button
                v-for="m in MOD_BUTTONS"
                :key="m.id"
                type="button"
                class="chip"
                :style="m.style"
                :aria-pressed="state.mod.includes(m.id)"
                @click="toggleMod(m.id)"
            >
                {{ m.label }}
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
        </div>
        <!-- ranges -->
        <div
            class="ranges"
            role="group"
            aria-label="Ranges"
            @change="flushSliders"
        >
            <SliderSelect
                v-for="r in rangeSliders"
                :key="r.key"
                v-model="state.range[r.key]"
                class="range"
                :data-range="r.key"
                :label="r.label"
                :min="r.min"
                :max="r.max"
                :step="r.step"
                :format="r.format"
            />
        </div>

        <!-- flags -->
        <div class="group flags" role="group" aria-label="Flags">
            <span class="label" aria-hidden="true">Flags</span>
            <button
                v-for="f in FLAG_BUTTONS"
                :key="f.bit"
                type="button"
                class="chip"
                :style="f.style"
                :aria-pressed="(state.flags & f.bit) !== 0"
                @click="toggleFlag(f.bit)"
            >
                {{ f.label }}
            </button>
        </div>

        <!-- results count -->
        <p class="count" aria-live="polite">
            <template v-if="count !== undefined">
                {{ count.toLocaleString() }} maps.
            </template>
        </p>

        <!-- reset button -->
        <button type="button" class="reset" @click="reset">Reset</button>
    </form>
</template>

<style scoped>
.filters {
    --line: var(--color-border);
    --field: color-mix(in srgb, var(--color-surface), var(--color-bg));
    --control-h: 2.25rem;
    --segment-pad: 3px;
    --segment-border: 1px;

    --chip-h: calc(
        var(--control-h) - 2 * (var(--segment-pad) + var(--segment-border))
    );

    display: grid;
    grid-template-columns: minmax(10rem, 1fr) auto auto;
    grid-template-areas:
        "search  tier    mods"
        "selects selects selects"
        "ranges  ranges  ranges"
        "flags   flags   flags"
        "count   count   reset";
    align-items: center;
    gap: var(--space-sm) var(--space-lg);
    margin: 0 var(--space-lg) var(--space-md);
    padding: var(--space-md);
    background: var(--color-surface);
    border: 1px solid var(--line);
    border-radius: 1rem;
    color: var(--color-text);
}

.selects {
    grid-area: selects;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm) var(--space-md);
}
.ranges {
    grid-area: ranges;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--space-sm) var(--space-lg);
}
.tier {
    grid-area: tier;
}
.mods {
    grid-area: mods;
}
.flags {
    grid-area: flags;
    flex-wrap: wrap;
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

.clear {
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
.clear svg {
    width: 0.75rem;
    height: 0.75rem;
}
.clear:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
}

.group {
    display: flex;
    align-items: center;
    gap: 5px;
}
.label {
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

.count {
    grid-area: count;
    margin: 0;
    color: var(--gray);
}
.reset {
    grid-area: reset;
    justify-self: end;
    padding: 0.25rem 0.5rem;
    font: inherit;
    color: var(--gray);
    background: none;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
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
</style>
