import { computed, ref, shallowRef, type Ref } from "vue";

function fitCount(
    n: number,
    avail: number,
    gap: number,
    width: (i: number) => number,
    moreWidth: (hidden: number) => number,
): number {
    let all = -gap;
    for (let i = 0; i < n; i++) {
        all += gap + width(i);
        if (all > avail) break;
    }
    if (all <= avail) return n;

    let best = -1;
    let used = 0;
    for (let i = 0; i < n; i++) {
        if (used + moreWidth(n - i) <= avail) best = i;
        used += width(i) + gap;
        if (used > avail) break;
    }
    return best;
}

type Metrics = {
    gap: number;
    width: (text: string) => number;
};

let ctx: CanvasRenderingContext2D | null = null;

function readMetrics(box: HTMLElement): Metrics | null {
    if (!box.isConnected) return null;
    const chip = box.firstElementChild;
    ctx ??= document.createElement("canvas").getContext("2d");
    if (!chip || !ctx) return null;

    const cs = getComputedStyle(chip);
    const px = (v: string) => parseFloat(v) || 0;

    // get font for width calculation
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const extra =
        px(cs.paddingLeft) +
        px(cs.paddingRight) +
        px(cs.borderLeftWidth) +
        px(cs.borderRightWidth);
    const gap = px(getComputedStyle(box).columnGap);
    const c = ctx;
    const cache = new Map<string, number>();

    return {
        gap,
        width(text) {
            let w = cache.get(text);
            if (w === undefined) {
                c.font = font;
                w = c.measureText(text).width + extra;
                cache.set(text, w);
            }
            return w;
        },
    };
}

const metrics = shallowRef<Metrics | null>(null);
const live = new Set<HTMLElement>();
let fontKey = -1;

function refreshMetrics() {
    const box = live.values().next().value;
    if (!box) return;
    let loaded = 0;
    document.fonts.forEach((f) => {
        if (f.status === "loaded") loaded++;
    });
    if (loaded === fontKey) return;
    const m = readMetrics(box);
    if (!m) return;
    fontKey = loaded;
    metrics.value = m;
}

if (typeof document !== "undefined" && document.fonts) {
    void document.fonts.ready.then(refreshMetrics);
    document.fonts.addEventListener("loadingdone", refreshMetrics);
}

const targets = new WeakMap<Element, Ref<number | null>>();
let ro: ResizeObserver | undefined;

function onResize(entries: ResizeObserverEntry[]) {
    for (const { target, contentRect: r } of entries) {
        // unrendered element skip
        if (r.width <= 0 && r.height <= 0) continue;
        if (target instanceof HTMLElement) {
            metrics.value ??= readMetrics(target);
        }
        const avail = targets.get(target);
        if (avail) avail.value = r.width;
    }
}

function attach(el: HTMLElement, avail: Ref<number | null>) {
    targets.set(el, avail);
    live.add(el);
    (ro ??= new ResizeObserver(onResize)).observe(el);
}

function release(el: HTMLElement) {
    ro?.unobserve(el);
    targets.delete(el);
    live.delete(el);
}

// rounding diffrence margin
const SLACK = 1;

export function useFoldingTags<T extends { label: string }>(
    items: Ref<readonly T[]>,
) {
    const avail = ref<number | null>(null);
    let box: HTMLElement | null = null;

    function bind(el: unknown) {
        const next = el instanceof HTMLElement ? el : null;
        if (next === box) return;
        if (box) release(box);
        box = next;
        if (box) attach(box, avail);
    }

    // find fitting tags
    const fit = computed(() => {
        const m = metrics.value;
        const w = avail.value;
        if (!m || w === null) return 0;
        const list = items.value;
        return fitCount(
            list.length,
            w - SLACK,
            m.gap,
            (i) => m.width(list[i].label),
            (hidden) => m.width(`+${hidden}`),
        );
    });

    const shown = computed(() => items.value.slice(0, Math.max(fit.value, 0)));
    const rest = computed(() => items.value.slice(Math.max(fit.value, 0)));
    const moreFits = computed(() => fit.value >= 0);

    return { shown, rest, moreFits, bind };
}