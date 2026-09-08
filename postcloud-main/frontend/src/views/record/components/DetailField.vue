<script setup lang="ts">
defineProps<{
    label: string;
    value?: string | number;
}>();
</script>

<template>
    <div class="detail-field">
        <div class="detail-field__label">{{ label }}</div>
        <div class="detail-field__value">{{ value || '—' }}</div>
    </div>
</template>

<style scoped>
.detail-field {
    min-width: 0;
    overflow-wrap: anywhere;
}

.detail-field__label {
    color: rgb(var(--v-theme-lightText));
    font-size: 0.68rem;
    line-height: 1rem;
}

.detail-field__value {
    color: rgb(var(--v-theme-darkText));
    font-size: 0.78rem;
    font-weight: 500;
    line-height: 1.15rem;
}
</style>
