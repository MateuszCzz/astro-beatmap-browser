import { TIERS } from "./beatmap";
import type { Tier } from "./beatmap";

export const DEFAULT_TIER: Tier = 4;


// core - main content; rest leftover rarely used big tail
export type Split = { core: string; rest: string[] };
export type DataFiles = {
    tiers: Record<Tier, Split>;
};

// data versioning manifest
export function assertManifest(manifest: Partial<DataFiles>): DataFiles {
    const { tiers } = manifest;
    const missing = [
        ...TIERS.filter((t) => !tiers?.[t]).map((t) => `tier ${t}`),
    ];
    if (!tiers || missing.length) {
        throw new Error(
            `public/data/manifest.json is missing (missing: ${missing.join(", ")}); re-run build-script`,
        );
    }
    return { tiers };
}

export const dataUrl = (file: string) => `/data/${file}`;
export async function fetchJson<T>(file: string, signal: AbortSignal): Promise<T> {
    const res = await fetch(dataUrl(file), { signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${file}`);
    return res.json();
}