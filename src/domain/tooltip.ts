export const TIP_ATTR = "data-tip";
export const TIP_LAZY_ATTR = "data-tip-lazy";
export const TIP_SELECTOR = `[${TIP_ATTR}],[${TIP_LAZY_ATTR}]`;

const RESOLVERS = { folded: foldedTip };

export type TipAttrs = Record<typeof TIP_ATTR, string>;
export type LazyKind = keyof typeof RESOLVERS;
export type LazyAttrs = Record<typeof TIP_LAZY_ATTR, LazyKind>;
export type TipKey = keyof typeof TIPS;

export const tipAttrs = (text: string): TipAttrs => ({ [TIP_ATTR]: text });
export const tipText = (title: string, body: string) => `${title}\n${body}`;
export const tip = (k: TipKey): TipAttrs => tipAttrs(TIPS[k]);
export const tipLazy = (kind: LazyKind): LazyAttrs => ({
    [TIP_LAZY_ATTR]: kind,
});

export function splitTip(text: string): { title: string; body: string } {
    const nl = text.indexOf("\n");
    return nl < 0
        ? { title: "", body: text }
        : { title: text.slice(0, nl), body: text.slice(nl + 1) };
}

export function readTip(el: HTMLElement): string | null {
    const stored = el.getAttribute(TIP_ATTR);
    if (stored !== null) return stored;
    const kind = el.getAttribute(TIP_LAZY_ATTR) as LazyKind | null;
    return kind ? (RESOLVERS[kind]?.(el) ?? null) : null;
}

const squash = (s: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

// dynamic tip for truncate strings; title, artist; diff, mapper 
function foldedTip(el: HTMLElement): string | null {
    const kids = Array.from(el.children);
    if (!kids.some((k) => k.scrollWidth > k.clientWidth)) return null;

    const [first, ...rest] = kids.map((k) => squash(k.textContent));
    return rest.length ? tipText(first, rest.join(" ")) : first;
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
    date: "Ranked Date\nThe date this map was ranked.",

    // pp params
    avg: "Median Gain\nMedian pp gained by players who managed to get this map into their top 100 scores, modified by play position.",
    max: "Max pp\nHighest pp set by a player with this map:mod combo. Can be affected by Lazer, Hidden and Flashlight.",
    score: "Farm score\nA calculated value comparing this map’s parameters against other maps in the same tier. For more, see the FAQ.",

    // ratios
    aimbias: "Aim bias\nHow much of the star rating comes from the distance between circles instead of their density. (bbydoll vs Tower Of Heaven DT) Adjusted by mods if it applies.",
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

    // flags
    HDF: "HD Friendly\nOften played with the Hidden mod.",
    SPACED: "Spaced\npp comes mostly from the spacing between circles.",
    DENSE: "Dense\npp comes mostly from the density of circles.",
    UNI: "Universal\nA older map played across several tiers, usually with different mods.",
    RS: "Rising Star\nA newer map already proving to be a reliable source of pp.",
    TFAV: "Tier Favorite\nA tier-wide staple, appearing in players’ top plays more often than any other.",
    FPACK: "Farm Pack\nPart of a set where other difficulties are farmable in this tier.",

    // buttons
    copy: "Copy difficulty ID",
    copied: "Copied! Paste in osu song select or web beatmap browser",
    dl: "Open in game (std osu!direct)",
} as const;