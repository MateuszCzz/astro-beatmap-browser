<script setup lang="ts">
import { computed, provide, ref } from "vue";
import MapRow from "./MapRow.vue";
import type { BeatmapParsed } from "../composables/beatmap";
import AudioPlayer from "./AudioPlayer.vue";
import TooltipBox from "./TooltipBox.vue";

const props = defineProps<{
    rows: readonly BeatmapParsed[];
}>();

const player = ref<InstanceType<typeof AudioPlayer> | null>(null);
const playingId = computed(() =>
    player.value?.isPlaying ? player.value.playingId : null,
);
provide("playingId", playingId);

function onPreview(id: number) {
    player.value?.toggle(id);
}
</script>

<template>
    <div class="map-list-wrap">
        <ol class="map-list">
            <MapRow
                v-for="(r, i) in rows"
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

        <AudioPlayer ref="player" />
        <TooltipBox />
    </div>
</template>
