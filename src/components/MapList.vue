<script setup lang="ts">
import { ref } from "vue";
import MapRow from "./MapRow.vue";
import type { BeatmapParsed } from "../composables/beatmap";
import AudioPlayer from "./AudioPlayer.vue";

const props = defineProps<{
    rows: readonly BeatmapParsed[];
}>();

const player = ref<InstanceType<typeof AudioPlayer> | null>(null);
</script>

<template>
    <div class="map-list-wrap">
        <ol class="map-list">
            <MapRow
                v-for="r in rows"
                :key="r.key"
                :row="r"
                :playing="
                    !!player?.isPlaying && player.playingId === r.mapset_id
                "
                @preview="(id) => player?.toggle(id)"
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
    </div>
</template>
