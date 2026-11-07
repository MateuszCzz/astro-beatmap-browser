import { inject, onScopeDispose, provide, ref, shallowRef, type InjectionKey } from "vue";
import { FILE_LOOKUPS, fetchJson, type FileLookup, type Split } from "../domain/manifest";

type Table = Record<number, string>;

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
    void Promise.all(FILE_LOOKUPS.map((k) => load(k, files[k].core))).then(
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
            if (found !== undefined) return found;
        }
        if (list.length) void loadRest(kind);
        return String(id);
    }

    onScopeDispose(() => ctl.abort());
    return { name, ready };
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