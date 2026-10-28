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
export const tip = (k: TipKey) => ({ "data-tip": TIPS[k] });
