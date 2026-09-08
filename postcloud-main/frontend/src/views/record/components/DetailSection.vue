<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
    id: string;
    title: string;
    icon: Component;
}>();
</script>

<template>
    <v-card :id="id" class="detail-section">
        <v-card-item class="detail-section__header">
            <div class="d-flex align-center justify-space-between ga-3">
                <div class="d-flex align-center ga-2">
                    <v-avatar color="lightsecondary" size="30">
                        <component :is="icon" class="text-secondary" size="17" />
                    </v-avatar>
                    <v-card-title class="detail-section__title pa-0">{{ title }}</v-card-title>
                </div>
                <slot name="action" />
            </div>
        </v-card-item>
        <v-divider />
        <v-card-text class="detail-section__content">
            <slot />
        </v-card-text>
    </v-card>
</template>

<style scoped>
.detail-section {
    scroll-margin-top: 112px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    box-shadow: 0 2px 10px rgba(31, 41, 55, 0.04);
}

.detail-section__header {
    min-height: 48px;
    padding: 8px 14px;
}

.detail-section__title {
    font-size: 0.86rem;
    font-weight: 600;
}

.detail-section__content {
    padding: 12px 14px;
}
</style>
