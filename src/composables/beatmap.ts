export const MODS: Record<number, string> = {
    1: "NM",
    2: "DT",
    3: "HR",
    4: "DTHR"
} as const;

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
    mods: number;
    user_tier: number;
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
    year: number;
    genre_id: number;
    language_id: number;
    pass_ratio: number;
    hidden_ratio: number;
    fc_ratio: number;
    profile_top_25_ratio: number;
    aim_speed_ratio: number;
    max_pp: number;
    median_pp_gain: number;
    score: number;
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

export function toParse(r: BeatmapRaw): BeatmapParsed {
    const { tag_1, tag_2, tag_3, tag_4, tag_5, ...rest } = r;
    return {
        ...rest,
        key: `${r.difficulty_id}:${r.mods}`,
        tags: [tag_1, tag_2, tag_3, tag_4, tag_5].filter((t): t is number => !!t),
    };
}
