import { computed, reactive, ref, watch } from "vue";
import type { BeatmapParsed, ModId, Tier } from "../domain/beatmap";
import { DEFAULT_TIER } from "../domain/manifest";

export interface FilterState {
    tier: Tier;
    search: string;
    mod: ModId[];
    genre: number[];
    language: number[];
    mapper: number[];
    tag: number[];
    tagDepth: number; // 1–5
}
const defaults = (): FilterState => ({
    tier: DEFAULT_TIER,
    search: "",
    mod: [],
    genre: [],
    language: [],
    mapper: [],
    tag: [],
    tagDepth: 3,
});

const state = reactive<FilterState>(defaults());

const appliedSearch = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
watch(
    () => state.search,
    (v) => {
        clearTimeout(timer);
        timer = setTimeout(() => (appliedSearch.value = v), 150);
    },
);

const norm = (s: string) => s.normalize("NFKC").toLowerCase();
const qCache = new WeakMap<BeatmapParsed, string>();
const haystack = (r: BeatmapParsed) => {
    let q = qCache.get(r);
    if (q === undefined) {
        q = norm(`${r.artist} ${r.title} ${r.diff}`);
        qCache.set(r, q);
    }
    return q;
};

// Rebuilt only when a filter changes
const matcher = computed(() => {
    const terms = norm(appliedSearch.value).split(/\s+/).filter(Boolean);
    const mod = state.mod;
    const genre = state.genre;
    const language = state.language;
    const mapper = state.mapper
    const tags = state.tag;
    const tagsDepth = state.tagDepth;

    return (r: BeatmapParsed): boolean => {
        if (mod.length && !mod.includes(r.mods)) return false;
        if (genre.length && !genre.includes(r.genre_id)) return false;
        if (language.length && !language.includes(r.language_id)) return false;
        if (mapper.length && !mapper.includes(r.mapper_id)) return false;
        if (tags.length) {
            const top = r.tags.filter((t) => t != null).slice(0, tagsDepth);
            if (!tags.every((t) => top.includes(t))) return false;
        }
        if (terms.length) {
            const q = haystack(r);
            for (const t of terms) if (!q.includes(t)) return false;
        }
        return true;
    };
});

function reset() {
    const { tier, ...rest } = defaults();
    Object.assign(state, rest);
}

export const useFilter = () => ({ state, matcher, reset });