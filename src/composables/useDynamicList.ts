import { computed, ref, watch, type Ref, type WatchSource } from "vue";

/**
 * Shows the first N items and grows N when the sentinel element nears the
 * viewport. `resetOn` sends N back to one page; the source growing does not.
 */
export function useDynamicList<T>(
    source: Readonly<Ref<readonly T[]>>,
    opts: { pageSize?: number; resetOn?: WatchSource[] } = {},
) {
    const pageSize = opts.pageSize ?? 50;
    const limit = ref(pageSize);
    const sentinel = ref<HTMLElement | null>(null);

    const visible = computed(() => source.value.slice(0, limit.value));
    const hasMore = computed(() => limit.value < source.value.length);

    if (opts.resetOn) watch(opts.resetOn, () => (limit.value = pageSize));

    // Re-created per page so it fires again if the sentinel is still in range.
    watch(
        [sentinel, limit],
        ([el], _old, onCleanup) => {
            if (!el) return;
            const io = new IntersectionObserver(
                (entries) => {
                    if (entries.some((e) => e.isIntersecting) && hasMore.value) limit.value += pageSize;
                },
                { rootMargin: "600px" },
            );
            io.observe(el);
            onCleanup(() => io.disconnect());
        },
        { flush: "post" },
    );

    return { visible, hasMore, sentinel };
}
