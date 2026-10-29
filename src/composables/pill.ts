import { MODS, type BeatmapParsed } from "./beatmap";
import { tip, type TipKey } from "./tooltip";

// ready rebuild object
export type Pill = Readonly<{
    key: PillKey;
    label: string;
    attrs: Readonly<{ "data-tip": string; "data-pill": PillKey; style: string }>;
}>;

type Def = { bg: string; fg: string; label?: string };

const PILLS = {
    // tier pills
    T1: { bg: "#ffd166", fg: "#3b2a00" },
    T2: { bg: "#dfe6f0", fg: "#1f2937" },
    T3: { bg: "#cd7f32", fg: "#2b1500" },
    T4: { bg: "#a99bd8", fg: "#1e1740" },

    // mod pills
    NM: { bg: "#9ca3af", fg: "#2d333d" },
    HR: { bg: "#ef4444", fg: "#4a0d0d" },
    DT: { bg: "#10d3ff", fg: "#043a47" },
    DTHR: {
        bg: "linear-gradient(90deg, #ef4444 52.7%, #10d3ff 0)", fg: "#1a1a2e", label: "HRDT"
    },
} satisfies Partial<Record<TipKey, Def>>;
export type PillKey = keyof typeof PILLS;
const KEYS = Object.keys(PILLS) as PillKey[];

const ATTRS = {} as Record<PillKey, Pill>;
for (const k of KEYS) {
    const d: Def = PILLS[k];
    ATTRS[k] = Object.freeze({
        key: k,
        label: d.label ?? k,
        attrs: Object.freeze({
            ...tip(k),
            "data-pill": k,
            style: `--pill-bg:${d.bg};--pill-fg:${d.fg}`,
        }),
    });
}
Object.freeze(ATTRS);

if (KEYS.length > 31) throw new Error("pill bitmask supports 31 pills");
const BIT = Object.fromEntries(KEYS.map((k, i) => [k, 1 << i])) as Record<PillKey, number>;

const RULES: readonly ((r: BeatmapParsed) => number)[] = [
    (r) => BIT[`T${r.user_tier}` as const],
    (r) => BIT[MODS[r.mods]],
];

const lists = new Map<number, readonly Pill[]>();

export function pillsOf(r: BeatmapParsed): readonly Pill[] {
    let mask = 0;
    for (const rule of RULES) mask |= rule(r);
    let list = lists.get(mask);
    if (!list) lists.set(mask, (list = Object.freeze(KEYS.filter((k) => mask & BIT[k]).map((k) => ATTRS[k]))));
    return list;
}