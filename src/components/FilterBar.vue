<script setup lang="ts">
import { useFilter } from "../composables/useFilter";
import { MODS, TIERS } from "../domain/beatmap";
import type { ModId } from "../domain/beatmap";

defineProps<{ count?: number }>();

const { state, reset } = useFilter();

const MOD_BUTTONS = Object.entries(MODS).map(([id, label]) => ({
    id: Number(id) as ModId,
    label,
}));

function toggleMod(id: ModId) {
    state.mod = state.mod.includes(id)
        ? state.mod.filter((m) => m !== id)
        : [...state.mod, id];
}
</script>

<template>
    <form class="filters" @submit.prevent>
        <!-- text: string in artist, title or diff -->
        <input
            v-model="state.search"
            class="search"
            type="search"
            placeholder="Search artist, title or difficulty"
            aria-label="Search maps"
        />

        <!-- tier 1–4 -->
        <fieldset>
            <legend>Tier</legend>
            <label v-for="t in TIERS" :key="t" class="chip">
                <input
                    type="radio"
                    name="tier"
                    :value="t"
                    v-model="state.tier"
                />
                {{ t }}
            </label>
        </fieldset>

        <!-- mods: NM / HR / DT / DTHR -->
        <fieldset>
            <legend>Mods</legend>
            <button
                v-for="m in MOD_BUTTONS"
                :key="m.id"
                type="button"
                class="chip"
                :aria-pressed="state.mod.includes(m.id)"
                @click="toggleMod(m.id)"
            >
                {{ m.label }}
            </button>
        </fieldset>

        <div class="actions">
            <p class="count" aria-live="polite">
                <template v-if="count !== undefined">
                    {{ count.toLocaleString() }} maps.
                </template>
            </p>
            <button type="button" @click="reset">Reset</button>
            <!-- filters apply live (search is debounced 150ms); kept as a no-op for layout -->
            <button type="button">Apply</button>
        </div>
    </form>
</template>

<style scoped>
.filters {
    display: grid;
    gap: 0.8em;
    margin: 0 1.5em 1em;
    padding: 1em;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 1em;
    color: var(--text);
}
fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4em;
    margin: 0;
    padding: 0;
    border: 0;
}
legend {
    float: left;
    min-width: 5em;
    padding: 0.3em 0;
    color: var(--muted);
}
.actions {
    display: flex;
    align-items: center;
    gap: 0.4em;
}
.count {
    margin: 0 auto 0 0;
    color: var(--muted);
}
.search {
    width: 100%;
    padding: 0.5em 0.8em;
    font: inherit;
    color: var(--text);
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 0.6em;
}

.chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25em 0.8em;
    font: inherit;
    line-height: 1.5;
    color: var(--text);
    text-align: center;
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 999px;
    cursor: pointer;
    transition:
        background-color 120ms ease,
        border-color 120ms ease,
        color 120ms ease,
        filter 120ms ease;
}
.chip input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
}
.chip:hover {
    filter: brightness(1.1);
}
.chip:focus-visible,
.chip:has(input:focus-visible) {
    outline: 2px solid var(--text);
    outline-offset: 2px;
}

.chip[aria-pressed="true"],
.chip:has(input:checked) {
    color: var(--bg);
    background: var(--text);
    border-color: var(--text);
}
</style>
