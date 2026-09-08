<template>
    <v-input :model-value="validationValue" :rules="rules" hide-details="auto">
        <div class="w-100">
            <VFileUpload v-model="files" :accept="accept" :disabled="loading" clearable show-size
                density="compact" variant="outlined" class="file-upload"
                @update:model-value="handleFileChange">
                <template #icon>
                    <v-avatar color="grey-lighten-4" size="44">
                        <UploadIcon size="22" />
                    </v-avatar>
                </template>
                <template #title>
                    <div class="file-upload__copy">
                        <div class="text-subtitle-1 font-weight-medium">{{ label }}</div>
                        <div class="text-caption text-medium-emphasis">
                            Click to choose a file or drag and drop it here
                        </div>
                    </div>
                </template>
                <template #item="{ file, props: itemProps }">
                    <v-list-item class="file-upload__item" border rounded="lg">
                        <template #prepend>
                            <v-avatar color="grey-lighten-4" rounded="lg" size="52">
                                <v-img v-if="isImageFile(file.name)" :src="getSelectedFilePreview(file)" cover />
                                <component :is="getFileIcon(file.name)" v-else size="22" />
                            </v-avatar>
                        </template>
                        <v-list-item-title class="font-weight-medium">{{ file.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ file.name }}</v-list-item-subtitle>
                        <template #append>
                            <v-btn icon="$clear" variant="text" size="small" aria-label="Remove selected file"
                                @click="itemProps['onClick:remove']" />
                        </template>
                    </v-list-item>
                </template>
            </VFileUpload>

            <v-list-item v-if="existingFileUrl && !files.length" class="file-upload__item file-upload__existing mt-3"
                border rounded="lg">
                <template #prepend>
                    <v-avatar color="grey-lighten-4" rounded="lg" size="52">
                        <AuthorizedImage v-if="isImageFile(displayedExistingFileName)" :src="existingFileUrl"
                            alt="Uploaded image" />
                        <component :is="getFileIcon(displayedExistingFileName)" v-else size="22" />
                    </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">{{ displayedExistingFileName }}</v-list-item-title>
                <v-list-item-subtitle>{{ displayedExistingFileName }}</v-list-item-subtitle>
                <template #append>
                    <v-btn icon="$clear" variant="text" size="small" aria-label="Remove uploaded file"
                        @click="clearExistingFile" />
                </template>
            </v-list-item>

            <v-progress-linear v-if="loading" indeterminate color="grey-darken-1" class="mt-2" />
        </div>
    </v-input>
</template>

<script lang="ts" setup>
import { useFileStore } from '@/stores/file.store';
import type { Component } from 'vue';
import { computed, defineEmits, defineProps, onBeforeUnmount, ref } from 'vue';
import {
    FileIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    FileZipIcon,
    PdfIcon,
    PresentationIcon,
    TxtIcon,
    UploadIcon,
} from 'vue-tabler-icons';
import { VFileUpload } from 'vuetify/labs/VFileUpload';
import AuthorizedImage from '@/components/shared/AuthorizedImage.vue';

const props = defineProps({
    rules: {
        type: Array as () => ((value: any) => boolean | string)[],
        default: () => [],
    },
    label: {
        type: String,
        default: 'Upload File',
    },
    accept: {
        type: String,
        default: '*/*',
    },
    existingFileUrl: {
        type: String,
        default: '',
    },
    existingFileName: {
        type: String,
        default: '',
    },
    uploadPath: {
        type: String,
        required: true,
    },
});
const fileStore = useFileStore();
const emit = defineEmits<{
    (event: 'uploaded', url: string, fileName: string): void;
    (event: 'cleared'): void;
}>();

const files = ref<File[]>([]);
const loading = ref(false);
const selectedFilePreviewUrls = new Map<File, string>();
const validationValue = computed(() => files.value.length ? files.value : props.existingFileUrl);
const displayedExistingFileName = computed(() => {
    if (props.existingFileName) return props.existingFileName;
    const fileName = decodeURIComponent(props.existingFileUrl.split('?')[0].split('/').pop() || 'Uploaded file');
    return fileName.replace(/^\d+-/, '');
});

const handleFileChange = (selectedFiles: File[]) => {
    files.value = selectedFiles;
    if (files.value.length) {
        uploadFile();
    } else {
        emit('cleared');
    }
};

const clearExistingFile = () => emit('cleared');

const isImageFile = (fileName: string) => /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName.split('?')[0]);
const getFileExtension = (fileName: string) => fileName.split('?')[0].split('.').pop()?.toLowerCase() || '';
const fileIcons: Record<string, Component> = {
    pdf: PdfIcon,
    xls: FileSpreadsheetIcon,
    xlsx: FileSpreadsheetIcon,
    csv: FileSpreadsheetIcon,
    ods: FileSpreadsheetIcon,
    doc: FileTextIcon,
    docx: FileTextIcon,
    odt: FileTextIcon,
    txt: TxtIcon,
    rtf: TxtIcon,
    ppt: PresentationIcon,
    pptx: PresentationIcon,
    odp: PresentationIcon,
    zip: FileZipIcon,
    rar: FileZipIcon,
    '7z': FileZipIcon,
    tar: FileZipIcon,
    gz: FileZipIcon,
};
const getFileIcon = (fileName: string) => fileIcons[getFileExtension(fileName)] || FileIcon;

const getAssetUrl = (fileUrl: string) => {
    if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) return fileUrl;

    const assetBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    try {
        const url = new URL(fileUrl, window.location.origin);
        return `${assetBaseUrl}/${url.pathname.split('/').pop()}`;
    } catch {
        return `${assetBaseUrl}/${fileUrl.split('/').pop()}`;
    }
};

const getSelectedFilePreview = (file: File) => {
    const existingPreview = selectedFilePreviewUrls.get(file);
    if (existingPreview) return existingPreview;

    const previewUrl = URL.createObjectURL(file);
    selectedFilePreviewUrls.set(file, previewUrl);
    return previewUrl;
};

onBeforeUnmount(() => {
    selectedFilePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
});

const uploadFile = async () => {
    const file = files.value[0];
    if (!file) return;

    loading.value = true;
    const formData = new FormData();
    formData.append('file', file);

    try {

        await fileStore.uploadFile(formData, props.uploadPath);
        const fileUrl = fileStore.fileUrl;
        emit('uploaded', fileUrl, file.name);
    } catch (error) {
        console.error('Upload failed:', error);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.file-upload {
    min-height: 104px;
    padding: 20px 24px;
    background: rgba(var(--v-theme-on-surface), 0.02);
    border-color: rgba(var(--v-border-color), 0.3);
    border-radius: 12px;
    transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.file-upload:hover {
    background: rgba(var(--v-theme-on-surface), 0.035);
    border-color: rgba(var(--v-theme-on-surface), 0.35);
}

.file-upload:focus-within {
    border-color: rgba(var(--v-theme-on-surface), 0.5);
    box-shadow: 0 0 0 3px rgba(var(--v-theme-on-surface), 0.06);
}

.file-upload__copy {
    text-align: left;
}

:deep(.v-file-upload-icon) {
    margin: 0;
    opacity: 1;
}

:deep(.v-file-upload-items) {
    margin: 10px 0 0;
}

.file-upload__item {
    background: rgb(var(--v-theme-surface));
    border-color: rgba(var(--v-border-color), 0.2);
}

.file-upload__existing {
    min-height: 72px;
}

@media (max-width: 600px) {
    .file-upload {
        min-height: 96px;
        padding: 16px;
    }
}
</style>
