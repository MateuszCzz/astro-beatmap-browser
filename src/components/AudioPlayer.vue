<script setup lang="ts">
import { useAudio } from "../composables/useAudio";

const { audio, isOpen, hasError, close, release } = useAudio();
</script>

<template>
    <Transition name="player" @after-leave="release">
        <div
            v-show="isOpen"
            class="player"
            role="region"
            aria-label="Audio preview"
        >
            <audio v-show="!hasError" ref="audio" controls preload="none" />
            <span v-if="hasError" class="player-error" role="status">
                Preview unavailable
            </span>
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
    width: min(24rem, calc(100vw - 1.5rem));
    padding: 0.4rem 0.6rem;
    color: var(--text);
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: 0.75rem;
}
.player audio {
    flex: 1;
    min-width: 0;
    height: 2rem;
}
.player-error {
    flex: 1;
    text-align: center;
}
.player button {
    flex-shrink: 0;
}

/* enter / leave  fade*/
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

@media (max-width: 365px) {
    .player {
        --scale: 0.8;
        width: calc((100vw - 1.5rem) / var(--scale));
        scale: var(--scale);
        transform-origin: left bottom;
    }
}

@media (prefers-reduced-motion: reduce) {
    .player-enter-active,
    .player-leave-active {
        transition: none;
    }
}
</style>
