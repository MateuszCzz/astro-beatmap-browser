import { computed, reactive, ref, watch } from "vue";
import type { BeatmapParsed, ModId, Tier } from "./beatmap";
import { DEFAULT_TIER } from "./data";

export interface FilterState {
    tier: Tier;
    search: string;
    mod: ModId[];
}

const state = reactive<FilterState>({
    tier: DEFAULT_TIER,
    search: "",
    mod: [],
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

    return (r: BeatmapParsed): boolean => {
        if (mod.length && !mod.includes(r.mods)) return false;
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
}

export const useFilters = () => ({ state, matcher, reset });