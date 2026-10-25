<script setup lang="ts">

import MapRow from './MapRow.vue';

</script>

<template>
    <ol class="map-list">
        <!-- each result row v-for="r in rows" -->
        <MapRow " />

        <!-- info rows at bottom -->
        <li ref="end" class="map-list-end">
            <!-- quering db -->

            <!-- failed results -->

            <!-- empty results -->

            <!-- login before results -->

            <!-- no more results -->

        </li>
    </ol>
</template>