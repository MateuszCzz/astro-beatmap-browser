import { onScopeDispose, ref, shallowRef, watch, type Ref } from "vue";
import { parseBeatmap, type BeatmapParsed, type BeatmapRaw, type Tier } from "../domain/beatmap";
import { fetchJson, type Split } from "../domain/manifest";

/**
 * beatmap data states:
 * loading: nothing to show yet
 * core:    core slice shown, rest still loading
 * full:    everything loaded
 * error:   core failed to load
 */
export type Phase = "loading" | "core" | "full" | "error";
type Entry = { core: BeatmapParsed[]; all?: BeatmapParsed[] };

export function useBeatmap(
    tier: Ref<Tier>,
    files: Record<Tier, Split>,
) {
    const rows = shallowRef<BeatmapParsed[]>([]);
    const phase = ref<Phase>("loading");
    const restError = ref(false); // rest failed; core stays
    const cache = new Map<Tier, Entry>();
    let ctl: AbortController | undefined;

    async function fetchRows(file: string, signal: AbortSignal) {
        return (await fetchJson<BeatmapRaw[]>(file, signal)).map(parseBeatmap);
    }

    // All data sorted in build script regular append rest-> core keeps record order
    async function loadRest(entry: Entry, files: string[], signal: AbortSignal) {
        try {
            let all = entry.core;
            for (const file of files) {
                const chunk = await fetchRows(file, signal);
                if (signal.aborted) return;
                all = all.concat(chunk);
                rows.value = all;
            }
            entry.all = all;
            phase.value = "full";
        } catch (e) {
            if (signal.aborted) return;
            console.error(e);
            restError.value = true;
        }
    }

    async function load(t: Tier) {
        ctl?.abort();
        const { signal } = (ctl = new AbortController());
        restError.value = false;

        let entry = cache.get(t);
        if (!entry) {
            rows.value = [];
            phase.value = "loading";
            try {
                entry = { core: await fetchRows(files[t].core, signal) };
            } catch (e) {
                if (signal.aborted) return;
                console.error(e);
                phase.value = "error";
                return;
            }
            if (signal.aborted) return;
            cache.set(t, entry);
        }

        if (entry.all) {
            rows.value = entry.all;
            phase.value = "full";
            return;
        }
        rows.value = entry.core;
        phase.value = "core";
        await loadRest(entry, files[t].rest, signal);
    }

    watch(tier, (t) => void load(t), { immediate: true });
    onScopeDispose(() => ctl?.abort());

    return { rows, phase, restError, retry: () => load(tier.value) };
}