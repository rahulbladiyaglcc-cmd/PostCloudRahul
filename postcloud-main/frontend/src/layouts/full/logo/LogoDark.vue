<template>
  <div class="logo">
    <RouterLink to="/">
      <img :src="DefaultImage" alt="logo" style="max-height: 36px; width: auto; display: block;" />
    </RouterLink>
  </div>
</template>
<script setup lang="ts">
import { RouterLink } from 'vue-router';
import DefaultImage from '@/assets/images/logos/logo-pc.png';
</script>

