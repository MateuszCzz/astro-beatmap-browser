import {
    computed,
    inject,
    onScopeDispose,
    provide,
    ref,
    shallowRef,
    type ComputedRef,
    type InjectionKey,
} from "vue";
import { FILE_LOOKUPS, fetchJson, type FileLookup, type Split } from "../domain/manifest";

type Entry = string | number | null | { username?: string | null; rank?: number };
type Table = Record<number, Entry>;
export type LookupOption = { id: number; label: string; rank: number };

function parse(id: number | string, v: Entry | undefined): { label: string; rank: number } {
    const obj = v !== null && typeof v === "object";
    const label = String((obj ? v.username : v) ?? "").trim() || String(id);
    return { label, rank: (obj && v.rank) || 0 };
}

export function createLookup(files: Record<FileLookup, Split>) {
    const tables = shallowRef(
        Object.fromEntries(FILE_LOOKUPS.map((k) => [k, [] as Table[]])) as Record<FileLookup, Table[]>,
    );

    const pendingRest = new Map<FileLookup, string[]>(
        FILE_LOOKUPS.map((k) => [k, files[k].rest]),
    );
    const ready = ref(false); // core data done
    const ctl = new AbortController();

    async function load(kind: FileLookup, file: string) {
        try {
            const table = await fetchJson<Table>(file, ctl.signal);
            tables.value = { ...tables.value, [kind]: [...tables.value[kind], table] };
        } catch (e) {
            if (!ctl.signal.aborted) console.error(e); // fall back to the raw id
        }
    }

    // load main content
    const coreDone = Promise.all(FILE_LOOKUPS.map((k) => load(k, files[k].core))).then(
        () => (ready.value = true),
    );

    // load rest data on first miss
    async function loadRest(kind: FileLookup) {
        const files = pendingRest.get(kind);
        if (!files) return;
        pendingRest.delete(kind); // stop repeated calls to load
        for (const file of files) await load(kind, file);
    }

    function name(kind: FileLookup, id: number): string {
        const list = tables.value[kind];
        for (const table of list) {
            const found = table[id];
            if (found !== undefined) return parse(id, found).label;
        }
        if (list.length) void loadRest(kind);
        return String(id);
    }

    // one list per kind core first
    const options = Object.fromEntries(
        FILE_LOOKUPS.map((k) => [
            k,
            computed(() =>
                tables.value[k]
                    .flatMap((t) =>
                        Object.entries(t).map(([id, v]) => ({ id: Number(id), ...parse(id, v) })),
                    )
                    .sort((a, b) => b.rank - a.rank),
            ),
        ]),
    ) as Record<FileLookup, ComputedRef<LookupOption[]>>;

    const prefetch = (kind: FileLookup) => void coreDone.then(() => loadRest(kind));

    onScopeDispose(() => ctl.abort());
    return { name, ready, options, prefetch };
}

const KEY: InjectionKey<ReturnType<typeof createLookup>> = Symbol("lookups");
export function provideLookups(files: Record<FileLookup, Split>) {
    const lookups = createLookup(files);
    provide(KEY, lookups);
    return lookups;
}
export function useLookup() {
    const lookups = inject(KEY);
    if (!lookups) throw new Error("useLookups() needs provideLookups() in a parent component");
    return lookups;
}