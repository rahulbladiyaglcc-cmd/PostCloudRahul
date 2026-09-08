<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { XIcon } from 'vue-tabler-icons';
import axiosInstance from '@/axiosInstance.interceptor';

const props = defineProps<{
    isVisible: boolean;
    file: string;
}>();

const emit = defineEmits<{
    'update:isVisible': [value: boolean];
}>();

const imageUrl = ref<string>();
const pdfUrl = ref<string>();
const fileContent = ref<string>();
const assetBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');

const dialogVisible = computed({
    get: () => props.isVisible,
    set: (value: boolean) => emit('update:isVisible', value),
});

const closeModal = () => {
    dialogVisible.value = false;
};

const getAssetUrl = (file: string) => {
    if (file.startsWith('blob:') || file.startsWith('data:')) return file;
    if (file.startsWith('/api/')) return file;

    try {
        const fileUrl = new URL(file, window.location.origin);
        return `${assetBaseUrl}/${fileUrl.pathname.split('/').pop()}`;
    } catch {
        return `${assetBaseUrl}/${file.split('/').pop()}`;
    }
};

let objectUrl = '';
const displayFile = async (file: string) => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = '';
    imageUrl.value = undefined;
    pdfUrl.value = undefined;
    fileContent.value = undefined;

    if (!file) return;

    let assetUrl = getAssetUrl(file);
    let responseType = '';
    if (file.startsWith('/api/')) {
        const response = await axiosInstance.get(file.replace(/^\/api/, ''), { responseType: 'blob' });
        objectUrl = URL.createObjectURL(response.data);
        assetUrl = objectUrl;
        responseType = response.data.type;
    }
    const fileType = responseType === 'application/pdf'
        ? 'pdf'
        : responseType.startsWith('image/')
            ? responseType.split('/')[1]
            : file.split('?')[0].split('.').pop()?.toLowerCase();
    if (['jpeg', 'jpg', 'png', 'webp'].includes(fileType || '')) {
        imageUrl.value = assetUrl;
    } else if (fileType === 'pdf') {
        pdfUrl.value = assetUrl;
    } else if (fileType === 'txt') {
        fileContent.value = `File URL: ${assetUrl}`;
    }
};

watch(() => props.file, displayFile, { immediate: true });
</script>

<template>
    <v-dialog v-model="dialogVisible" max-width="900px">
        <v-card>
            <v-card-title class="d-flex align-center">
                <span class="font-weight-bold">File Viewer</span>
                <v-spacer />
                <v-btn color="error" variant="text" @click.stop.prevent="closeModal">
                    <XIcon size="18" class="mr-1" />
                    Close
                </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text>
                <v-img v-if="imageUrl" :src="imageUrl" max-height="700" />
                <iframe v-else-if="pdfUrl" :src="pdfUrl" title="Document preview" width="100%" height="700"></iframe>
                <pre v-else-if="fileContent" class="modal-text">{{ fileContent }}</pre>
                <v-alert v-else type="warning" variant="tonal">This file type cannot be previewed.</v-alert>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.modal-text {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}
</style>
