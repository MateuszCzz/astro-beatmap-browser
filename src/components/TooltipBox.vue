<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from "vue";

type Point = { x: number; y: number };
type ShowOpts = { at?: Point; focus?: boolean; touch?: boolean };

const EDGE = 8; // min distance from edges
const GAP = 14; // cursor-tooltip gap

const el = ref<HTMLElement | null>(null);
const s = reactive({
    title: "",
    body: "",
    on: false,
    touch: false,
});

let cur: HTMLElement | null = null; // element tooltip is showing for
let pos: Point | null = null;
let focusShown = false; // keyboard focus
let raf = 0; // pending frame, max one reposition per frame

let tw = 0;
let th = 0;
let vw = 0;
let vh = 0;

const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(v, hi));

const tipOf = (e: Event): HTMLElement | null => {
    const t = e.target as Element | null;
    return t?.closest ? t.closest<HTMLElement>("[data-tip]") : null;
};

// called on every pointermove
function position(t: HTMLElement) {
    let x: number;
    let y: number;

    if (pos) {
        // centered below cursor; goes above when no room
        x = pos.x - tw / 2;
        y = pos.y + GAP;
        if (y + th + EDGE > vh) y = pos.y - th - GAP;
    } else {
        // keyboard focus: centered on the element
        const r = t.getBoundingClientRect();
        x = r.left + r.width / 2 - tw / 2;
        y = r.top - th - EDGE;
        if (y < EDGE) y = r.bottom + EDGE;
    }

    x = clamp(x, EDGE, vw - tw - EDGE);
    y = clamp(y, EDGE, vh - th - EDGE);

    if (el.value)
        el.value.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

async function place(t: HTMLElement) {
    const text = t.dataset.tip;
    if (!text) return hide();

    // new line split title/body
    const nl = text.indexOf("\n");
    s.title = nl < 0 ? "" : text.slice(0, nl);
    s.body = text.slice(nl + 1);
    s.on = true;

    await nextTick();
    const tp = el.value;
    if (!tp || cur !== t) return; // hidden or moved on while waiting
    tw = tp.offsetWidth;
    th = tp.offsetHeight;
    vw = document.documentElement.clientWidth;
    vh = document.documentElement.clientHeight;
    position(t);
}

function hide() {
    cancelAnimationFrame(raf);
    raf = 0;
    s.on = false;
    s.touch = false;
    cur = null;
    focusShown = false;
    pos = null;
}

function show(t: HTMLElement, opts: ShowOpts = {}) {
    cur = t;
    focusShown = !!opts.focus;
    pos = opts.at ?? null;
    s.touch = !!opts.touch;
    place(t);
}

// mouse / pen: follows the cursor
const onOver = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const t = tipOf(e);
    if (t && t !== cur) show(t, { at: { x: e.clientX, y: e.clientY } });
};
const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" || !cur || !pos) return;
    if (!cur.isConnected) return hide(); // row was re-rendered away under the cursor
    pos = { x: e.clientX, y: e.clientY };
    if (!raf)
        raf = requestAnimationFrame(() => {
            raf = 0;
            if (cur) position(cur);
        });
};
const onOut = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const t = tipOf(e);
    if (t && !t.contains(e.relatedTarget as Node | null)) hide();
};

// touch: pins tip above the element
// hidden by tap on
// same element, on tip, elsewhere, scrolling or resizing
const onUp = (e: PointerEvent) => {
    if (e.pointerType !== "touch") return;
    const t = tipOf(e);
    if (t && (t !== cur || t.matches("button,a"))) show(t, { touch: true });
    else hide();
};

// keyboard: pinned to the element until focus leaves
const onFocusIn = (e: FocusEvent) => {
    const t = tipOf(e);
    if (t && (e.target as Element).matches(":focus-visible"))
        show(t, { focus: true });
};
const onFocusOut = (e: FocusEvent) => {
    if (focusShown && tipOf(e) === cur) hide();
};

// shown element text changed
const onRefresh = (e: Event) => {
    if (cur && cur === tipOf(e)) place(cur);
};

let ac: AbortController | null = null;

onMounted(() => {
    ac = new AbortController();
    const { signal } = ac;
    document.addEventListener("pointerover", onOver, { signal });
    document.addEventListener("pointermove", onMove, { signal });
    document.addEventListener("pointerout", onOut, { signal });
    document.addEventListener("pointerup", onUp, { signal });
    document.addEventListener("focusin", onFocusIn, { signal });
    document.addEventListener("focusout", onFocusOut, { signal });
    document.addEventListener("tiprefresh", onRefresh, { signal });
    window.addEventListener("scroll", hide, { capture: true, signal });
    window.addEventListener("resize", hide, { signal });
});
onBeforeUnmount(() => {
    ac?.abort();
    hide();
});
</script>

<template>
    <Teleport to="body">
        <div
            ref="el"
            v-show="s.on"
            class="tip"
            :class="{ touch: s.touch }"
            role="tooltip"
        >
            <b v-if="s.title">{{ s.title }}</b>
            <span>{{ s.body }}</span>
        </div>
    </Teleport>
</template>

<style scoped>
.tip {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 99;
    width: max-content;
    max-width: 250px;
    padding: 8px 11px;
    border-radius: 8px;
    background: var(--tip-bg, #0e0b15);
    color: var(--tip-text, #e6e0f2);
    border: 1px solid var(--line, #3a3250);
    font:
        400 12px/1.45 "Lexend",
        sans-serif;
    white-space: pre-line;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    pointer-events: none;
}

.tip.touch {
    pointer-events: auto;
}
.tip b {
    display: block;
    color: #fff;
    font-weight: 600;
    margin-bottom: 2px;
}
</style>
