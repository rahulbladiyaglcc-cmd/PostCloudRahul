<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import type { RecordDetail, RecordStatus } from '@/interfaces/record.interface';
import { useAuthStore } from '@/stores/auth';
import { useRecordStore } from '@/stores/record';
import { useSnackbarStore } from '@/stores/snackbar.store';
import ViewComponent from '@/views/record/components/ViewComponent.vue';
import AuthorizedImage from '@/components/shared/AuthorizedImage.vue';
import _ from "lodash";
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
    CalendarIcon,
    EditIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    PlusIcon,
    RefreshIcon,
    SearchIcon,
    TrashIcon,
    UploadIcon,
    UserIcon,
    IdIcon,
    ViewfinderIcon,
} from 'vue-tabler-icons';
import BulkUploadModal from './components/BulkUploadModal.vue';
import { getStoredVoters } from '@/utils/voterStorage';


const page = ref({ title: 'Records Overview' });
const breadcrumbs = shallowRef([
    { title: 'Records', disabled: false, href: '#' },
    { title: 'All Records', disabled: true, href: '#' }
]);


const dialog = ref(false);
const dialogDelete = ref(false);
const bulkUploadDialog = ref(false);
const editedIndex = ref<number>(-1);
const search = ref<string | undefined>(undefined);
const statusFilter = ref<RecordStatus | 'ALL'>('ALL');
const wardPartFilter = ref<string>(localStorage.getItem('selected_ward_part') || 'ALL');
const serverItem = ref<RecordDetail>();
const serverItems = ref<RecordDetail[]>();
const totalItems = ref(0);
const itemsPerPage = ref(10);
const currentPage = ref(1);
const loading = ref(false);
const reopeningRecordId = ref<string>();
const statusOptions = [
    { title: 'All', value: 'ALL' },
    { title: 'Draft', value: 'DRAFT' },
    { title: 'Completed', value: 'COMPLETED' },
];
const wardPartOptions = ref<{ title: string, value: string }[]>([]);

const refreshWardOptions = () => {
    const dynamicVoters = getStoredVoters();
    const totalVotersCount = dynamicVoters.length;
    const opts = [
        { title: `सभी भाग / All Parts (${totalVotersCount} मतदाता)`, value: 'ALL' }
    ];
    const partsMap = new Map<string, { title: string, count: number }>();
    dynamicVoters.forEach((v: any) => {
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
        opts.push({ title: `${data.title} - ${data.count} मतदाता`, value });
    });
    wardPartOptions.value = opts;
};
refreshWardOptions();

const router = useRouter();

const createRecord = () => {
    router.push('/create/record');
};


const recordStore = useRecordStore();
const authStore = useAuthStore();
const snackbar = useSnackbarStore()
const isAdminUser = authStore.user?.role === 'ADMIN';
const currentUserId = authStore.user?.id;
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / itemsPerPage.value)));
const firstVisibleRecord = computed(() => totalItems.value ? ((currentPage.value - 1) * itemsPerPage.value) + 1 : 0);
const lastVisibleRecord = computed(() => Math.min(currentPage.value * itemsPerPage.value, totalItems.value));

const closeDelete = () => {
    dialogDelete.value = false;
};

const debouncedLoadRecords = _.debounce(() => {
    if (currentPage.value === 1) {
        loadCurrentPage();
    } else {
        currentPage.value = 1;
    }
}, 300);

const deleteItem = (item: RecordDetail) => {
    if (serverItems.value) {
        editedIndex.value = serverItems.value.indexOf(item);
        dialogDelete.value = true;
    }
};

const deleteItemConfirm = async () => {
    if (serverItems.value) {
        const itemToDelete = serverItems.value[editedIndex.value];

        if (itemToDelete?.id) {
            try {
                await recordStore.remove(itemToDelete.id);
                closeDelete();
                if (serverItems.value.length === 1 && currentPage.value > 1) {
                    currentPage.value--;
                } else {
                    await loadCurrentPage();
                }
            } catch (error) {
                console.error("Failed to delete item remotely:", error);
                const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'An error occurred';
                snackbar.showSnackbar(errorMessage, 'error', []);
            }
        }
    }
};

const editItem = (item: RecordDetail) => {
    router.push({ name: 'Edit Record', params: { recordId: item.id } });
};

const editDialogItem = () => {
    if (!serverItem.value || !canEditRecord(serverItem.value)) return;
    dialog.value = false;
    editItem(serverItem.value);
};

const canEditRecord = (item: RecordDetail) => item.status !== 'COMPLETED';
const canDeleteRecord = (item: RecordDetail) => item.user?.id === currentUserId;
const canReopenRecord = (item: RecordDetail) => isAdminUser && item.status === 'COMPLETED';
const getEditHint = (item: RecordDetail) =>
    item.status === 'COMPLETED'
        ? 'Completed records are locked. Only admins can reopen them.'
        : 'Open this draft to continue editing.';
const getDeleteHint = (item: RecordDetail) =>
    canDeleteRecord(item)
        ? 'Delete your own record.'
        : 'You can only delete records you created.';
const getReopenHint = (item: RecordDetail) =>
    canReopenRecord(item)
        ? 'Reopen this completed record as a draft.'
        : 'Only admins can reopen completed records.';

const reopenItem = async (item: RecordDetail) => {
    if (!item.id) return;

    reopeningRecordId.value = item.id;
    try {
        const reopenedRecord = await recordStore.reopen(item.id);
        Object.assign(item, reopenedRecord);

        if (serverItem.value?.id === item.id) {
            Object.assign(serverItem.value, reopenedRecord);
        }

        if (statusFilter.value === 'COMPLETED') {
            await loadCurrentPage();
        }
        snackbar.showSnackbar('Record reopened successfully.', 'success', []);
    } catch (error) {
        console.error('Failed to reopen record:', error);
        const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unable to reopen record.';
        snackbar.showSnackbar(errorMessage, 'error', []);
    } finally {
        reopeningRecordId.value = undefined;
    }
};

const loadCurrentPage = async () => {
    loading.value = true;
    try {
        await recordStore.fetchAllRecords({
            page: currentPage.value,
            limit: itemsPerPage.value,
            search: search.value || '',
            status: statusFilter.value,
            wardPart: wardPartFilter.value
        });
        serverItems.value = recordStore.records.data;
        totalItems.value = recordStore.records.total;
    } finally {
        loading.value = false;
    }
};

const openDialog = (record: RecordDetail) => {
    serverItem.value = { ...record };
    dialog.value = true;
};

const formatStatus = (status?: string) => {
    if (!status) return '';
    return status
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const statusColor = (status?: string) => {
    if (status === 'DRAFT') return 'warning';
    if (status === 'COMPLETED') return 'success';
    return 'grey';
};

const getAddedBy = (item: RecordDetail) => {
    const firstName = item.user?.firstName?.trim() || '';
    const lastName = item.user?.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || item.user?.email || '-';
};

const getRecordName = (item: RecordDetail) =>
    [item.firstName, item.lastName].filter(Boolean).join(' ') || 'Unnamed record';

const getRecordInitials = (item: RecordDetail) =>
    [item.firstName, item.lastName]
        .filter(Boolean)
        .map((name) => name.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2) || 'R';

const getProfileImageUrl = (profileImage?: string) => {
    if (!profileImage) return '';
    if (profileImage.startsWith('blob:') || profileImage.startsWith('data:')) return profileImage;

    const assetBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    try {
        const profileImageUrl = new URL(profileImage, window.location.origin);
        return `${assetBaseUrl}/${profileImageUrl.pathname.split('/').pop()}`;
    } catch {
        return `${assetBaseUrl}/${profileImage.split('/').pop()}`;
    }
};

const getRecordLocation = (item: RecordDetail) =>
    [item.village, item.panchayat, item.district].filter(Boolean).join(', ') || 'Location not saved';

const formatEntryDate = (dateVal?: string | Date) => {
    if (!dateVal) return 'Date not saved';
    const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (Number.isNaN(date.getTime())) return 'Date not saved';
    return date.toLocaleDateString();
};


watch(
    () => dialogDelete.value,
    (val) => {
        if (!val) closeDelete();
    }
);

watch([search, statusFilter, wardPartFilter], () => {
    if (wardPartFilter.value) {
        localStorage.setItem('selected_ward_part', wardPartFilter.value);
    }
    debouncedLoadRecords();
});

watch(currentPage, loadCurrentPage);

watch(itemsPerPage, () => {
    if (currentPage.value === 1) {
        loadCurrentPage();
    } else {
        currentPage.value = 1;
    }
});

const onVotersUpdated = (e: any) => {
    refreshWardOptions();
    if (e.detail?.partKey) {
        wardPartFilter.value = e.detail.partKey;
    }
    loadCurrentPage();
};

onMounted(() => {
    refreshWardOptions();
    loadCurrentPage();
    window.addEventListener('voters-updated', onVotersUpdated);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'upload' || urlParams.get('upload') === 'true') {
        bulkUploadDialog.value = true;
    }
});

onUnmounted(() => {
    window.removeEventListener('voters-updated', onVotersUpdated);
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    
    <UiParentCard title="All Records">
        <div class="records-toolbar">
            <v-row class="records-toolbar-row align-center">
                <v-col cols="12" md="4" lg="3">
                    <v-text-field
                        menu-icon=""
                        label="खोजें (Search)"
                        placeholder="नाम (English/हिन्दी), EPIC..."
                        v-model="search"
                        variant="outlined"
                        hide-details
                    >
                        <template v-slot:prepend-inner>
                            <SearchIcon stroke-width="1.5" size="20" class="text-lightText SearchIcon" />
                        </template>
                    </v-text-field>
                </v-col>
                <v-col cols="12" md="4" lg="3">
                    <v-select
                        v-model="wardPartFilter"
                        :items="wardPartOptions"
                        label="वार्ड व भाग (Ward & Part)"
                        variant="outlined"
                        hide-details
                    />
                </v-col>
                <v-col cols="12" md="2" lg="2">
                    <v-select
                        v-model="statusFilter"
                        :items="statusOptions"
                        label="Status"
                        variant="outlined"
                        hide-details
                    />
                </v-col>
                <v-col cols="12" md="2" lg="4" class="d-flex justify-md-end ga-2 flex-wrap">
                    <v-btn color="primary" variant="outlined" @click="bulkUploadDialog = true">
                        <UploadIcon size="18" class="mr-1" />
                        Upload PDF
                    </v-btn>
                    <v-btn color="secondary" variant="flat" @click="createRecord">
                        <PlusIcon size="18" class="mr-1" />
                        Create
                    </v-btn>
                </v-col>

            </v-row>
        </div>

        <v-progress-linear v-if="loading" indeterminate color="secondary" class="mb-3" />

        <div v-if="serverItems?.length" class="records-card-list">
            <v-card v-for="item in serverItems" :key="item.id" class="record-card" variant="outlined">
                <div class="record-card__identity" @click="openDialog(item)">
                    <v-avatar color="lightsecondary" size="52">
                        <AuthorizedImage v-if="item.profileImage" :src="item.profileImage" alt="Profile image" />
                        <span v-else class="record-card__initials">{{ getRecordInitials(item) }}</span>
                    </v-avatar>
                    <div class="record-card__person">
                        <div class="d-flex flex-wrap align-center ga-2">
                            <div class="record-card__name">
                                {{ getRecordName(item) }}
                                <span v-if="(item as any).englishName" class="text-caption text-medium-emphasis ml-2">({{ (item as any).englishName }})</span>
                            </div>
                            <v-chip size="x-small" color="purple" variant="tonal" class="font-weight-bold" v-if="(item as any).partNumber">
                                भाग {{ (item as any).partNumber }}
                            </v-chip>
                            <v-chip size="x-small" variant="tonal" :color="statusColor(item.status)">
                                {{ formatStatus(item.status) }}
                            </v-chip>
                        </div>

                        <div class="record-card__id">
                            Record ID #{{ item.id || '—' }}
                            <span v-if="item.electionID" class="ml-2 font-weight-bold text-primary">| EPIC: {{ item.electionID }}</span>
                            <span v-if="item.houseNumber" class="ml-2">| मकान नं. {{ item.houseNumber }}</span>
                        </div>
                    </div>
                </div>

                <div class="record-card__details">
                    <div class="record-card__detail">
                        <MailIcon size="16" />
                        <span>{{ item.email || 'Email not saved' }}</span>
                    </div>
                    <div class="record-card__detail">
                        <PhoneIcon size="16" />
                        <span>{{ item.mobileNumber || 'Mobile not saved' }}</span>
                    </div>
                    <div class="record-card__detail record-card__detail--wide">
                        <MapPinIcon size="16" />
                        <span>{{ getRecordLocation(item) }}</span>
                    </div>
                    <div v-if="isAdminUser" class="record-card__detail">
                        <UserIcon size="16" />
                        <span>Added by {{ getAddedBy(item) }}</span>
                    </div>
                    <div class="record-card__detail">
                        <CalendarIcon size="16" />
                        <span>Entered {{ formatEntryDate(item.createdAt) }}</span>
                    </div>
                </div>

                <div class="record-card__actions">
                    <v-tooltip text="View record details">
                        <template #activator="{ props }">
                            <v-btn v-bind="props" variant="outlined" size="small" color="secondary" @click="openDialog(item)">
                                <ViewfinderIcon size="17" class="mr-1" />
                                View
                            </v-btn>
                        </template>
                    </v-tooltip>

                    <v-tooltip :text="getEditHint(item)">
                        <template #activator="{ props }">
                            <span v-bind="props">
                                <v-btn variant="outlined" size="small" color="secondary" @click="editItem(item)"
                                    :disabled="!canEditRecord(item)">
                                    <EditIcon size="17" />
                                </v-btn>
                            </span>
                        </template>
                    </v-tooltip>

                    <v-tooltip v-if="isAdminUser" :text="getReopenHint(item)">
                        <template #activator="{ props }">
                            <span v-bind="props">
                                <v-btn variant="outlined" size="small" color="primary" @click="reopenItem(item)"
                                    :loading="reopeningRecordId === item.id"
                                    :disabled="!canReopenRecord(item) || reopeningRecordId === item.id">
                                    <RefreshIcon size="17" />
                                </v-btn>
                            </span>
                        </template>
                    </v-tooltip>

                    <v-tooltip :text="getDeleteHint(item)">
                        <template #activator="{ props }">
                            <span v-bind="props">
                                <v-btn variant="outlined" size="small" color="error" @click="deleteItem(item)"
                                    :disabled="!canDeleteRecord(item)">
                                    <TrashIcon size="17" />
                                </v-btn>
                            </span>
                        </template>
                    </v-tooltip>
                </div>
            </v-card>
        </div>

        <div v-else-if="!loading" class="pa-8 text-center bg-grey-lighten-4 rounded-lg border my-4">
            <div class="text-subtitle-1 font-weight-bold mb-1">
                {{ totalItems === 0 ? 'आपके खाते में अभी कोई मतदाता रिकॉर्ड नहीं है' : 'कोई रिकॉर्ड नहीं मिला' }}
            </div>
            <div class="text-caption text-medium-emphasis mb-3">
                {{ totalItems === 0 ? 'कृपया अपनी निर्वाचक नामावली PDF अपलोड करने के लिए नीचे दिए गए बटन पर क्लिक करें।' : 'कृपया दूसरा नाम, EPIC या मकान संख्या डालकर खोजें।' }}
            </div>
            <v-btn v-if="totalItems === 0" color="primary" variant="flat" size="small" @click="bulkUploadDialog = true">
                <UploadIcon size="16" class="mr-1" />
                Upload PDF / थोक आयात करें
            </v-btn>
        </div>

        <div v-if="totalItems" class="records-pagination">
            <div class="records-pagination__summary">
                Showing {{ firstVisibleRecord }}–{{ lastVisibleRecord }} of {{ totalItems }} records
            </div>
            <v-pagination v-model="currentPage" :length="totalPages" :total-visible="5" color="secondary" />
            <v-select v-model="itemsPerPage" :items="[5, 10, 20, 50]" label="Per page" variant="outlined"
                density="compact" hide-details class="records-pagination__limit" />
        </div>
    </UiParentCard>

    <div class="text-center pa-4">
        <v-dialog v-model="dialog" max-width="950px">
            <v-card v-if="serverItem" class="rounded-xl overflow-hidden" style="max-height: 90vh; overflow-y: auto;">
                <ViewComponent
                    :form="serverItem"
                    :can-edit="canEditRecord(serverItem)"
                    @close="dialog = false"
                    @edit="editDialogItem"
                />
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogDelete" max-width="400px">
            <v-card>
                <v-card-title class="text-h5 text-center pa-3">Are you sure you want to delete this item?</v-card-title>
                <v-card-actions class="justify-center">
                    <v-btn variant="outlined" size="small" color="primary" @click="closeDelete"
                        class="ma-1">Cancel</v-btn>
                    <v-btn variant="outlined" size="small" color="error" @click="deleteItemConfirm"
                        class="ma-1">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Bulk Upload PDF & Electoral Roll Modal -->
        <BulkUploadModal v-model="bulkUploadDialog" @imported="loadCurrentPage" />
    </div>

</template>

<style scoped>
.records-toolbar-row {
    row-gap: 0;
}

.records-toolbar {
    margin-bottom: 18px;
}

.records-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.record-card {
    display: grid;
    grid-template-columns: minmax(210px, 0.9fr) minmax(320px, 1.7fr) auto;
    align-items: center;
    gap: 20px;
    padding: 16px 18px;
    border-color: rgba(var(--v-border-color), 0.14);
    border-radius: 14px;
    background: rgb(var(--v-theme-surface));
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.record-card:hover {
    border-color: rgba(var(--v-theme-secondary), 0.24);
    box-shadow: 0 8px 24px rgba(var(--v-theme-secondary), 0.08);
    transform: translateY(-1px);
}

.record-card__identity {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    cursor: pointer;
}

.record-card__initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: rgb(var(--v-theme-secondary));
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1;
}

.record-card__person {
    min-width: 0;
}

.record-card__name {
    overflow: hidden;
    color: rgb(var(--v-theme-darkText));
    font-size: 0.95rem;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.record-card__id {
    margin-top: 3px;
    color: rgb(var(--v-theme-secondary));
    font-size: 0.72rem;
    font-weight: 700;
}

.record-card__details {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px 18px;
    min-width: 0;
}

.record-card__detail {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    color: rgb(var(--v-theme-lightText));
    font-size: 0.75rem;
}

.record-card__detail svg {
    flex: 0 0 auto;
    color: rgb(var(--v-theme-secondary));
}

.record-card__detail span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.record-card__detail--wide {
    grid-column: span 2;
}

.record-card__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 7px;
    flex-wrap: nowrap;
}

.records-pagination {
    display: grid;
    grid-template-columns: 1fr auto 110px;
    align-items: center;
    gap: 16px;
    margin-top: 20px;
}

.records-pagination__summary {
    color: rgb(var(--v-theme-lightText));
    font-size: 0.75rem;
}

.records-pagination__limit {
    min-width: 110px;
}

.detail-dialog {
    overflow-y: auto;
}

@media (max-width: 1100px) {
    .record-card {
        grid-template-columns: minmax(210px, 0.9fr) minmax(280px, 1.3fr);
    }

    .record-card__actions {
        grid-column: 1 / -1;
        justify-content: flex-end;
        padding-top: 10px;
        border-top: 1px solid rgba(var(--v-border-color), 0.1);
    }
}

@media (max-width: 700px) {
    .record-card {
        grid-template-columns: 1fr;
        gap: 14px;
        padding: 14px;
    }

    .record-card__details {
        grid-template-columns: 1fr;
    }

    .record-card__detail--wide {
        grid-column: auto;
    }

    .record-card__actions {
        grid-column: auto;
        justify-content: flex-start;
        overflow-x: auto;
    }

    .records-pagination {
        grid-template-columns: 1fr;
        justify-items: center;
    }

    .records-pagination__limit {
        width: 120px;
    }
}
</style>
