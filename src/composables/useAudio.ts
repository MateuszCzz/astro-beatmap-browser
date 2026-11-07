import {
    computed,
    inject,
    onScopeDispose,
    provide,
    readonly,
    ref,
    shallowRef,
    watch,
    type InjectionKey,
} from "vue";

const CLOSE_DELAY_MS = 600;
const DEFAULT_VOLUME = 0.3;

export const previewUrl = (mapsetId: number) => `https://b.ppy.sh/preview/${mapsetId}.mp3`;

function createAudio() {
    const audio = shallowRef<HTMLAudioElement | null>(null);
    const loadedId = ref<number | null>(null);
    const isPlaying = ref(false);
    const hasError = ref(false);

    const isOpen = computed(() => loadedId.value !== null);
    const playingId = computed(() => (isPlaying.value ? loadedId.value : null));
    const failedId = computed(() => (hasError.value ? loadedId.value : null));

    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const cancelClose = () => clearTimeout(closeTimer);

    function toggle(mapsetId: number) {
        const a = audio.value;
        if (!a) return;
        cancelClose();

        // same id; start/stop
        if (loadedId.value === mapsetId && !hasError.value) {
            if (a.paused) void a.play().catch(() => { });
            else a.pause();
            return;
        }

        // diff id, switch
        hasError.value = false;
        loadedId.value = mapsetId;
        a.src = previewUrl(mapsetId);
        void a.play().catch(() => { });
    }

    // hides the bar; then audio after transition
    function close() {
        cancelClose();
        audio.value?.pause();
        loadedId.value = null;
        isPlaying.value = false;
    }

    // after bar is hidden drop src
    function release() {
        if (loadedId.value !== null) return;
        hasError.value = false;
        const a = audio.value;
        if (!a) return;
        a.removeAttribute("src");
        a.load();
    }

    watch(audio, (el, _old, onCleanup) => {
        if (!el) return;
        el.volume = DEFAULT_VOLUME;

        const ac = new AbortController();
        const on = (type: string, fn: () => void) =>
            el.addEventListener(type, fn, { signal: ac.signal });

        on("play", () => {
            isPlaying.value = true;
            cancelClose(); // something new started
        });
        on("pause", () => {
            isPlaying.value = false;
        });
        on("ended", () => {
            isPlaying.value = false;
            closeTimer = setTimeout(close, CLOSE_DELAY_MS);
        });
        on("error", () => {
            if (loadedId.value === null) return;
            isPlaying.value = false;
            hasError.value = true;
        });

        onCleanup(() => ac.abort());
    });

    onScopeDispose(() => {
        cancelClose();
        audio.value?.pause();
    });

    return {
        audio,
        isOpen,
        playingId,
        failedId,
        loadedId: readonly(loadedId),
        isPlaying: readonly(isPlaying),
        hasError: readonly(hasError),
        toggle,
        close,
        release,
    };
}

type Audio = ReturnType<typeof createAudio>;
const KEY: InjectionKey<Audio> = Symbol("audio-preview");

export function provideAudioPreview() {
    const api = createAudio();
    provide(KEY, api);
    return api;
}

export function useAudio() {
    const api = inject(KEY);
    if (!api) {
        throw new Error("useAudioPreview() needs provideAudioPreview() in a parent component");
    }
    return api;
}