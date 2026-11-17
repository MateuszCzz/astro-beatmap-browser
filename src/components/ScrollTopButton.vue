<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useAudio } from "../composables/useAudio";

const SHOW_AFTER = 400;

const { isOpen } = useAudio();
const visible = ref(false);

function update() {
    visible.value = window.scrollY > SHOW_AFTER;
}

function scrollToTop() {
    const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

onMounted(() => {
    window.addEventListener("scroll", update, { passive: true });
    update();
});
onBeforeUnmount(() => window.removeEventListener("scroll", update));
</script>

<template>
    <Transition name="to-top">
        <button
            v-if="visible"
            type="button"
            class="to-top"
            :class="{ raised: isOpen }"
            aria-label="Back to top"
            @click="scrollToTop"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 15l6-6 6 6" />
            </svg>
        </button>
    </Transition>
</template>

<style scoped>
.to-top {
    position: fixed;
    right: 1.5em;
    bottom: 1.5em;
    z-index: 9;
    display: grid;
    place-items: center;
    width: 3em;
    height: 3em;
    padding: 0;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 50%;
    box-shadow: 0 4px 14px color-mix(in srgb, black 25%, transparent);
    cursor: pointer;
    transition:
        opacity 0.2s ease,
        transform 0.2s ease,
        bottom 0.2s ease-out,
        background 0.15s,
        border-color 0.15s;
}

/* lift above audio player on narrow screens */
@media (max-width: 630px) {
    .to-top.raised {
        bottom: 4rem;
    }
}
.to-top:hover {
    background: var(--surface-2);
    border-color: color-mix(in srgb, var(--text) 40%, var(--line));
}
.to-top:focus-visible {
    outline: 2px solid var(--text);
    outline-offset: 3px;
}

.to-top-enter-from,
.to-top-leave-to {
    opacity: 0;
    transform: translateY(0.75em);
}

.to-top svg {
    width: 1.4em;
    height: 1.4em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    color: var(--muted);
}
.to-top:hover svg,
.to-top:focus-visible svg {
    color: var(--text);
}

@media (prefers-reduced-motion: reduce) {
    .to-top {
        transition: opacity 0.2s ease;
    }
    .to-top-enter-from,
    .to-top-leave-to {
        transform: none;
    }
}
</style>
