<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import { useAudioPreview } from "../composables/useAudio";

const { audio, loadedId, isPlaying, close } = useAudioPreview();

// hide bar after timeout + preview finishes
const CLOSE_TIMEOUT_MS = 600;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

function onPlay() {
    isPlaying.value = true;
    clearTimeout(closeTimer); // something new started
}

function onPause() {
    isPlaying.value = false;
}

function onEnded() {
    isPlaying.value = false;
    closeTimer = setTimeout(close, CLOSE_TIMEOUT_MS);
}

function closeNow() {
    clearTimeout(closeTimer);
    close();
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
</script>

<template>
    <Transition name="player" @after-leave="resetAudio">
        <div v-show="loadedId !== null" class="player">
            <audio
                ref="audio"
                controls
                :volume="0.5"
                preload="none"
                @play="onPlay"
                @pause="onPause"
                @ended="onEnded"
            />
            <button type="button" aria-label="Close player" @click="closeNow">
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
