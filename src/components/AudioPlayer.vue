<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

const audio = ref<HTMLAudioElement | null>(null);
const playingId = ref<number | null>(null);
const isPlaying = ref(false);

// audio controls
function toggle(mapsetId: number) {
    const a = audio.value;
    if (!a) return;

    // same id, start/stop
    if (playingId.value === mapsetId) {
        if (a.paused) a.play().catch(() => {});
        else a.pause();
        return;
    }

    // diff id, switch
    playingId.value = mapsetId;
    a.src = `https://b.ppy.sh/preview/${mapsetId}.mp3`;
    a.play().catch(() => {
        // loading failed
    });
}

// hide bar after timeout + preview finishes
const CLOSE_TIMEOUT_MS = 600;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function onPlay() {
    isPlaying.value = true;
    clearTimeout(closeTimer); // something new started
}

function onEnded() {
    isPlaying.value = false;
    closeTimer = setTimeout(close, CLOSE_TIMEOUT_MS);
}

// destruction
function close() {
    clearTimeout(closeTimer);
    audio.value?.pause(); // pause audio while transition
    playingId.value = null;
    isPlaying.value = false;
}

// transition done, destroy rest
function resetAudio() {
    const a = audio.value;
    if (!a) return;
    a.removeAttribute("src");
    a.load();
}

onBeforeUnmount(() => {
    clearTimeout(closeTimer);
    audio.value?.pause();
});

// for identifying playing row
defineExpose({ toggle, playingId, isPlaying });
</script>

<template>
    <Transition name="player" @after-leave="resetAudio">
        <div v-show="playingId !== null" class="player">
            <audio
                ref="audio"
                controls
                :volume="0.5"
                preload="none"
                @play="onPlay"
                @pause="isPlaying = false"
                @ended="onEnded"
            />
            <button type="button" aria-label="Close player" @click="close">
                ✕
            </button>
        </div>
    </Transition>
</template>

<style scoped>
.player {
    position: fixed;
    left: 50%;
    bottom: 0.75rem;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    color: var(--text);
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: 0.75rem;
}
.player audio {
    flex: 1;
    min-width: 300px;
    height: 2rem;
}
.player button {
    flex-shrink: 0;
}

/* closing fade out  */
.player-enter-active,
.player-leave-active {
    transition:
        opacity 0.25s ease,
        translate 0.25s ease;
}
.player-enter-from,
.player-leave-to {
    opacity: 0;
    translate: 0 1rem;
}

@media (prefers-reduced-motion: reduce) {
    .player-enter-active,
    .player-leave-active {
        transition: none;
    }
}
</style>
