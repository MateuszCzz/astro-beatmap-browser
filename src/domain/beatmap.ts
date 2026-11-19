import { lengthFormat, oneDecimalFormat } from "./display";

export const MODS = {
    1: "NM",
    2: "HR",
    3: "DT",
    4: "DTHR",
} as const satisfies Record<number, string>;
export type ModId = keyof typeof MODS;

export const TIERS = [1, 2, 3, 4] as const;
export type Tier = (typeof TIERS)[number];

export const FLAGS = {
    HDF: 1 << 0, // most plays are with HD
    SPACED: 1 << 1, // aim-heavy
    DENSE: 1 << 2, // speed-heavy
    UNI: 1 << 3, // scores in several tiers
    RS: 1 << 4, // young and gains a lot
    TFAV: 1 << 5, // old and popular
    FPACK: 1 << 6, // many from set high score
} as const;
export type FlagKey = keyof typeof FLAGS;

export const GENRES: Record<number, string> = {
    2: "Video Game",
    3: "Anime",
    4: "Rock",
    5: "Pop",
    6: "Other",
    7: "Novelty",
    9: "Hip Hop",
    10: "Electronic",
    11: "Metal",
    12: "Classical",
    13: "Folk",
    14: "Jazz",
} as const;

export const LANGUAGES: Record<number, string> = {
    2: "English",
    3: "Japanese",
    4: "Chinese",
    5: "Instrumental",
    6: "Korean",
    7: "French",
    8: "German",
    9: "Swedish",
    10: "Spanish",
    11: "Italian",
    12: "Russian",
    13: "Polish",
    14: "Other",
} as const;

// raw json
export type BeatmapRaw = {
    difficulty_id: number;
    mods: ModId;
    user_tier: Tier;
    mapset_id: number;
    mapper_id: number;
    artist: string;
    title: string;
    diff: string;
    sr: number;
    bpm: number;
    ar: number;
    od: number;
    cs: number;
    length: number;
    date: number;
    genre_id: number;
    language_id: number;
    hidden_ratio: number;
    profile_top_25_ratio: number;
    aim_speed_ratio: number;
    max_pp: number;
    median_pp_gain: number;
    score: number;
    flags: number;
    tag_1: number | null;
    tag_2: number | null;
    tag_3: number | null;
    tag_4: number | null;
    tag_5: number | null;
};

// add key group & drop null on tags
export type BeatmapParsed = Readonly<
    Omit<BeatmapRaw, "tag_1" | "tag_2" | "tag_3" | "tag_4" | "tag_5"> & {
        key: string; // 'difficulty_id:mods'
        tags: readonly number[]; // tag ids, nulls dropped
    }
>;

export function parseBeatmap(r: BeatmapRaw): BeatmapParsed {
    const { tag_1, tag_2, tag_3, tag_4, tag_5, ...rest } = r;
    return {
        ...rest,
        key: `${r.difficulty_id}:${r.mods}`,
        tags: [tag_1, tag_2, tag_3, tag_4, tag_5].filter((t): t is number => !!t),
    };
}

export type RangeDef = {
    label: string;
    min: number;
    max: number;
    step: number;
    get: (r: BeatmapParsed) => number;
    format?: (n: number) => string;
};

export const RANGES = {
    ar: {
        label: "AR",
        min: 0,
        max: 11,
        step: 0.1,
        get: (r) => r.ar / 100,
        format: oneDecimalFormat,
    },
    bpm: { label: "BPM", min: 80, max: 400, step: 5, get: (r) => r.bpm },

    length: {
        label: "Length",
        min: 15,
        max: 900,
        step: 5,
        get: (r) => r.length,
        format: lengthFormat,
    },
    sr: {
        label: "SR",
        min: 3.5,
        max: 12,
        step: 0.1,
        get: (r) => r.sr / 100,
        format: oneDecimalFormat,
    },
    od: {
        label: "OD",
        min: 0,
        max: 11.1,
        step: 0.1,
        get: (r) => r.od / 100,
        format: oneDecimalFormat,
    },
    cs: {
        label: "CS",
        min: 0,
        max: 10,
        step: 0.1,
        get: (r) => r.cs / 100,
        format: oneDecimalFormat,
    },
    year: {
        label: "Ranked Date",
        min: 2009 * 4,
        max: 2026 * 4 + 3,
        step: 1,
        get: (r) => {
            const year = Math.floor(r.date / 10000);
            const month = Math.floor(r.date / 100) % 100;
            return year * 4 + Math.floor((month - 1) / 3);
        },
        format: (n) =>
            `${Math.floor(n / 4)}-${String((n % 4) * 3 + 1).padStart(2, "0")}`,
    },
    score: {
        label: "Score",
        min: 0,
        max: 2000,
        step: 10,
        get: (r) => r.score,
    },
} satisfies Record<string, RangeDef>;
export type RangeKey = keyof typeof RANGES;