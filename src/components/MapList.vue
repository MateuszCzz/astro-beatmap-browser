<script setup lang="ts">
import { computed } from "vue";
import MapRow from "./MapRow.vue";
import type { BeatmapParsed } from "../composables/beatmap";
import { useDynamicList } from "../composables/useDynamicList.ts";

const props = defineProps<{
    // all rows pass; list decides how many to render
    rows: readonly BeatmapParsed[];
    resetKey: unknown;
    // core in, rest loading
    loadingMore?: boolean;
    // nothing loaded
    failed?: boolean;
}>();

const emit = defineEmits<{
    retry: [];
}>();

// do not remove sentinel; false positive from editors
const { visible, hasMore, sentinel } = useDynamicList(
    computed(() => props.rows),
    { resetOn: [() => props.resetKey] },
);
</script>

<template>
    <ol class="map-list">
        <MapRow
            v-for="(r, i) in visible"
            class="map-row"
            :key="r.key"
            :row="r"
            :eager="i < 6"
        />

        <!-- info rows at bottom -->
        <li class="map-list-end" aria-live="polite">
            <!-- sentinel to signal more loading -->
            <div v-if="hasMore" ref="sentinel" aria-hidden="true" />

            <!-- failed results -->
            <template v-else-if="failed">
                <span role="alert">
                    {{
                        rows.length
                            ? "Couldn't load all of them."
                            : "Couldn't load the maps for this tier."
                    }}
                </span>
                <button type="button" @click="emit('retry')">Retry</button>
            </template>

            <!-- loading -->
            <template v-else-if="loadingMore">Loading more…</template>

            <!-- empty results -->
            <template v-else-if="!rows.length">
                No maps match these filters.
            </template>

            <!-- login before results -->

            <!-- no more results -->
        </li>
    </ol>
</template>
<style scoped>
.map-list {
    list-style: none;
    margin: 0 auto;
    padding: 1.5em;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1em;
}
.map-row {
    content-visibility: auto;
    contain-intrinsic-size: auto 140px;
}

.map-list-end {
    margin: 0 0 1em;
    color: var(--muted);
}
.map-list-end:empty {
    display: none;
}
.map-list-end button {
    margin-left: 0.6em;
    padding: 0.2em 0.8em;
    font: inherit;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 0.6em;
    cursor: pointer;
}
</style>
