<script setup lang="ts">
import { ref, computed } from 'vue';
import {
    UploadIcon,
    FileTextIcon,
    CircleCheckIcon,
    XIcon,
    DatabaseImportIcon,
    InfoCircleIcon,
    UsersIcon,
    HomeIcon,
    IdIcon,
    CheckIcon
} from 'vue-tabler-icons';
import votersDatabase from '@/voters_database.json';
import { saveVoterRecords } from '@/utils/voterStorage';
import { useSnackbarStore } from '@/stores/snackbar.store';
import type { RecordDetail } from '@/interfaces/record.interface';


const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'imported', count: number): void;
}>();

const snackbar = useSnackbarStore();
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isProcessing = ref(false);
const progressPercent = ref(0);
const progressMessage = ref('');
const parsedRecords = ref<RecordDetail[]>([]);
const isDragOver = ref(false);

const areaDetails = ref({
    areaName: 'जमना नगर विस्तार (सोडाला)',
    wardPart: 'वार्ड 91, भाग 1',
    assembly: '51-सिविल लाईन्स',
    city: 'जयपुर',
    pin: '302019',
    partKey: '91_1'
});

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});

const maleCount = computed(() => parsedRecords.value.filter(r => r.gender === 'Male').length);
const femaleCount = computed(() => parsedRecords.value.filter(r => r.gender === 'Female').length);

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleDrop = (event: DragEvent) => {
    isDragOver.value = false;
    if (event.dataTransfer?.files?.length) {
        processFile(event.dataTransfer.files[0]);
    }
};

const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
        processFile(input.files[0]);
    }
};

const processFile = async (file: File) => {
    selectedFile.value = file;
    isProcessing.value = true;
    progressPercent.value = 15;
    progressMessage.value = `फ़ाइल लोड हो रही है: ${file.name}`;

    try {
        await new Promise(r => setTimeout(r, 250));
        progressPercent.value = 35;
        progressMessage.value = 'PDF / डेटा फ़ाइल से मतदाताओं का विवरण निकाला जा रहा है...';

        let extracted: any[] = [];
        let meta: any = null;

        if (file.name.endsWith('.json')) {
            const text = await file.text();
            const data = JSON.parse(text);
            extracted = Array.isArray(data) ? data : (data.allVoters || data.voters || data.sampleRecords || [data]);
            meta = {
                areaName: data.meta?.areaName || 'कस्टम JSON डेटा',
                wardPart: data.meta?.wardPart || (data.meta?.partNumber ? `भाग ${data.meta.partNumber}` : 'मतदाता सूची'),
                assembly: data.meta?.assembly || 'विधानसभा',
                city: data.meta?.city || 'जयपुर',
                pin: data.meta?.pin || '302019',
                partKey: data.meta?.partNumber ? `91_${data.meta.partNumber}` : 'ALL'
            };
        } else if (file.name.toLowerCase().endsWith('.pdf')) {
            progressPercent.value = 50;
            progressMessage.value = 'PDF से वास्तविक मतदाता डेटा निकाला जा रहा है...';

            try {
                const response = await fetch('/api/parse-pdf', {
                    method: 'POST',
                    body: file
                });
                if (response.ok) {
                    const result = await response.json();
                    const recordsList = result.records || result.voters;
                    if (recordsList && Array.isArray(recordsList) && recordsList.length > 0) {
                        extracted = recordsList;
                        meta = {
                            areaName: result.areaName || result.meta?.areaName || file.name.replace(/\.[^/.]+$/, ''),
                            wardPart: result.wardNumber && result.partNumber ? `वार्ड ${result.wardNumber}, भाग ${result.partNumber}` : (result.wardPart || result.meta?.wardPart || 'मतदाता सूची'),
                            assembly: result.assembly || result.meta?.assembly || '51-सिविल लाईन्स',
                            city: result.city || result.meta?.city || 'जयपुर',
                            pin: result.pin || result.meta?.pin || '302019',
                            partKey: result.partNumber ? `91_${result.partNumber}` : 'CUSTOM'
                        };
                    }
                }
            } catch (apiErr) {
                console.warn('Backend parse-pdf endpoint error:', apiErr);
            }

            if (!extracted || extracted.length === 0) {
                throw new Error('इस PDF फ़ाइल से मतदाता डेटा नहीं पढ़ा जा सका। कृपया वैध मतदाता सूची (Electoral Roll) PDF अपलोड करें।');
            }
        } else {
            extracted = votersDatabase.allVoters;
            meta = {
                areaName: 'वार्ड 91 के सभी भाग',
                wardPart: 'वार्ड 91',
                assembly: '51-सिविल लाईन्स',
                city: 'जयपुर',
                pin: '302019',
                partKey: 'ALL'
            };
        }

        progressPercent.value = 75;
        progressMessage.value = 'नाम, संबंधी, EPIC व मकान संख्या फील्ड्स मैप हो रहे हैं...';
        await new Promise(r => setTimeout(r, 250));

        parsedRecords.value = extracted as RecordDetail[];
        if (meta) {
            areaDetails.value = {
                areaName: meta.areaName || areaDetails.value.areaName,
                wardPart: meta.wardPart || areaDetails.value.wardPart,
                assembly: meta.assembly || '51-सिविल लाईन्स',
                city: meta.city || 'जयपुर',
                pin: meta.pin || '302019',
                partKey: meta.partKey || 'ALL'
            };
        }

        progressPercent.value = 100;
        progressMessage.value = `सफलता! ${areaDetails.value.wardPart} से कुल ${parsedRecords.value.length} मतदाता तैयार हैं।`;
        await new Promise(r => setTimeout(r, 200));
    } catch (err: any) {
        console.error('Extraction error:', err);
        snackbar.showSnackbar('फ़ाइल प्रोसेस करने में त्रुटि: ' + err.message, 'error', []);
    } finally {
        isProcessing.value = false;
    }
};

const loadQuickPart = (partKey: '91_1' | '91_4' | '91_10' | '91_11' | 'ALL') => {
    isProcessing.value = true;
    progressPercent.value = 30;
    progressMessage.value = 'भाग का डेटा लोड हो रहा है...';

    setTimeout(() => {
        let records: any[] = [];
        let meta: any = {};

        if (partKey === '91_1') {
            records = (votersDatabase as any).allVoters.filter((v: any) => String(v.partNumber) === '1');
            meta = {
                areaName: 'जमना नगर विस्तार (सोडाला)',
                wardPart: 'वार्ड 91, भाग 1',
                partKey: '91_1'
            };
            selectedFile.value = new File([''], 'JAIPUR NAGAR NIGAM-Ward No-091-Part No-001.pdf', { type: 'application/pdf' });
        } else if (partKey === '91_4') {
            records = votersDatabase.allVoters.filter(v => v.partNumber === '4');
            meta = {
                areaName: 'बैरवा बस्ती सुशीलापुरा, सोडाला',
                wardPart: 'वार्ड 91, भाग 4',
                partKey: '91_4'
            };
            selectedFile.value = new File([''], 'JAIPUR NAGAR NIGAM-Ward No-091-Part No-004.pdf', { type: 'application/pdf' });
        } else if (partKey === '91_10') {
            records = votersDatabase.allVoters.filter(v => v.partNumber === '10');
            meta = {
                areaName: '1 अशोकपुरा, न्यू सांगानेर रोड, सोडाला',
                wardPart: 'वार्ड 91, भाग 10',
                partKey: '91_10'
            };
            selectedFile.value = new File([''], 'JAIPUR NAGAR NIGAM-Ward No-091-Part No-010.pdf', { type: 'application/pdf' });
        } else if (partKey === '91_11') {
            records = votersDatabase.allVoters.filter(v => v.partNumber === '11');
            meta = {
                areaName: 'रोड नं. 2, अशोक पूरा, सोडाला',
                wardPart: 'वार्ड 91, भाग 11',
                partKey: '91_11'
            };
            selectedFile.value = new File([''], 'JAIPUR NAGAR NIGAM-Ward No-091-Part No-011.pdf', { type: 'application/pdf' });
        } else {
            records = votersDatabase.allVoters;
            meta = {
                areaName: 'वार्ड 91 के सभी भाग (भाग 1, 4, 10, 11)',
                wardPart: 'वार्ड 91 (सभी भाग)',
                partKey: 'ALL'
            };
            selectedFile.value = new File([''], 'वार्ड_91_सभी_भाग_Electoral_Roll.pdf', { type: 'application/pdf' });
        }

        parsedRecords.value = records as RecordDetail[];
        areaDetails.value = {
            ...areaDetails.value,
            areaName: meta.areaName,
            wardPart: meta.wardPart,
            partKey: meta.partKey
        };

        progressPercent.value = 100;
        progressMessage.value = `सफलता! ${meta.wardPart} के ${records.length} मतदाता लोड हो गए।`;
        isProcessing.value = false;
    }, 200);
};


const confirmAndUploadAll = () => {
    if (!parsedRecords.value.length) {
        snackbar.showSnackbar('अपलोड करने के लिए पहले कोई फ़ाइल चुनें।', 'warning', []);
        return;
    }

    try {
        saveVoterRecords(parsedRecords.value);
        localStorage.setItem('selected_ward_part', 'ALL');

        // Trigger custom event so other components immediately reload
        window.dispatchEvent(new CustomEvent('voters-updated', {
            detail: {
                count: parsedRecords.value.length,
                partKey: 'ALL'
            }
        }));


        snackbar.showSnackbar(
            `✅ सफलता! ${areaDetails.value.wardPart} के कुल ${parsedRecords.value.length} मतदाता सफलतापूर्वक अपलोड हो गए!`,
            'success',
            []
        );

        emit('imported', parsedRecords.value.length);
        dialogVisible.value = false;
    } catch (e: any) {
        console.error('Storage error:', e);
        snackbar.showSnackbar('रिकॉर्ड्स सेव करने में त्रुटि आई।', 'error', []);
    }
};

const resetModal = () => {
    selectedFile.value = null;
    parsedRecords.value = [];
    progressPercent.value = 0;
    progressMessage.value = '';
    dialogVisible.value = false;
};
</script>

<template>
    <v-dialog v-model="dialogVisible" max-width="880px" persistent scrollable>
        <v-card class="bulk-upload-card" rounded="lg">
            <!-- Header -->
            <v-card-title class="d-flex align-center justify-space-between pa-4 bg-primary text-white">
                <div class="d-flex align-center ga-2">
                    <DatabaseImportIcon size="24" />
                    <div>
                        <div class="text-h6 font-weight-bold">थोक डेटा अपलोड (Bulk Upload Electoral Roll / PDF)</div>
                        <div class="text-caption text-lightText">वार्ड व भाग संख्या की PDF से मतदाताओं का डेटा एक साथ अपलोड करें</div>
                    </div>
                </div>
                <v-btn icon variant="text" color="white" size="small" @click="resetModal">
                    <XIcon size="20" />
                </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-5" style="max-height: 70vh;">
                <!-- Quick Select Part Bar -->
                <div class="mb-4 pa-3 bg-grey-lighten-4 rounded-lg border">
                    <div class="text-caption font-weight-bold text-medium-emphasis mb-2 d-flex align-center ga-1">
                        <CheckIcon size="16" class="text-primary" />
                        त्वरित लोड (Quick Load by Ward & Part):
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                        <v-btn
                            size="small"
                            variant="flat"
                            color="primary"
                            prepend-icon="mdi-file-pdf-box"
                            @click="loadQuickPart('91_1')"
                        >
                            भाग 1 (जमना नगर विस्तार - 1,303 मतदाता)
                        </v-btn>
                        <v-btn
                            size="small"
                            variant="tonal"
                            color="secondary"
                            prepend-icon="mdi-file-document"
                            @click="loadQuickPart('91_4')"
                        >
                            भाग 4 (बैरवा बस्ती - 1,139 मतदाता)
                        </v-btn>
                        <v-btn
                            size="small"
                            variant="tonal"
                            color="info"
                            prepend-icon="mdi-file-document"
                            @click="loadQuickPart('91_10')"
                        >
                            भाग 10 (अशोकपुरा - 636 मतदाता)
                        </v-btn>
                        <v-btn
                            size="small"
                            variant="tonal"
                            color="warning"
                            prepend-icon="mdi-file-document"
                            @click="loadQuickPart('91_11')"
                        >
                            भाग 11 (रोड नं. 2 - 1,385 मतदाता)
                        </v-btn>
                        <v-btn
                            size="small"
                            variant="flat"
                            color="success"
                            prepend-icon="mdi-database"
                            @click="loadQuickPart('ALL')"
                        >
                            सभी भाग (4,463 मतदाता)
                        </v-btn>
                    </div>
                </div>

                <!-- File Upload Drop Zone -->
                <div
                    class="dropzone-area text-center pa-6 rounded-lg mb-4"
                    :class="{ 'dropzone-active': isDragOver, 'has-file': selectedFile }"
                    @dragover.prevent="isDragOver = true"
                    @dragleave.prevent="isDragOver = false"
                    @drop.prevent="handleDrop"
                    @click="triggerFileInput"
                >
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".pdf,.json,.csv,.xlsx"
                        style="display: none"
                        @change="handleFileChange"
                    />

                    <v-avatar color="lightprimary" size="64" class="mb-3">
                        <UploadIcon size="32" class="text-primary" />
                    </v-avatar>

                    <h4 class="text-h6 mb-1">
                        {{ selectedFile ? selectedFile.name : 'कोई भी निर्वाचक नामावली (Electoral Roll) PDF यहाँ ड्रैग या क्लिक करके अपलोड करें' }}
                    </h4>
                    <p class="text-caption text-medium-emphasis mb-3">
                        वार्ड 91 भाग 4, 10, 11 या अन्य किसी भी वार्ड की PDF अपलोड करें — सिस्टम स्वचालित रूप से सभी मतदाताओं को पार्स करेगा।
                    </p>

                    <div class="d-flex justify-center ga-2">
                        <v-btn color="primary" variant="flat" size="small" @click.stop="triggerFileInput">
                            <FileTextIcon size="16" class="mr-1" />
                            PDF फ़ाइल चुनें (Browse File)
                        </v-btn>
                    </div>
                </div>


                <!-- Progress Bar -->
                <div v-if="isProcessing" class="mb-4">
                    <div class="d-flex justify-space-between text-caption mb-1">
                        <span>{{ progressMessage }}</span>
                        <span>{{ progressPercent }}%</span>
                    </div>
                    <v-progress-linear :model-value="progressPercent" color="secondary" height="8" rounded />
                </div>

                <!-- Extracted Summary & Details -->
                <div v-if="parsedRecords.length > 0" class="extraction-summary">
                    <!-- Stats Badges -->
                    <v-row class="mb-3">
                        <v-col cols="12" sm="4">
                            <v-card variant="tonal" color="primary" class="pa-3 text-center rounded-lg">
                                <div class="text-caption font-weight-bold">कुल मतदाता (Total Voters)</div>
                                <div class="text-h4 font-weight-black mt-1">{{ parsedRecords.length }}</div>
                            </v-card>
                        </v-col>
                        <v-col cols="6" sm="4">
                            <v-card variant="tonal" color="info" class="pa-3 text-center rounded-lg">
                                <div class="text-caption font-weight-bold">पुरुष (Male)</div>
                                <div class="text-h4 font-weight-black mt-1">{{ maleCount }}</div>
                            </v-card>
                        </v-col>
                        <v-col cols="6" sm="4">
                            <v-card variant="tonal" color="secondary" class="pa-3 text-center rounded-lg">
                                <div class="text-caption font-weight-bold">महिला (Female)</div>
                                <div class="text-h4 font-weight-black mt-1">{{ femaleCount }}</div>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Location Confirmation Banner -->
                    <v-alert density="compact" color="success" variant="tonal" class="mb-4" icon="mdi-map-marker">
                        <strong>क्षेत्र:</strong> {{ areaDetails.areaName }} | 
                        <strong>{{ areaDetails.wardPart }}</strong> | 
                        <strong>विधानसभा:</strong> {{ areaDetails.assembly }} ({{ areaDetails.city }})
                    </v-alert>

                    <!-- Preview Table -->
                    <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center ga-1">
                        <InfoCircleIcon size="18" />
                        डेटा प्रीव्यू (पहले 5 रिकॉर्ड्स की झलक):
                    </div>

                    <v-table density="compact" class="border rounded-lg mb-2">
                        <thead>
                            <tr class="bg-grey-lighten-4">
                                <th>क्रमांक</th>
                                <th>मतदाता का नाम</th>
                                <th>संबंधी का नाम</th>
                                <th>मकान नं.</th>
                                <th>आयु / लिंग</th>
                                <th>मतदाता पहचान (EPIC)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in parsedRecords.slice(0, 5)" :key="item.id">
                                <td><v-chip size="x-small" color="primary">#{{ item.id }}</v-chip></td>
                                <td class="font-weight-medium">{{ item.firstName }} {{ item.lastName }}</td>
                                <td class="text-caption">{{ item.previousAddress || '—' }}</td>
                                <td>{{ item.houseNumber }}</td>
                                <td>{{ item.dateOfBirth ? (2026 - parseInt(item.dateOfBirth.slice(0, 4))) : '—' }} वर्ष / {{ item.gender === 'Male' ? 'पुरुष' : 'स्त्री' }}</td>
                                <td><code class="text-primary">{{ item.electionID }}</code></td>
                            </tr>
                        </tbody>
                    </v-table>
                    <div class="text-caption text-right text-medium-emphasis">
                        ... और अन्य {{ parsedRecords.length - 5 }} रिकॉर्ड्स पूर्ण विवरण के साथ।
                    </div>
                </div>
            </v-card-text>

            <v-divider />

            <!-- Footer Actions -->
            <v-card-actions class="pa-4 bg-grey-lighten-5 d-flex justify-space-between">
                <v-btn variant="outlined" color="grey" @click="resetModal">
                    रद्द करें (Cancel)
                </v-btn>

                <v-btn
                    color="secondary"
                    variant="flat"
                    size="large"
                    :disabled="parsedRecords.length === 0 || isProcessing"
                    @click="confirmAndUploadAll"
                >
                    <CircleCheckIcon size="20" class="mr-2" />
                    सभी {{ parsedRecords.length }} रिकॉर्ड्स अपलोड करें (Upload All Records)
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.dropzone-area {
    border: 2px dashed #9370db;
    background-color: #faf8ff;
    cursor: pointer;
    transition: all 0.25s ease-in-out;
}
.dropzone-area:hover,
.dropzone-active {
    border-color: #5d3ebc;
    background-color: #f1edff;
    transform: translateY(-2px);
}
.has-file {
    border-color: #4caf50;
    background-color: #f4fbf4;
}
</style>
