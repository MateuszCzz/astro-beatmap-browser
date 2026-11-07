import { clamp } from "./display";

export const TIP_ATTR = "data-tip";
export const TIP_LAZY_ATTR = "data-tip-lazy";
export const TIP_SELECTOR = `[${TIP_ATTR}],[${TIP_LAZY_ATTR}]`;

export type TipAttrs = Readonly<Record<typeof TIP_ATTR, string>>;

export const tipAttrs = (text: string): TipAttrs => ({ [TIP_ATTR]: text });

export const tipText = (title: string, body: string) => `${title}\n${body}`;

export function splitTip(text: string): { title: string; body: string } {
    const nl = text.indexOf("\n");
    return nl < 0
        ? { title: "", body: text }
        : { title: text.slice(0, nl), body: text.slice(nl + 1) };
}

export const refreshTip = (el: Element) =>
    el.dispatchEvent(new Event("tiprefresh", { bubbles: true }));

const squash = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

// dynamic tip for truncate strings; title, artist; diff, mapper 
function foldedTip(el: HTMLElement): string | null {
    const kids = el.children;
    let cut = false;
    for (let i = 0; i < kids.length && !cut; i++) {
        cut = kids[i].scrollWidth > kids[i].clientWidth;
    }
    if (!cut) return null;

    const [first, ...rest] = Array.from(kids, (k) => squash(k.textContent));
    return rest.length ? tipText(first, rest.join(" ")) : first;
}

const RESOLVERS = { folded: foldedTip } satisfies Record<
    string,
    (el: HTMLElement) => string | null
>;

export type LazyKind = keyof typeof RESOLVERS;
export type LazyAttrs = Readonly<Record<typeof TIP_LAZY_ATTR, LazyKind>>;

const LAZY_ATTRS = Object.fromEntries(
    (Object.keys(RESOLVERS) as LazyKind[]).map((k) => [
        k,
        Object.freeze({ [TIP_LAZY_ATTR]: k }),
    ]),
) as Record<LazyKind, LazyAttrs>;

export const tipLazy = (kind: LazyKind): LazyAttrs => LAZY_ATTRS[kind];

// what to show; text att or hit resolver for dynamic
export function readTip(el: HTMLElement): string | null {
    const stored = el.getAttribute(TIP_ATTR);
    if (stored !== null) return stored;
    const kind = el.getAttribute(TIP_LAZY_ATTR) as LazyKind | null;
    return kind ? (RESOLVERS[kind]?.(el) ?? null) : null;
}

const TIP_EDGE = 8; // min distance from viewport edges
const TIP_GAP = 14; // cursor to tooltip gap

export type Point = { x: number; y: number };
type Size = { w: number; h: number };
type Rect = { left: number; top: number; width: number; bottom: number };

export function tipPosition(tip: Size, view: Size, at: Point | Rect): Point {
    let x: number;
    let y: number;

    if ("x" in at) {
        x = at.x - tip.w / 2;
        y = at.y + TIP_GAP;
        if (y + tip.h + TIP_EDGE > view.h) y = at.y - tip.h - TIP_GAP;
    } else {
        x = at.left + at.width / 2 - tip.w / 2;
        y = at.top - tip.h - TIP_EDGE;
        if (y < TIP_EDGE) y = at.bottom + TIP_EDGE;
    }

    return {
        x: clamp(x, TIP_EDGE, view.w - tip.w - TIP_EDGE),
        y: clamp(y, TIP_EDGE, view.h - tip.h - TIP_EDGE),
    };
}

export const TIPS = {
    // difficulty params
    sr: "Star rating\nAdjusted by mods if it applies.",
    length: "Length\nAdjusted by mods if it applies.",
    bpm: "Beats per minute\nAdjusted by mods if it applies.",
    cs: "Circle size\nAdjusted by mods if it applies.",
    ar: "Approach rate\nAdjusted by mods if it applies.",
    od: "Overall difficulty\nAdjusted by mods if it applies.",

    genre: "Genre",
    lang: "Language",
    year: "Year ranked\nThe year this map was ranked.",

    // pp params
    avg: "Median Gain\nMedian pp gained by players who managed to get this map into their top 100 scores, modified by play position.",
    max: "Max pp\nHighest pp set by a player with this map:mod combo. Can be affected by Lazer, Hidden and Flashlight.",
    score: "Farm score\nA calculated value comparing this map’s parameters against other maps in the same tier. For more, see the FAQ.",

    // ratios
    aimbias: "Aim bias\nHow much of the star rating comes from the distance between circles instead of their density. (bbydoll vs Tower Of Heaven DT) Adjusted by mods if it applies.",
    pass: "Pass rate\nGlobal pass rate for this map. Not mod adjusted.",
    top25: "Top25 rate\nHow often a score on this map ends up in a player’s top 25 scores.",
    hd: "HD usage\nHow often players use Hidden when setting scores on this map.",

    // mods
    NM: "NM\nNo Mod",
    HR: "HR\nHard Rock",
    DT: "DT\nDouble Time (Nightcore)",
    DTHR: "HR + DT\nHard Rock and Double Time",

    // tiers
    T1: "Tier 1\nBased on players ranked 1 – 1k",
    T2: "Tier 2\nBased on players ranked 1k – 10k",
    T3: "Tier 3\nBased on players ranked 10k – 100k",
    T4: "Tier 4\nBased on players ranked 100k – 500k",

    // buttons
    copy: "Copy difficulty ID",
    dl: "Open in game (std osu!direct)",
} as const;

export type TipKey = keyof typeof TIPS;

// Prebuilt once, one frozen object per key
const ATTRS = Object.fromEntries(
    Object.entries(TIPS).map(([k, text]) => [k, Object.freeze(tipAttrs(text))]),
) as Record<TipKey, TipAttrs>;

export const tip = (k: TipKey): TipAttrs => ATTRS[k];