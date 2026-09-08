<script setup lang="ts">
import { useLoaderStore } from '@/stores/loader.store';
import { computed } from 'vue';

const loaderStore = useLoaderStore();
const isLoading = computed(() => loaderStore.isLoading);
</script>

<template>
  <v-progress-linear
    v-if="isLoading"
    indeterminate
    color="secondary"
    class="global-header-loader"
    height="3"
  />
</template>


<style scoped>
.global-header-loader {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 3000;
}
</style>
