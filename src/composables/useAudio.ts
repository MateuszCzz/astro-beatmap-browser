import {
    computed,
    inject,
    provide,
    ref,
    shallowRef,
    type InjectionKey,
} from "vue";

function createAudioPreview() {
    const audio = shallowRef<HTMLAudioElement | null>(null);
    const loadedId = ref<number | null>(null);
    const isPlaying = ref(false);
    const playingId = computed(() => (isPlaying.value ? loadedId.value : null));

    function toggle(mapsetId: number) {
        const a = audio.value;
        if (!a) return;

        // same id, start/stop
        if (loadedId.value === mapsetId) {
            if (a.paused) a.play().catch(() => { });
            else a.pause();
            return;
        }

        // diff id, switch
        loadedId.value = mapsetId;
        a.src = `https://b.ppy.sh/preview/${mapsetId}.mp3`;
        a.play().catch(() => {
            // loading failed
        });
    }

    // hides the bar; then audio after transition
    function close() {
        audio.value?.pause();
        loadedId.value = null;
        isPlaying.value = false;
    }

    return { audio, loadedId, isPlaying, playingId, toggle, close };
}

type AudioPreview = ReturnType<typeof createAudioPreview>;
const KEY: InjectionKey<AudioPreview> = Symbol("audio-preview");

export function provideAudioPreview() {
    const api = createAudioPreview();
    provide(KEY, api);
    return api;
}

export function useAudioPreview() {
    const api = inject(KEY);
    if (!api) {
        throw new Error(
            "useAudioPreview() needs provideAudioPreview() in an ancestor",
        );
    }
    return api;
}
