<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from "vue";

type Point = { x: number; y: number };
type ShowOpts = { at?: Point | null; autoHide?: boolean; focus?: boolean };

const el = ref<HTMLElement | null>(null);
const s = reactive({ title: "", body: "", x: 0, y: 0, on: false });

const EDGE_PX = 8; // base edge-tooltip margin
const GAP = 14; // cursor-tooltip gap

let cur: HTMLElement | null = null; // toolbox
let timer = 0; // timer for autohide
let focusShown = false; // keyboard focus
let pos: Point | null = null; // last pointer spot, null = anchor
let EDGE = EDGE_PX; // edge margin
let tw = 0,
    th = 0; // tooltip size
let raf = 0; // pending requestAnimationFrame, max 1 movement per frame

const tipOf = (e: Event): HTMLElement | null => {
    const t = e.target as Element | null;
    return t?.closest ? t.closest<HTMLElement>("[data-tip]") : null;
};

// pure math, no layout reads, so it is cheap to call on every pointermove
function position(t: HTMLElement) {
    let x: number;
    let y: number;

    if (pos) {
        // centered below the cursor, flips above when there's no room
        x = pos.x - tw / 2;
        y = pos.y + GAP;
        if (y + th + EDGE > window.innerHeight) y = pos.y - th - GAP;
    } else {
        // keyboard focus: centered on the element
        const r = t.getBoundingClientRect();
        x = r.left + r.width / 2 - tw / 2;
        y = r.top - th - EDGE;
        if (y < EDGE) y = r.bottom + EDGE;
    }

    s.x = Math.min(Math.max(EDGE, x), window.innerWidth - tw - EDGE);
    s.y = Math.max(EDGE, Math.min(y, window.innerHeight - th - EDGE));
}

async function place(t: HTMLElement) {
    const tip = t.dataset.tip;
    if (!tip) return hide(); // no string found
    EDGE =
        EDGE_PX *
        (parseFloat(getComputedStyle(document.documentElement).fontSize) / 16);
    // new line split title/body
    const [first, ...rest] = tip.split("\n");
    s.title = rest.length ? first : "";
    s.body = rest.length ? rest.join("\n") : first;
    s.on = true;
    await nextTick();
    const tp = el.value;
    if (!tp || cur !== t) return; // hidden or moved on while waiting
    tw = tp.offsetWidth;
    th = tp.offsetHeight;
    position(t);
}

function hide() {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    raf = 0;
    s.on = false;
    cur = null;
    focusShown = false;
    pos = null;
}

function show(t: HTMLElement, opts: ShowOpts = {}) {
    cur = t;
    focusShown = !!opts.focus;
    pos = opts.at ?? null;
    place(t);
    clearTimeout(timer);
    if (opts.autoHide) timer = window.setTimeout(hide, 4500);
}

// pointer hover only, follows the cursor
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

// touch only, full pin, tapping elsewhere / scrolling / autohide
const onUp = (e: PointerEvent) => {
    if (e.pointerType !== "touch") return;
    const t = tipOf(e);
    if (t && (t !== cur || t.matches("button,a")))
        show(t, { at: { x: e.clientX, y: e.clientY }, autoHide: true });
    else hide();
};

// keyboard only, full pin
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

onMounted(() => {
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onOut);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("tiprefresh", onRefresh);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
});
onBeforeUnmount(() => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
    document.removeEventListener("tiprefresh", onRefresh);
    window.removeEventListener("scroll", hide, true);
    window.removeEventListener("resize", hide);
    clearTimeout(timer);
    cancelAnimationFrame(raf);
});
</script>

<template>
    <Teleport to="body">
        <div
            ref="el"
            v-show="s.on"
            class="tip"
            role="tooltip"
            :style="{ left: s.x + 'px', top: s.y + 'px' }"
        >
            <b v-if="s.title">{{ s.title }}</b
            >{{ s.body }}
        </div>
    </Teleport>
</template>

<style scoped>
.tip {
    position: fixed;
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
.tip b {
    display: block;
    color: #fff;
    font-weight: 600;
    margin-bottom: 2px;
}
</style>
