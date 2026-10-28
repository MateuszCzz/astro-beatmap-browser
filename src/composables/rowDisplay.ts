// sr to hex color
const SR_STOPS: [number, [number, number, number]][] = [
    [0.1, [0x42, 0x90, 0xfb]], [1.25, [0x4f, 0xc0, 0xff]], [2, [0x4f, 0xff, 0xd5]],
    [2.5, [0x7c, 0xff, 0x4f]], [3.3, [0xf6, 0xf0, 0x5c]], [4.2, [0xff, 0x80, 0x68]],
    [4.9, [0xff, 0x4e, 0x6f]], [5.8, [0xc6, 0x45, 0xb8]], [6.7, [0x65, 0x63, 0xde]],
    [7.7, [0x18, 0x15, 0x8e]], [9, [0, 0, 0]],
];

// cache for color gens
// tiers have sr clustered together, should save
// resources on long list rendering
const srCache = new Map<number, string>();

export function srColor(sr100: number): string {
    sr100 = Math.round(sr100);
    const hit = srCache.get(sr100);
    if (hit) return hit;
    const r = sr100 / 100;
    const i = SR_STOPS.findIndex(([s]) => s > r);
    if (i === 0) return "#aaa";
    if (i === -1) return "#000";
    const [r0, a] = SR_STOPS[i - 1];
    const [r1, b] = SR_STOPS[i];
    const t = (r - r0) / (r1 - r0);
    const ch = (k: number) => Math.round(((1 - t) * a[k] ** 2.2 + t * b[k] ** 2.2) ** (1 / 2.2));
    const c = `rgb(${ch(0)},${ch(1)},${ch(2)})`;
    srCache.set(sr100, c);
    return c;
}

export const srFormat = (sr100: number) => `★ ${sr100 / 100}`;

// score color + glow config
const SCORE = {
    colorMin: 100, // color ramp start
    colorMax: 800, // color ramp end
    glowMin: 750, // glow ramp start
    glowMax: 2000, // glow ramp end
    glowPeak: 1.5, // max glow value
} as const;

// score to rgb color
const SCORE_LOW = [0x73, 0x32, 0x4b] as const;
const SCORE_MID = [0xb9, 0x4c, 0x7b] as const;
const SCORE_HIGH = [0xff, 0x66, 0xaa] as const;

export type ScoreVars = { "--sc": string; "--g": string };

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

function computeScoreVars(v: number): ScoreVars {
    const t = clamp01((v - SCORE.colorMin) / (SCORE.colorMax - SCORE.colorMin));
    const tg = clamp01((v - SCORE.glowMin) / (SCORE.glowMax - SCORE.glowMin));

    const [from, to, tt] = t < 0.5
        ? [SCORE_LOW, SCORE_MID, t * 2]
        : [SCORE_MID, SCORE_HIGH, (t - 0.5) * 2];
    const mix = (k: number) => Math.round(from[k] + (to[k] - from[k]) * tt);

    return {
        "--sc": `rgb(${mix(0)},${mix(1)},${mix(2)})`,
        "--g": (tg * SCORE.glowPeak).toFixed(3),
    };
}

const scoreCache: ScoreVars[] = [];

export function scoreVars(v: number): ScoreVars {
    const { colorMin: lo, glowMax: hi } = SCORE;
    const i = v <= lo ? 0 : v >= hi ? hi - lo : (v - lo + 0.5) | 0;
    return (scoreCache[i] ??= computeScoreVars(i + lo));
}

const localFormater = new Intl.NumberFormat("en-US");
export const bigIntFormat = (score: number) => localFormater.format(score);
export const lengthFormat = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;// sec to min:sec helper
export const ratioFormat = (ratio: number) => `${Math.round(ratio / 10) / 10}%`;
export const decimalFormat = (dec: number) => `${dec / 100}`;
