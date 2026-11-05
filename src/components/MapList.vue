<script setup lang="ts">
import { computed, provide, ref } from "vue";
import MapRow from "./MapRow.vue";
import type { BeatmapParsed } from "../composables/beatmap";


const props = defineProps<{
    rows: readonly BeatmapParsed[];
}>();

</script>

<template>
    <div class="map-list-wrap">
        <ol class="map-list">
            <MapRow
                v-for="(r, i) in rows"
                class="map-row"
                :key="r.key"
                :row="r"
                :eager="i < 6"
                @preview="onPreview"
            />

            <!-- info rows at bottom -->
            <li ref="end" class="map-list-end">
                <!-- loading -->

                <!-- failed results -->

                <!-- empty results -->

                <!-- login before results -->

                <!-- no more results -->
            </li>
        </ol>

    </div>
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
</style>
