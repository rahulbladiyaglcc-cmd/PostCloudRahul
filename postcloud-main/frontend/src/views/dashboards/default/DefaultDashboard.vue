<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
    UploadIcon,
    PlusIcon,
    ListIcon,
    SearchIcon,
    UsersIcon,
    HomeIcon,
    IdIcon,
    CircleCheckIcon,
    FileTextIcon,
    MapPinIcon,
    EyeIcon,
    ArrowRightIcon
} from 'vue-tabler-icons';
import votersDatabase from '@/voters_database.json';
import BulkUploadModal from '@/views/record/components/BulkUploadModal.vue';
import ViewComponent from '@/views/record/components/ViewComponent.vue';
import type { RecordDetail } from '@/interfaces/record.interface';
import { matchesSearch } from '@/utils/searchHelper';
import { getStoredVoters } from '@/utils/voterStorage';


const router = useRouter();
const bulkUploadDialog = ref(false);
const viewDialog = ref(false);
const selectedRecord = ref<RecordDetail | null>(null);
const searchQuery = ref('');
const allVoters = ref<RecordDetail[]>(getStoredVoters());
const currentPage = ref(1);
const itemsPerPage = 10;

const selectedWardPart = ref<string>('ALL');
const selectedGender = ref<'ALL' | 'Male' | 'Female'>('ALL');

const wardPartOptions = computed(() => {
    const totalVotersCount = allVoters.value.length;
    const options = [
        { title: `सभी भाग / All Parts (${totalVotersCount} मतदाता)`, value: 'ALL' }
    ];

    const partsMap = new Map<string, { title: string, count: number }>();
    allVoters.value.forEach((v: any) => {
        let key = 'ALL';
        let title = '';
        if (v.partNumber && v.wardPart) {
            key = `91_${v.partNumber}`;
            title = v.wardPart;
        } else if (v.wardPart) {
            key = v.wardPart;
            title = v.wardPart;
        }

        if (key !== 'ALL') {
            if (!partsMap.has(key)) {
                partsMap.set(key, { title, count: 1 });
            } else {
                partsMap.get(key)!.count++;
            }
        }
    });

    partsMap.forEach((data, value) => {
        options.push({ title: `${data.title} - ${data.count} मतदाता`, value });
    });

    return options;
});

const genderOptions = [
    { title: 'सभी लिंग (All)', value: 'ALL' },
    { title: 'पुरुष (Male)', value: 'Male' },
    { title: 'महिला (Female)', value: 'Female' }
];

const activeAreaInfo = computed(() => {
    if (selectedWardPart.value === 'ALL') {
        return {
            wardText: 'समस्त भाग',
            areaTitle: 'संपूर्ण निर्वाचक नामावली (वार्ड 91)',
            areaSubtitle: `कुल ${allVoters.value.length} मतदाता`
        };
    }

    const selectedOption = wardPartOptions.value.find(o => o.value === selectedWardPart.value);
    const titleMatch = selectedOption ? selectedOption.title.split(' - ')[0] : 'निर्वाचक नामावली';

    return {
        wardText: `भाग: ${selectedWardPart.value.replace('91_', '')}`,
        areaTitle: titleMatch,
        areaSubtitle: 'चयनित मतदाता सूची'
    };
});

const loadVoters = () => {
    allVoters.value = getStoredVoters();
};

const onVotersUpdated = (e: any) => {
    if (e.detail?.partKey) {
        selectedWardPart.value = e.detail.partKey;
    }
    loadVoters();
    currentPage.value = 1;
};

onMounted(() => {
    loadVoters();
    window.addEventListener('voters-updated', onVotersUpdated);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'upload' || urlParams.get('upload') === 'true') {
        bulkUploadDialog.value = true;
    }
});

onUnmounted(() => {
    window.removeEventListener('voters-updated', onVotersUpdated);
});

watch(selectedWardPart, (newVal) => {
    localStorage.setItem('selected_ward_part', newVal);
    currentPage.value = 1;
});

const partFilteredVoters = computed(() => {
    let list = allVoters.value;
    if (!selectedWardPart.value || selectedWardPart.value === 'ALL') {
        return list;
    }
    const partNum = selectedWardPart.value.includes('_') ? selectedWardPart.value.split('_')[1] : selectedWardPart.value;
    return list.filter(v => 
        String((v as any).partNumber) === String(partNum) || 
        String((v as any).wardPart || '').includes(`भाग ${partNum}`) ||
        String((v as any).wardPart || '') === selectedWardPart.value
    );
});


const totalCount = computed(() => partFilteredVoters.value.length);
const maleCount = computed(() => partFilteredVoters.value.filter(v => v.gender === 'Male').length);
const femaleCount = computed(() => partFilteredVoters.value.filter(v => v.gender === 'Female').length);

const filteredVoters = computed(() => {
    let list = partFilteredVoters.value;

    if (selectedGender.value !== 'ALL') {
        list = list.filter(v => v.gender === selectedGender.value);
    }

    if (searchQuery.value && searchQuery.value.trim()) {
        list = list.filter(v => matchesSearch(v, searchQuery.value));
    }

    return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredVoters.value.length / itemsPerPage)));

const displayedVoters = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredVoters.value.slice(start, start + itemsPerPage);
});

const openView = (record: RecordDetail) => {
    selectedRecord.value = { ...record };
    viewDialog.value = true;
};

const goToCreateRecord = () => {
    router.push('/create/record');
};

const goToAllRecords = () => {
    router.push('/list/record');
};

const onImported = () => {
    loadVoters();
    currentPage.value = 1;
};

const goToEditRecord = () => {
    if (selectedRecord.value?.id) {
        viewDialog.value = false;
        router.push(`/edit/record/${selectedRecord.value.id}`);
    }
};
</script>

<template>
    <div class="dashboard-container">
        <!-- Top Action Hero Card -->
        <v-card class="mb-5 hero-banner text-white rounded-xl elevation-3 pa-6" color="primary">
            <v-row align="center">
                <v-col cols="12" md="7">
                    <div class="d-flex flex-wrap align-center ga-2 mb-2">
                        <v-chip color="secondary" size="small" variant="flat" class="font-weight-bold">
                            {{ activeAreaInfo.wardText }}
                        </v-chip>
                        <v-chip color="white" size="small" variant="outlined">
                            जयपुर नगर निगम
                        </v-chip>
                    </div>
                    <h2 class="text-h4 font-weight-black mb-2">
                        मतदाता रिकॉर्ड्स व निर्वाचन प्रबंधन
                    </h2>
                    <p class="text-body-1 text-lightText mb-4 opacity-90">
                        {{ activeAreaInfo.areaTitle }} — {{ activeAreaInfo.areaSubtitle }}
                    </p>
                    <div class="d-flex flex-wrap ga-3">
                        <v-btn
                            color="secondary"
                            variant="flat"
                            size="large"
                            rounded="pill"
                            @click="bulkUploadDialog = true"
                        >
                            <UploadIcon size="20" class="mr-2" />
                            Upload PDF / Bulk Import
                        </v-btn>

                        <v-btn
                            color="white"
                            variant="flat"
                            size="large"
                            rounded="pill"
                            class="text-primary font-weight-bold"
                            to="/create/record"
                            @click="goToCreateRecord"
                        >
                            <PlusIcon size="20" class="mr-2" />
                            Create New Record (नया रिकॉर्ड)
                        </v-btn>

                        <v-btn
                            color="white"
                            variant="outlined"
                            size="large"
                            rounded="pill"
                            to="/list/record"
                            @click="goToAllRecords"
                        >
                            <ListIcon size="20" class="mr-2" />
                            View All (सभी रिकॉर्ड्स)
                        </v-btn>
                    </div>
                </v-col>
                <v-col cols="12" md="5" class="d-none d-md-flex justify-end">
                    <div class="hero-stats-panel pa-4 rounded-lg bg-white text-dark text-center elevation-2" style="min-width: 260px;">
                        <div class="text-caption font-weight-bold text-medium-emphasis">वर्तमान भाग निर्वाचक नामावली</div>
                        <div class="text-h3 font-weight-black text-primary my-1">{{ totalCount }}</div>
                        <div class="text-caption text-success font-weight-medium">
                            <CircleCheckIcon size="14" class="mr-1" />
                            100% वेरिफाइड रिकॉर्ड्स (Completed)
                        </div>
                        <v-divider class="my-3" />
                        <div class="d-flex justify-space-around">
                            <div>
                                <div class="text-caption text-medium-emphasis">पुरुष</div>
                                <div class="text-subtitle-1 font-weight-bold text-info">{{ maleCount }}</div>
                            </div>
                            <v-divider vertical />
                            <div>
                                <div class="text-caption text-medium-emphasis">महिला</div>
                                <div class="text-subtitle-1 font-weight-bold text-secondary">{{ femaleCount }}</div>
                            </div>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-card>

        <!-- KPI Cards Row -->
        <v-row class="mb-5">
            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-4 rounded-xl stat-card border elevation-1" color="surface">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-subtitle-2 font-weight-medium text-medium-emphasis">कुल मतदाता (Voters)</span>
                        <v-avatar color="lightprimary" size="42">
                            <UsersIcon size="22" class="text-primary" />
                        </v-avatar>
                    </div>
                    <div class="text-h4 font-weight-black text-primary">{{ totalCount }}</div>
                    <div class="text-caption text-success font-weight-medium mt-1">100% वेरिफाइड रिकॉर्ड्स</div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-4 rounded-xl stat-card border elevation-1" color="surface">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-subtitle-2 font-weight-medium text-medium-emphasis">पुरुष मतदाता (Male)</span>
                        <v-avatar color="lightinfo" size="42">
                            <UsersIcon size="22" class="text-info" />
                        </v-avatar>
                    </div>
                    <div class="text-h4 font-weight-black text-info">{{ maleCount }}</div>
                    <div class="text-caption text-medium-emphasis mt-1">
                        मतदाता प्रतिशत: {{ totalCount ? Math.round((maleCount / totalCount) * 100) : 0 }}%
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-4 rounded-xl stat-card border elevation-1" color="surface">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-subtitle-2 font-weight-medium text-medium-emphasis">महिला मतदाता (Female)</span>
                        <v-avatar color="lightsecondary" size="42">
                            <UsersIcon size="22" class="text-secondary" />
                        </v-avatar>
                    </div>
                    <div class="text-h4 font-weight-black text-secondary">{{ femaleCount }}</div>
                    <div class="text-caption text-medium-emphasis mt-1">
                        मतदाता प्रतिशत: {{ totalCount ? Math.round((femaleCount / totalCount) * 100) : 0 }}%
                    </div>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card class="pa-4 rounded-xl stat-card border elevation-1" color="surface">
                    <div class="d-flex align-center justify-space-between mb-2">
                        <span class="text-subtitle-2 font-weight-medium text-medium-emphasis">सक्रिय वार्ड व भाग</span>
                        <v-avatar color="lightsuccess" size="42">
                            <MapPinIcon size="22" class="text-success" />
                        </v-avatar>
                    </div>
                    <div class="text-h6 font-weight-bold text-success text-truncate">{{ activeAreaInfo.wardText }}</div>
                    <div class="text-caption text-medium-emphasis text-truncate mt-1">{{ activeAreaInfo.areaTitle }}</div>
                </v-card>
            </v-col>
        </v-row>

        <!-- Records Table Section -->
        <v-card class="pa-5 rounded-xl border elevation-2 mb-6">
            <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
                <div>
                    <h3 class="text-h5 font-weight-bold d-flex align-center ga-2">
                        <FileTextIcon size="24" class="text-primary" />
                        मतदाता सूची रिकॉर्ड्स (Voter Records)
                    </h3>
                    <p class="text-caption text-medium-emphasis mb-0">
                        {{ activeAreaInfo.areaTitle }} | {{ activeAreaInfo.wardText }}
                    </p>
                </div>

                <div class="d-flex align-center ga-2">
                    <v-btn color="primary" variant="flat" @click="bulkUploadDialog = true">
                        <UploadIcon size="18" class="mr-1" />
                        Upload PDF / थोक आयात
                    </v-btn>
                </div>
            </div>

            <!-- Filter Toolbar -->
            <div class="filter-toolbar mb-4 pa-3 bg-grey-lighten-4 rounded-lg border">
                <v-row dense align="center">
                    <!-- Ward & Part Filter -->
                    <v-col cols="12" md="5" sm="6">
                        <v-select
                            v-model="selectedWardPart"
                            :items="wardPartOptions"
                            item-title="title"
                            item-value="value"
                            density="compact"
                            variant="outlined"
                            label="वार्ड व भाग संख्या फ़िल्टर (Ward & Part)"
                            hide-details
                            bg-color="white"
                        />
                    </v-col>

                    <!-- Gender Filter -->
                    <v-col cols="12" md="3" sm="6">
                        <v-select
                            v-model="selectedGender"
                            :items="genderOptions"
                            item-title="title"
                            item-value="value"
                            density="compact"
                            variant="outlined"
                            label="लिंग फ़िल्टर (Gender)"
                            hide-details
                            bg-color="white"
                            @update:model-value="currentPage = 1"
                        />
                    </v-col>

                    <!-- Search Input -->
                    <v-col cols="12" md="4" sm="12">
                        <v-text-field
                            v-model="searchQuery"
                            density="compact"
                            variant="outlined"
                            placeholder="नाम (English / हिन्दी), EPIC, मकान से खोजें..."
                            hide-details
                            clearable
                            bg-color="white"
                            @update:model-value="currentPage = 1"
                        >
                            <template #prepend-inner>
                                <SearchIcon size="18" class="text-primary" />
                            </template>
                        </v-text-field>
                    </v-col>
                </v-row>

                <!-- Quick Filter Chips -->
                <div v-if="wardPartOptions.length > 1" class="d-flex flex-wrap align-center ga-2 mt-2 pt-2 border-t">
                    <span class="text-caption font-weight-bold text-medium-emphasis">त्वरित भाग चयन:</span>
                    <v-chip
                        v-for="opt in wardPartOptions"
                        :key="opt.value"
                        size="small"
                        :color="selectedWardPart === opt.value ? 'primary' : 'default'"
                        :variant="selectedWardPart === opt.value ? 'flat' : 'outlined'"
                        clickable
                        @click="selectedWardPart = opt.value"
                    >
                        {{ opt.title }}
                    </v-chip>
                </div>
            </div>

            <!-- Table -->
            <v-table hover density="comfortable" class="voter-table border rounded-lg">
                <thead>
                    <tr class="bg-grey-lighten-4">
                        <th class="font-weight-bold">क्र.सं.</th>
                        <th class="font-weight-bold">वार्ड / भाग</th>
                        <th class="font-weight-bold">मतदाता का नाम</th>
                        <th class="font-weight-bold">संबंधी का नाम (पिता/पति)</th>
                        <th class="font-weight-bold">मकान संख्या</th>
                        <th class="font-weight-bold">आयु / लिंग</th>
                        <th class="font-weight-bold">मतदाता पहचान (EPIC)</th>
                        <th class="font-weight-bold">स्थिति</th>
                        <th class="font-weight-bold text-center">विवरण</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in displayedVoters" :key="item.id">
                        <td>
                            <v-chip size="x-small" color="primary" variant="flat">
                                #{{ item.id }}
                            </v-chip>
                        </td>
                        <td>
                            <v-chip size="x-small" color="purple" variant="tonal" class="font-weight-bold">
                                भाग {{ (item as any).partNumber || '—' }}
                            </v-chip>
                        </td>
                        <td class="font-weight-bold text-subtitle-2">
                            <div>{{ item.firstName }} {{ item.lastName }}</div>
                            <div v-if="(item as any).englishName" class="text-caption text-medium-emphasis font-weight-regular">
                                {{ (item as any).englishName }}
                            </div>
                        </td>
                        <td class="text-body-2 text-medium-emphasis">
                            <div>{{ item.previousAddress ? item.previousAddress.replace('संबंधी:', '').trim() : '—' }}</div>
                            <div v-if="(item as any).englishRelative" class="text-caption text-disabled font-weight-regular">
                                {{ (item as any).englishRelative }}
                            </div>
                        </td>
                        <td>
                            <v-chip size="x-small" variant="outlined" color="primary">
                                मकान नं. {{ item.houseNumber }}
                            </v-chip>
                        </td>
                        <td>
                            <span class="font-weight-medium">{{ item.dateOfBirth ? (2026 - parseInt(item.dateOfBirth.slice(0, 4))) : '—' }} वर्ष</span>
                            <span class="text-caption text-medium-emphasis ml-1">({{ item.gender === 'Male' ? 'पुरुष' : 'स्त्री' }})</span>
                        </td>
                        <td>
                            <code class="px-2 py-1 bg-grey-lighten-3 rounded text-primary font-weight-bold">
                                {{ item.electionID }}
                            </code>
                        </td>
                        <td>
                            <v-chip size="x-small" color="success" variant="tonal" class="font-weight-bold">
                                COMPLETED
                            </v-chip>
                        </td>
                        <td class="text-center">
                            <v-btn
                                size="small"
                                color="secondary"
                                variant="outlined"
                                rounded="pill"
                                @click="openView(item)"
                            >
                                <EyeIcon size="16" class="mr-1" />
                                देखें
                            </v-btn>
                        </td>
                    </tr>
                    <tr v-if="displayedVoters.length === 0">
                        <td colspan="9" class="text-center pa-8 text-medium-emphasis">
                            <div class="d-flex flex-column align-center justify-center ga-2">
                                <v-avatar color="lightprimary" size="48">
                                    <FileTextIcon size="24" class="text-primary" />
                                </v-avatar>
                                <div class="text-subtitle-1 font-weight-bold">
                                    {{ allVoters.length === 0 ? 'आपके खाते में अभी कोई मतदाता रिकॉर्ड नहीं है' : 'कोई रिकॉर्ड नहीं मिला' }}
                                </div>
                                <div class="text-caption text-medium-emphasis mb-2">
                                    {{ allVoters.length === 0 ? 'कृपया अपनी निर्वाचक नामावली PDF अपलोड करने के लिए नीचे दिए गए बटन पर क्लिक करें।' : 'कृपया दूसरा नाम, EPIC या मकान संख्या डालकर खोजें।' }}
                                </div>
                                <v-btn v-if="allVoters.length === 0" color="primary" variant="flat" size="small" @click="bulkUploadDialog = true">
                                    <UploadIcon size="16" class="mr-1" />
                                    Upload PDF / थोक आयात करें
                                </v-btn>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>

            <!-- Table Pagination & Footer -->
            <div class="d-flex flex-wrap align-center justify-space-between mt-4">
                <div class="text-caption text-medium-emphasis">
                    कुल <strong>{{ filteredVoters.length }}</strong> में से 
                    {{ ((currentPage - 1) * itemsPerPage) + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredVoters.length) }} रिकॉर्ड्स प्रदर्शित
                </div>
                <div class="d-flex align-center ga-2">
                    <v-pagination
                        v-model="currentPage"
                        :length="totalPages"
                        :total-visible="5"
                        density="comfortable"
                        size="small"
                        rounded="circle"
                        color="primary"
                    />
                    <v-btn color="primary" variant="text" size="small" to="/list/record" @click="goToAllRecords">
                        सभी रिकॉर्ड्स देखें
                        <ArrowRightIcon size="16" class="ml-1" />
                    </v-btn>
                </div>
            </div>
        </v-card>

        <!-- Bulk Upload PDF Modal -->
        <BulkUploadModal v-model="bulkUploadDialog" @imported="onImported" />

        <!-- View Detail Dialog -->
        <v-dialog v-model="viewDialog" max-width="950px">
            <v-card v-if="selectedRecord" class="rounded-xl overflow-hidden" style="max-height: 90vh; overflow-y: auto;">
                <ViewComponent :form="selectedRecord" :can-edit="true" @close="viewDialog = false" @edit="goToEditRecord" />
            </v-card>
        </v-dialog>
    </div>
</template>

<style scoped>
.dashboard-container {
    padding: 8px 4px;
}

.hero-banner {
    background: linear-gradient(135deg, #5b36cc 0%, #7e57c2 50%, #4a2cb5 100%);
    box-shadow: 0 10px 30px rgba(91, 54, 204, 0.25) !important;
}

.hero-stats-panel {
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
}

.voter-table th {
    font-size: 0.85rem !important;
    white-space: nowrap;
}

.voter-table td {
    padding: 10px 16px !important;
}
</style>
