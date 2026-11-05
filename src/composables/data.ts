import { TIERS } from "./beatmap";
import type { Tier } from "./beatmap";

export const DEFAULT_TIER: Tier = 4;

export const FILE_LOOKUPS = ["tags", "mappers"] as const;
export type FileLookup = (typeof FILE_LOOKUPS)[number];

// core - main content; rest leftover rarely used big tail
export type Split = { core: string; rest: string[] };
export type DataFiles = {
    tiers: Record<Tier, Split>;
    lookups: Record<FileLookup, Split>;
};

// data versioning manifest
export function assertManifest(manifest: Partial<DataFiles>): DataFiles {
    const { tiers, lookups } = manifest;
    const missing = [
        ...TIERS.filter((t) => !tiers?.[t]).map((t) => `tier ${t}`),
        ...FILE_LOOKUPS.filter((k) => !lookups?.[k]),
    ];
    if (!tiers || !lookups || missing.length) {
        throw new Error(
            `public/data/manifest.json is missing (missing: ${missing.join(", ")}); re-run build-script`,
        );
    }
    return { tiers, lookups };
}

export const dataUrl = (file: string) => `/data/${file}`;
export async function fetchJson<T>(file: string, signal: AbortSignal): Promise<T> {
    const res = await fetch(dataUrl(file), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`);
    return res.json();
}