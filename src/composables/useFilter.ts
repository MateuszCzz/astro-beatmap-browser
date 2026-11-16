import { computed, reactive, ref, watch } from "vue";
import type { BeatmapParsed, ModId, Tier } from "../domain/beatmap";
import { DEFAULT_TIER } from "../domain/manifest";

export interface FilterState {
    tier: Tier;
    search: string;
    mod: ModId[];
    genre: number[];
    language: number[];
}

const state = reactive<FilterState>({
    tier: DEFAULT_TIER,
    search: "",
    mod: [],
    genre: [] as number[],
    language: [] as number[],
});

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

    return (r: BeatmapParsed): boolean => {
        if (mod.length && !mod.includes(r.mods)) return false;
        if (genre.length && !genre.includes(r.genre_id)) return false;
        if (language.length && !language.includes(r.language_id)) return false;
        if (terms.length) {
            const q = haystack(r);
            for (const t of terms) if (!q.includes(t)) return false;
        }
        return true;
    };
});

function reset() {
    state.search = "";
    state.mod = [];
    state.genre = [];
    state.language = [];
}

export const useFilter = () => ({ state, matcher, reset });