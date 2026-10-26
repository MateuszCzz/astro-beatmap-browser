// sr to hex color
const SR_STOPS: [number, [number, number, number]][] = [
    [0.1, [0x42, 0x90, 0xfb]], [1.25, [0x4f, 0xc0, 0xff]], [2, [0x4f, 0xff, 0xd5]],
    [2.5, [0x7c, 0xff, 0x4f]], [3.3, [0xf6, 0xf0, 0x5c]], [4.2, [0xff, 0x80, 0x68]],
    [4.9, [0xff, 0x4e, 0x6f]], [5.8, [0xc6, 0x45, 0xb8]], [6.7, [0x65, 0x63, 0xde]],
    [7.7, [0x18, 0x15, 0x8e]], [9, [0, 0, 0]],
];

// cashe for color gens
// tiers have sr clustered together should save
// res on long list rendering
const srCache = new Map<number, string>();

export function srColour(sr100: number): string {
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
