import { computed, reactive, shallowRef, watch } from "vue";
import type { BeatmapParsed, ModId, Tier, RangeKey } from "../domain/beatmap";
import { DEFAULT_TIER } from "../domain/manifest";
import { RANGES } from "../domain/beatmap";

export interface FilterState {
    tier: Tier;
    search: string;
    mod: ModId[];
    genre: number[];
    language: number[];
    mapper: number[];
    tag: number[];
    tagDepth: number; // 1–5
    range: Record<RangeKey, [number, number]>;
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
    range: Object.fromEntries(
        Object.entries(RANGES).map(([k, r]) => [k, [r.min, r.max]]),
    ) as Record<RangeKey, [number, number]>,
});

const state = reactive<FilterState>(defaults());

function debounced<T>(
    source: () => T,
    ms: number,
    instant: (v: T) => boolean = () => false,
) {
    const out = shallowRef<T>(source());
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
        clearTimeout(timer);
        out.value = source();
    };
    watch(source, (v) => {
        clearTimeout(timer);
        if (instant(v)) flush();
        else timer = setTimeout(flush, ms);
    });
    return [out, flush] as const;
}

// delay by .3 on type in text filter
const [appliedSearch, flushSearch] = debounced(
    () => state.search,
    300,
    (v) => !v,
);

// delay by .3 on slider drag
const [appliedSliders, flushSliders] = debounced(
    () => ({
        tagDepth: state.tagDepth,
        bounds: activeBounds()
    }),
    300,
);

const appliedDepth = computed(() => appliedSliders.value.tagDepth);
const appliedBounds = computed<Bound[]>((prev) =>
    prev && sameBounds(prev, appliedSliders.value.bounds)
        ? prev
        : appliedSliders.value.bounds,
);


type Bound = { get: (r: BeatmapParsed) => number; lo: number; hi: number };

function activeBounds(): Bound[] {
    return (Object.keys(RANGES) as RangeKey[]).flatMap((k) => {
        const { min, max, get } = RANGES[k];
        const [a, b] = state.range[k];
        const lo = a <= min ? -Infinity : a;
        const hi = b >= max ? Infinity : b;
        return lo === -Infinity && hi === Infinity ? [] : [{ get, lo, hi }];
    });
}

function sameBounds(a: Bound[], b: Bound[]) {
    return (
        a.length === b.length &&
        a.every(
            (x, i) =>
                x.get === b[i].get && x.lo === b[i].lo && x.hi === b[i].hi,
        )
    );
}

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
    const mod = [...state.mod];
    const genre = [...state.genre];
    const language = [...state.language];
    const mapper = [...state.mapper];
    const tags = [...state.tag];
    // read when needed
    const tagDepth = tags.length ? appliedDepth.value : 0;
    const bounds = appliedBounds.value;

    return (r: BeatmapParsed): boolean => {
        if (mod.length && !mod.includes(r.mods)) return false;
        if (genre.length && !genre.includes(r.genre_id)) return false;
        if (language.length && !language.includes(r.language_id)) return false;
        if (mapper.length && !mapper.includes(r.mapper_id)) return false;
        if (tags.length) {
            const top = r.tags.filter((t) => t != null).slice(0, tagDepth);
            if (!tags.every((t) => top.includes(t))) return false;
        }
        if (terms.length) {
            const q = haystack(r);
            for (const t of terms) if (!q.includes(t)) return false;
        }
        for (const { get, lo, hi } of bounds) {
            const v = get(r);
            if (v < lo || v > hi) return false;
        }
        return true;
    };
});

function reset() {
    const { tier, ...rest } = defaults();
    Object.assign(state, rest);
    flushSearch();
    flushSliders();
}

export const useFilter = () => ({
    state,
    matcher,
    reset,
    flushSliders,
});