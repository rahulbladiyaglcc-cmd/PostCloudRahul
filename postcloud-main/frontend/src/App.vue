<template>
  <RouterView></RouterView>
  <GlobalSnackbar :error-msg="snackbar.message" :snackbar-actions="snackbar.customActions"
    :snackbar-show="snackbar.isOpen" :snackbar-status="snackbar.status" />
</template>

<script setup lang="ts">
import GlobalSnackbar from '@/components/shared/GlobalSnackbar.vue';
import { RouterView } from 'vue-router';
import { useSnackbarStore } from './stores/snackbar.store';
const snackbar = useSnackbarStore()
</script>
