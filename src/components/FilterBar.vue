<script setup lang="ts">
import { useFilter } from "../composables/useFilter";
import { MODS, TIERS } from "../domain/beatmap";
import type { ModId } from "../domain/beatmap";
import { pillFor } from "../domain/pill";

// get chips bg fg
const TIER_BUTTONS = TIERS.map((t) => ({
    tier: t,
    style: pillFor(`T${t}`).style,
}));

const MOD_BUTTONS = Object.entries(MODS).map(([id, key]) => {
    const pill = pillFor(key);
    return { id: Number(id) as ModId, label: pill.label, style: pill.style };
});

defineProps<{ count?: number }>();

const { state, reset } = useFilter();

function toggleMod(id: ModId) {
    state.mod = state.mod.includes(id)
        ? state.mod.filter((m) => m !== id)
        : [...state.mod, id];
}
</script>

<template>
    <form class="filters" @submit.prevent>
        <!-- text: string in artist, title or diff -->
        <label class="search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
            </svg>
            <input
                v-model="state.search"
                type="search"
                placeholder="Search artist, title or difficulty"
                aria-label="Search maps"
            />
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
        "search tier  mods"
        "count  count reset";
    align-items: center;
    gap: var(--space-sm) var(--space-lg);
    margin: 0 var(--space-lg) var(--space-md);
    padding: var(--space-md);
    background: var(--color-surface);
    border: 1px solid var(--line);
    border-radius: 1rem;
    color: var(--color-text);
}

.tier {
    grid-area: tier;
}
.mods {
    grid-area: mods;
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
.search:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
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
