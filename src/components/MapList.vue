<script setup lang="ts">
import MapRow from "./MapRow.vue";
import type { BeatmapParsed } from "../composables/beatmap";

const props = defineProps<{
    rows: readonly BeatmapParsed[];
}>();
</script>

<template>
    <ol class="map-list">
        <MapRow v-for="r in rows" :key="r.key" :row="r" />

        <!-- info rows at bottom -->
        <li ref="end" class="map-list-end">
            <!-- loading -->

            <!-- failed results -->

            <!-- empty results -->

            <!-- login before results -->

            <!-- no more results -->

        </li>
    </ol>
</template>