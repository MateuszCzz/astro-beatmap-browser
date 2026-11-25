<script setup lang="ts" generic="T extends string | number">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    useId,
    useSlots,
    watch,
} from "vue";
import { useDynamicList } from "../composables/useDynamicList";

const props = withDefaults(
    defineProps<{
        options: { id: T; label: string }[];
        label?: string;
        resolveLabel?: (id: T) => string;
    }>(),
    { label: "" },
);

const model = defineModel<T[]>({ required: true });
const emit = defineEmits<{ open: []; clear: [] }>();
const slots = useSlots();

const uid = useId();
const listId = `${uid}-list`;
const optionId = (i: number) => `${uid}-opt-${i}`;

const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const searchEl = ref<HTMLInputElement>();
const list = ref<HTMLElement>();
const open = ref(false);
const active = ref(0);
const query = ref("");
const pinned = shallowRef(new Set<T>());

const norm = (s: string) => s.normalize("NFKC").toLowerCase();

const chosen = computed(() => new Set(model.value));
const byId = computed(
    () => new Map(props.options.map((o) => [o.id, o.label] as const)),
);

const selected = computed(() =>
    model.value.map((id) => ({
        id,
        label: byId.value.get(id) ?? props.resolveLabel?.(id) ?? "",
    })),
);

const MAX_CHIPS = 2;
const shown = computed(() => selected.value.slice(0, MAX_CHIPS));

const index = computed(() =>
    props.options.map((o) => ({ o, key: norm(o.label) })),
);
const matches = computed(() => {
    const terms = norm(query.value).split(/\s+/).filter(Boolean);
    if (!terms.length) {
        if (!pinned.value.size) return props.options;
        const first: typeof props.options = [];
        const rest: typeof props.options = [];
        for (const o of props.options)
            (pinned.value.has(o.id) ? first : rest).push(o);
        return first.length ? [...first, ...rest] : props.options;
    }
    return index.value
        .filter(({ key }) => terms.every((t) => key.includes(t)))
        .map(({ o }) => o);
});

const status = computed(() => {
    if (!props.options.length) return "No options";
    if (!matches.value.length) return "No matches";
    return `${matches.value.length.toLocaleString()} options`;
});

// render one group of matches; sentinel row at the bottom loads next
const { visible, hasMore, sentinel } = useDynamicList(matches, {
    pageSize: 50,
    resetOn: [query, open],
});

function openList() {
    query.value = "";
    pinned.value = new Set(model.value);
    active.value = 0;
    open.value = true;
    emit("open");
    nextTick(() => searchEl.value?.focus({ preventScroll: true }));
}
function closeList() {
    open.value = false;
}
function toggle(id: T) {
    model.value = chosen.value.has(id)
        ? model.value.filter((v) => v !== id)
        : [...model.value, id];
}
function clear() {
    model.value = [];
    emit("clear");
    closeList();
    trigger.value?.focus();
}

// clicks inside dont pull focus off the search
function keepFocus(e: MouseEvent) {
    if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
}

function go(i: number) {
    active.value = i;
    nextTick(() =>
        list.value?.children[i]?.scrollIntoView({ block: "nearest" }),
    );
}

function onKeydown(e: KeyboardEvent) {
    if (!open.value) {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            openList();
        }
        return;
    }
    const last = Math.max(visible.value.length - 1, 0);
    if (e.key === "ArrowDown") {
        if (active.value === last && hasMore.value)
            sentinel.value?.scrollIntoView({ block: "nearest" });
        go(Math.min(active.value + 1, last));
    } else if (e.key === "ArrowUp") {
        go(Math.max(active.value - 1, 0));
    } else if (e.key === "Enter") {
        const o = visible.value[active.value];
        if (o) toggle(o.id);
    } else if (e.key === "Escape") {
        closeList();
        trigger.value?.focus();
    } else if (e.key === "Tab") {
        if (e.shiftKey || !slots.footer) closeList();
        return;
    } else return;
    e.preventDefault();
}

// footer Esc and Tab
function onFooterKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        e.preventDefault();
        closeList();
        trigger.value?.focus();
    } else if (e.key === "Tab" && !e.shiftKey) closeList();
}

watch(query, () => (active.value = 0));

// click outside closes
function onPointerDown(e: PointerEvent) {
    if (open.value && !root.value?.contains(e.target as Node)) closeList();
}
onMounted(() => document.addEventListener("pointerdown", onPointerDown));
onBeforeUnmount(() =>
    document.removeEventListener("pointerdown", onPointerDown),
);
</script>

<template>
    <div ref="root" class="ms" :class="{ open, has: selected.length > 0 }">
        <div class="control">
            <button
                ref="trigger"
                type="button"
                class="trigger"
                aria-haspopup="listbox"
                :aria-expanded="open"
                :aria-controls="open ? listId : undefined"
                @click="open ? closeList() : openList()"
                @keydown="onKeydown"
            >
                <span class="value">
                    <template v-if="!selected.length">
                        <span v-if="label" class="label">{{ label }}</span>
                        <span class="placeholder">Any</span>
                    </template>
                    <template v-else>
                        <span v-for="s in shown" :key="s.id" class="tag">{{
                            s.label
                        }}</span>
                        <span
                            v-if="selected.length > shown.length"
                            class="more more-wide"
                            >+{{ selected.length - shown.length }}</span
                        >
                        <span
                            v-if="selected.length > 1"
                            class="more more-narrow"
                            >+{{ selected.length - 1 }}</span
                        >
                        <span class="more more-all"
                            >+{{ selected.length }}</span
                        >
                    </template>
                </span>
                <svg class="ic chev" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            <button
                v-if="selected.length"
                type="button"
                class="clear"
                :aria-label="`Clear ${label || 'selection'}`"
                @click="clear"
            >
                <svg class="ic" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                </svg>
            </button>
        </div>

        <div v-if="open" class="panel" @mousedown="keepFocus">
            <input
                ref="searchEl"
                v-model="query"
                type="text"
                class="q"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                :aria-controls="listId"
                :aria-activedescendant="
                    visible.length ? optionId(active) : undefined
                "
                :aria-label="`Search ${label || 'options'}`"
                placeholder="Search…"
                autocomplete="off"
                spellcheck="false"
                @keydown="onKeydown"
            />
            <div class="sr-only" role="status">{{ status }}</div>

            <ul
                :id="listId"
                ref="list"
                class="list"
                role="listbox"
                aria-multiselectable="true"
            >
                <li
                    v-for="(o, i) in visible"
                    :id="optionId(i)"
                    :key="o.id"
                    role="option"
                    class="opt"
                    :class="{ sel: chosen.has(o.id), active: i === active }"
                    :aria-selected="chosen.has(o.id)"
                    @click="toggle(o.id)"
                    @pointermove="active = i"
                >
                    <span class="mark" aria-hidden="true">
                        <svg
                            v-if="chosen.has(o.id)"
                            class="ic"
                            viewBox="0 0 24 24"
                        >
                            <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                    </span>
                    <span class="opt-label">{{ o.label }}</span>
                </li>
                <li v-if="!options.length" class="empty" aria-hidden="true">
                    No options
                </li>
                <li
                    v-else-if="!matches.length"
                    class="empty"
                    aria-hidden="true"
                >
                    No matches
                </li>
                <li
                    v-else-if="hasMore"
                    ref="sentinel"
                    class="empty"
                    aria-hidden="true"
                >
                    Showing {{ visible.length.toLocaleString() }} of
                    {{ matches.length.toLocaleString() }}
                </li>
            </ul>

            <div v-if="slots.footer" class="footer" @keydown="onFooterKeydown">
                <slot name="footer" />
            </div>
        </div>
    </div>
</template>

<style scoped>
.ms {
    --_line: var(--line, var(--color-border));
    --chev: 0.875rem;
    --clear: 1.25rem;
    position: relative;
}

.control {
    container-type: inline-size;
    position: relative;
    display: flex;
    height: var(--control-h, 2.25rem);
    background: var(
        --field,
        color-mix(in srgb, var(--color-surface), var(--color-bg))
    );
    border: 1px solid var(--_line);
    border-radius: 0.625rem;
}
.ms.has .control,
.ms.open .control {
    border-color: var(--color-accent);
}
.control:has(.trigger:focus-visible) {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
}

.trigger {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    padding: 0 0.75rem;
    font: inherit;
    color: inherit;
    text-align: left;
    background: none;
    border: 0;
    cursor: pointer;
}
.trigger:focus-visible {
    outline: none;
}
.label {
    margin-right: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gray);
}
.value {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    overflow: hidden;
}
.ms.has .value {
    margin-right: calc(var(--clear) + 0.125rem);
}

.ms:not(.has) .value {
    display: block;
    text-overflow: ellipsis; /* Chromium/Safari */
    text-overflow: ".."; /* Firefox */
    white-space: nowrap;
}
.placeholder {
    color: var(--gray);
}
.tag {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.tag {
    max-width: 8rem;
    padding: 0.125rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--color-surface);
    border: 1px solid var(--_line);
    border-radius: 999px;
}
.more {
    flex: none;
    padding: 0 0.35rem;
    font-size: 0.6875rem;
    font-weight: 700;
    line-height: 1.25rem;
    color: var(--color-bg);
    background: var(--color-accent);
    border-radius: 999px;
}

/* fold chips per width */
.more-narrow,
.more-all {
    display: none;
}

@container (width < 12rem) {
    .tag:nth-child(2),
    .more-wide {
        display: none;
    }
    .more-narrow {
        display: block;
    }
}
@container (width < 9rem) {
    .tag,
    .more-narrow {
        display: none;
    }
    .more-all {
        display: block;
    }
}

.ic {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.9;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.chev {
    width: var(--chev);
    height: var(--chev);
    color: var(--gray);
}
.ms.open .chev {
    transform: rotate(180deg);
}

.clear {
    position: absolute;
    top: 50%;
    right: calc(0.75rem + var(--chev) + 0.25rem);
    display: grid;
    place-items: center;
    width: var(--clear);
    height: var(--clear);
    padding: 0;
    color: var(--gray);
    background: none;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    transform: translateY(-50%);
}

.clear::before {
    content: "";
    position: absolute;
    inset: -0.375rem;
}
.clear .ic {
    width: 0.75rem;
    height: 0.75rem;
}
.clear:hover {
    color: var(--color-text);
    background: color-mix(in srgb, var(--color-text) 12%, transparent);
}

.panel {
    position: absolute;
    top: calc(100% + 0.375rem);
    left: 0;
    z-index: 30;
    width: max(100%, 16rem);
    max-width: min(24rem, 90vw);
    padding: 0.25rem;
    background: var(--color-surface);
    border: 1px solid var(--_line);
    border-radius: 0.75rem;
    box-shadow:
        0 12px 32px rgb(0 0 0 / 0.28),
        0 2px 6px rgb(0 0 0 / 0.16);
}
.q {
    width: 100%;
    margin-bottom: 0.25rem;
    padding: 0.4rem 0.5rem;
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    border-bottom: 1px solid var(--_line);
    outline: none;
}
.q:focus {
    border-bottom-color: var(--color-accent);
}
.q::placeholder {
    color: var(--gray);
}

.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
}

.list {
    max-height: 16rem;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    list-style: none;
}
.opt {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    user-select: none;
}
.opt.active {
    background: color-mix(in srgb, var(--color-text) 8%, transparent);
}
.opt.sel {
    font-weight: 600;
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
}
.opt.sel.active {
    background: color-mix(in srgb, var(--color-accent) 18%, transparent);
}

.opt-label {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis; /* Chromium/Safari */
    text-overflow: ".."; /* Firefox */
}

.mark {
    display: grid;
    place-items: center;
    flex: none;
    width: 1rem;
    height: 1rem;
    color: var(--color-accent);
    border: 1px solid color-mix(in srgb, var(--color-text) 30%, var(--_line));
    border-radius: 0.25rem;
}
.mark .ic {
    width: 0.8rem;
    height: 0.8rem;
    stroke-width: 2.6;
}
.sel .mark {
    color: var(--color-bg);
    background: var(--color-accent);
    border-color: var(--color-accent);
}

.footer {
    margin-top: 0.25rem;
    padding: 0.5rem 0.5rem 0.375rem;
    border-top: 1px solid var(--_line);
}

.empty {
    padding: 0.5rem;
    font-size: 0.8125rem;
    color: var(--gray);
    text-align: center;
}
</style>
