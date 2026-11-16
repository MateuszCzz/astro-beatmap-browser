<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from "vue";
import {
    TIP_ATTR,
    TIP_LAZY_ATTR,
    TIP_SELECTOR,
    readTip,
    splitTip,
} from "../domain/tooltip";

type Point = { x: number; y: number };
type ShowOpts = { at?: Point; focus?: boolean; touch?: boolean };

const MAX_W = 250; // tooltip width cap
const EDGE = 8; // min distance from edges
const GAP_EL = 8; // element to tooltip gap; touch
const GAP_CURSOR = 14; // cursor to tooltip gap

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

const size = { w: 0, h: 0 }; // tooltip size
const view = { x: 0, y: 0, w: 0, h: 0 };

const ac = new AbortController();

// re-render when element's tip changes
const mo = new MutationObserver(() => {
    if (cur) place(cur);
});

const fit = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(v, hi));

const tipOf = (e: Event): HTMLElement | null => {
    const t = e.target as Element | null;
    return t?.closest ? t.closest<HTMLElement>(TIP_SELECTOR) : null;
};

// layout coordinates
function measureView() {
    const vv = window.visualViewport;
    const d = document.documentElement;
    view.x = vv?.offsetLeft ?? 0;
    view.y = vv?.offsetTop ?? 0;
    view.w = vv?.width ?? Math.min(d.clientWidth, innerWidth); // old browsers
    view.h = vv?.height ?? Math.min(d.clientHeight, innerHeight);
}

function tipPosition(at: Point | DOMRect): Point {
    const minX = view.x + EDGE;
    const minY = view.y + EDGE;
    const maxX = view.x + view.w - EDGE - size.w;
    const maxY = view.y + view.h - EDGE - size.h;

    let x: number;
    let y: number;

    if ("width" in at) {
        // element: above, flip below if no room
        x = at.left + at.width / 2 - size.w / 2;
        y = at.top - size.h - GAP_EL;
        if (y < minY) y = at.bottom + GAP_EL;
    } else {
        // cursor: below, flip above if no room
        x = at.x - size.w / 2;
        y = at.y + GAP_CURSOR;
        if (y > maxY) y = at.y - size.h - GAP_CURSOR;
    }

    return { x: fit(x, minX, maxX), y: fit(y, minY, maxY) };
}

// called on every pointermove
function position(t: HTMLElement) {
    if (!el.value) return;
    const { x, y } = tipPosition(pos ?? t.getBoundingClientRect());
    el.value.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

async function place(t: HTMLElement) {
    const text = readTip(t);
    if (!text) return hide();

    Object.assign(s, splitTip(text), { on: true });

    await nextTick();
    const tp = el.value;
    if (!tp || cur !== t) return; // hidden or moved on while waiting
    measureView();
    tp.style.maxWidth = `${Math.min(MAX_W, view.w - EDGE * 2)}px`;
    size.w = tp.offsetWidth;
    size.h = tp.offsetHeight;
    position(t);
}

function hide() {
    mo.disconnect();
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
    mo.disconnect();
    mo.observe(t, {
        attributes: true,
        attributeFilter: [TIP_ATTR, TIP_LAZY_ATTR],
    });
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
// hidden by taping, scrolling or resizing
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

onMounted(() => {
    const { signal } = ac;
    document.addEventListener("pointerover", onOver, { signal });
    document.addEventListener("pointermove", onMove, { signal });
    document.addEventListener("pointerout", onOut, { signal });
    document.addEventListener("pointerup", onUp, { signal });
    document.addEventListener("focusin", onFocusIn, { signal });
    document.addEventListener("focusout", onFocusOut, { signal });
    const movers: (EventTarget | null)[] = [window, window.visualViewport];
    for (const target of movers)
        for (const type of ["scroll", "resize"])
            target?.addEventListener(type, hide, { capture: true, signal });
});
onBeforeUnmount(() => {
    ac.abort();
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
    box-sizing: border-box;
    width: max-content;
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
