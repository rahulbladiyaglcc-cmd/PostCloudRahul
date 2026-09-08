<script setup lang="ts">
import axiosInstance from '@/axiosInstance.interceptor';
import { onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{ src?: string; alt?: string }>();
const emit = defineEmits<{ error: [] }>();
const imageUrl = ref('');
let objectUrl = '';

const clearObjectUrl = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
};

const loadImage = async (src?: string) => {
    clearObjectUrl();
    imageUrl.value = '';
    if (!src) return;
    if (src.startsWith('blob:') || src.startsWith('data:') || !src.startsWith('/api/')) {
        imageUrl.value = src;
        return;
    }
    try {
        const response = await axiosInstance.get(src.replace(/^\/api/, ''), {
            responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(response.data);
        imageUrl.value = objectUrl;
    } catch {
        emit('error');
    }
};

watch(() => props.src, loadImage, { immediate: true });
onBeforeUnmount(clearObjectUrl);
</script>

<template>
    <img v-if="imageUrl" :src="imageUrl" :alt="alt || ''" />
</template>
