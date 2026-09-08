<script setup lang="ts">
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import axiosInstance from '@/axiosInstance.interceptor';
import DropdownButton from '@/components/shared/DropdownButton.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { useForm } from '@/composables/useForm';
import { useValidation } from '@/composables/useValidation';
import type { RecordDetail, RecordStatus } from '@/interfaces/record.interface';
import { useRecordStore } from '@/stores/record';
import { useSnackbarStore } from '@/stores/snackbar.store';
import FileUpload from '@/views/record/components/FileUpload.vue';
import FileViewer from '@/views/record/components/FileViewer.vue';
import ProfileImage from '@/views/record/components/ProfileImage.vue';
import ViewComponent from '@/views/record/components/ViewComponent.vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { BriefcaseIcon, CameraIcon, HeartIcon, HomeIcon, IdIcon, MapPinIcon, PhoneIcon, PlusIcon, ScanIcon, ShieldCheckIcon, TrashIcon, UserIcon, UsersIcon } from 'vue-tabler-icons';

const route = useRoute()
const loading = ref(false);
const snackbar = useSnackbarStore();
const router = useRouter()
const validationRules = useValidation();
const recordStore = useRecordStore();
const {
    stepOneInitialState,
    stepTwoInitialState,
    stepThreeInitialState,
    stepFourInitialState,
    stepFiveInitialState,
    stepSixInitialState
} = useForm();

const page = computed(() => ({
    title: stepper.edit ? 'Edit Record' : 'Create Record'
}));
const breadcrumbs = computed(() => ([
    { title: 'Records', disabled: false, href: '#' },
    { title: page.value.title, disabled: true, href: '#' }
]));
const stepper = reactive({
    step: 1,
    edit: false,
    show1: false,
    show2: true,
    items: ['Personal Details', 'Sensitive Details', 'Occupation & Address', 'Family Details', 'Policies', 'Documents', 'Review & Submit'],
});
const stepOne = reactive({ ...stepOneInitialState });
const stepTwo = reactive({ ...stepTwoInitialState });
const stepThree = reactive({ ...stepThreeInitialState });
const stepFour = reactive({ ...stepFourInitialState });
const stepFive = reactive({ ...stepFiveInitialState });
const stepSix = reactive({ ...stepSixInitialState });
const showSensitiveData = ref(false);
const isModalVisible = ref(false);
const currentDocumentUrl = ref<string>('');
const ocrLoading = ref(false);
const ocrServiceLoading = ref(false);
const ocrServiceAvailable = ref(false);
const ocrServiceMessage = ref('Checking document auto-fill...');
const ocrScanMessage = ref('');
const ocrFilledFields = ref<string[]>([]);
const ocrScanFile = ref<File | File[] | null>(null);
const ocrDocumentType = ref('auto');

const ocrDocumentTypes = [
    { title: 'Choose automatically', value: 'auto' },
    { title: 'Aadhaar card', value: 'aadhaar' },
    { title: 'Voter ID card', value: 'voter_id' },
    { title: 'Driving licence', value: 'driving_license' },
];

const MAX_FORM_STEP = 7;

const normalizeStep = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 1;
    const floored = Math.floor(parsed);
    return Math.min(Math.max(floored, 1), MAX_FORM_STEP);
};

const resolveInitialStep = (record: RecordDetail, recordId: string): number => {
    const queryStep = route.query.step;
    if (queryStep !== undefined) {
        const raw = Array.isArray(queryStep) ? queryStep[0] : queryStep;
        return normalizeStep(raw);
    }

    const rememberedStep = recordStore.getCurrentStep(recordId);
    if (rememberedStep) {
        return normalizeStep(rememberedStep);
    }

    const lastCompletedStep = Number(record.lastCompletedStep ?? 0);
    if (Number.isFinite(lastCompletedStep) && lastCompletedStep > 0) {
        return normalizeStep(lastCompletedStep + 1);
    }

    return 1;
};

const syncStepState = async () => {
    const recordIdParam = route.params.recordId;
    const recordId = Array.isArray(recordIdParam) ? recordIdParam[0] : recordIdParam;
    if (!recordId) return;

    recordStore.setCurrentStep(recordId, stepper.step);

    const currentQueryStep = Array.isArray(route.query.step) ? route.query.step[0] : route.query.step;
    if (String(currentQueryStep ?? '') !== String(stepper.step)) {
        await router.replace({
            query: {
                ...route.query,
                step: String(stepper.step),
            },
        });
    }
};


const addAddress = () => {
    stepThree.addresses.push({
        houseName: '',
        houseNumber: '',
        streetName: '',
        streetNumber: '',
        village: '',
        postOffice: '',
        locationType: '',
    });
};

const removeAddress = (index: number) => {
    stepThree.addresses.splice(index, 1);
};

const addChild = () => {
    if (!stepFour.children) stepFour.children = [];
    stepFour.children.push({
        name: '',
        dateOfBirth: '',
        gender: '',
    });
};

const removeChild = (index: number) => {
    if (stepFour.children) {
        stepFour.children.splice(index, 1);
    }
};

const uploadDocument = () => {
    stepSix.documents.push({
        name: '',
        file: ''
    });
};

const removeDocument = (index: number) => {
    stepSix.documents.splice(index, 1);
};

const addPolicy = () => {
    stepFive.policies.push({
        type: '',
        number: '',
    });
};

const removePolicy = (index: number) => {
    if (stepFive.policies.length === 1) {
        stepFive.policies[0] = {
            type: '',
            number: '',
        };
        return;
    }
    stepFive.policies.splice(index, 1);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resetForm = (form: any, initialState: object) => Object.assign(form, initialState);
watch(
    () => route.params.recordId,
    async (ids) => {
        stepper.edit = Boolean(ids);

        if (ids) {
            const id = Array.isArray(ids) ? ids[0] : ids;
            let record = recordStore.records?.data?.find((r) => r.id === id);

            try {
                if (!record) {
                    await recordStore.fetchRecordById(id);
                    record = recordStore.record;
                }
                setFormFields(record);
                stepper.step = resolveInitialStep(record, id);
                await syncStepState();
            } catch (error) {
                if ((error as { status: number }).status === 404) {
                    router.push({ name: "NotFound" });
                } else {
                    console.error("An unexpected error occurred:", error);
                }
            }
        } else {
            resetForm(stepOne, stepOneInitialState);
            stepper.step = 1;
        }
    },
    { immediate: true }
);

watch(
    () => stepper.step,
    async () => {
        await syncStepState();
    }
);


const setFormFields = (record: RecordDetail) => {
    const scannedIdentityFields = {
        aadhaarNumber: stepTwo.aadhaarNumber,
        drivingLicense: stepTwo.drivingLicense,
        electionID: stepTwo.electionID,
    };
    const steps = [stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix];
    steps.forEach(step => Object.assign(step, record));

    stepTwo.aadhaarNumber = record.aadhaarNumber || scannedIdentityFields.aadhaarNumber || '';
    stepTwo.drivingLicense = record.drivingLicense || scannedIdentityFields.drivingLicense || '';
    stepTwo.electionID = record.electionID || scannedIdentityFields.electionID || '';

    if (!stepFive.policies?.length) {
        stepFive.policies = [{
            type: '',
            number: '',
        }];
    }
};

onMounted(() => {
    void checkOcrServiceStatus();
    // const One = {
    //     "id": "",
    //     "valid": true,
    //     "profileImage": "http://localhost:5001/1738053289968-Screenshot from 2025-01-25 14-22-46.png",
    //     "email": "asdfff@gmail.com",
    //     "firstName": "Alshoja",
    //     "lastName": "m ikbal",
    //     "houseName": "Padannamakal",
    //     "houseNumber": "123",
    //     "streetName": "Street ",
    //     "streetNumber": "132",
    //     "postOffice": "652234",
    //     "village": "Village",
    //     "panchayat": "Panchayath",
    //     "district": "District",
    //     "mobileNumber": "9967521656",
    //     "whatsappNumber": "",
    //     "dateOfBirth": "2025-01-28",
    //     "gender": "male"
    // }
    // Object.assign(stepOne, One);
});

const isCurrentStepValid = computed(() => {
    if (stepper.step === 1) return stepOne.valid;
    if (stepper.step === 2) return stepTwo.valid;
    if (stepper.step === 3) return stepThree.valid;
    if (stepper.step === 4) return stepFour.valid;
    if (stepper.step === 5) return stepFive.valid;
    if (stepper.step === 6) return stepSix.valid;
    return false;
});

const canUseOcrAutofill = computed(() => !stepper.edit && ocrServiceAvailable.value);
const documentAutofillMessage = computed(() => {
    if (ocrLoading.value && ocrScanMessage.value) {
        return ocrScanMessage.value;
    }

    return ocrServiceMessage.value;
});

// const allStepsValid = computed(() => stepOne.valid && stepTwo.valid && stepThree.valid && stepFour.valid && stepFive.valid && stepSix.valid);

const submitStepper = () => {
    submitFinalData();
};

const continueNextStep = () => {
    if (isCurrentStepValid.value) stepper.step++;
}

const previousStep = () => {
    if (stepper.step > 1) stepper.step--;
};

// const gotToStep = (step: number) => (stepper.step = step);

const submitStepData = async (status: RecordStatus = 'DRAFT', shouldContinue = true) => {
    const recordId = route.params.recordId as string || '';
    type StepHandler = {
        method: () => Promise<unknown>;
        successMessage: string;
        onSuccess?: (res: { id: string }) => void;
    };

    const stepsHandler: { [key: number]: StepHandler } = {
        1: {
            method: async () => {
                stepOne.id = recordId;
                return await recordStore.createPersonalData(stepOne, status);
            },
            successMessage: 'Personal Data updated successfully',
            onSuccess: (res: { id: string }) => {
                if (!shouldContinue) {
                    return;
                }
                if (stepper.edit) {
                    continueNextStep();
                } else {
                    router.push({ name: 'Edit Record', params: { recordId: res.id }, query: { step: '2' } });
                    continueNextStep();
                }
            }
        },
        2: {
            method: () => recordStore.createIdentificationData(stepTwo, recordId, status),
            successMessage: 'Identification Data submitted successfully',
        },
        3: {
            method: () => recordStore.createOccupationData(stepThree, recordId, status),
            successMessage: 'Occupation Data submitted successfully',
        },
        4: {
            method: () => recordStore.createFamilyData(stepFour, recordId, status),
            successMessage: 'Family Data submitted successfully',
        },
        5: {
            method: () => recordStore.createPolicyData(stepFive, recordId, status),
            successMessage: 'Policy Data submitted successfully',
        },
        6: {
            method: () => recordStore.createDocumentsData(stepSix, recordId, status),
            successMessage: 'Document Data submitted successfully',
        },
    };

    const stepHandler = stepsHandler[stepper.step];

    if (!stepHandler) {
        console.log("Unknown step, no data to submit.");
        return;
    }

    if (stepper.step > 1 && !recordId) {
        snackbar.showSnackbar('Please save step one first to create the record.', 'warning', []);
        return;
    }

    try {
        loading.value = true;
        const result = await stepHandler.method();
        snackbar.showSnackbar(stepHandler.successMessage, 'success', []);
        stepHandler.onSuccess?.(result as { id: string });
        if (shouldContinue && stepper.step !== 1) {
            continueNextStep();
        }
    } catch (error) {
        console.log("🚀 error:", error)
    } finally {
        loading.value = false;
    }
};

const saveDraft = async () => {
    if (stepper.step === stepper.items.length) {
        const recordId = route.params.recordId as string || '';
        if (!recordId) {
            snackbar.showSnackbar('Please save step one first to create a draft.', 'warning', []);
            return;
        }
        try {
            loading.value = true;
            await recordStore.createDocumentsData(stepSix, recordId, 'DRAFT');
            snackbar.showSnackbar('Draft saved successfully', 'success', []);
        } catch (error) {
            console.log('🚀 error:', error);
        } finally {
            loading.value = false;
        }
        return;
    }
    await submitStepData('DRAFT', false);
};

const submitFinalData = async () => {
    const recordId = route.params.recordId as string || '';
    if (!recordId) {
        snackbar.showSnackbar('Please save step one first before final submit.', 'warning', []);
        return;
    }
    try {
        loading.value = true;
        await recordStore.createDocumentsData(stepSix, recordId, 'COMPLETED');
        snackbar.showSnackbar('Data submitted successfully!', 'success', []);
        router.push({ name: "Records List" });
    } catch (error) {
        console.log('🚀 error:', error);
    } finally {
        loading.value = false;
    }
};


const sensitiveFieldType = computed(() => (showSensitiveData.value ? 'text' : 'password'));
const sensitiveFieldIcon = computed(() => (showSensitiveData.value ? '$eye' : '$eyeOff'));
const toggleSensitiveDataVisibility = () => {
    showSensitiveData.value = !showSensitiveData.value;
};

function setUploadUrl(url: string) {
    stepOne.profileImage = url;
    // console.log('File uploaded successfully! URL:', url);
}

function setUploadUrlForDoc(fileUrl: string, fileName: string, index: number) {
    stepSix.documents[index].file = fileUrl;
    stepSix.documents[index].name = fileName;
}

function clearUploadForDoc(index: number) {
    stepSix.documents[index].file = '';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const checkOcrServiceStatus = async () => {
    if (stepper.edit) {
        ocrServiceAvailable.value = false;
        ocrServiceMessage.value = 'Document auto-fill is available only when creating a new record.';
        return;
    }

    try {
        ocrServiceLoading.value = true;
        const response = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/extract/text/status`);
        const enabled = Boolean(response.data?.enabled);
        ocrServiceAvailable.value = enabled;
        ocrServiceMessage.value = enabled
            ? 'Upload an ID document to fill matching fields automatically.'
            : 'Document auto-fill is not available right now.';
    } catch (error) {
        console.log('Document auto-fill status error:', error);
        ocrServiceAvailable.value = false;
        ocrServiceMessage.value = 'Document auto-fill is not available right now.';
    } finally {
        ocrServiceLoading.value = false;
    }
};

watch(
    () => stepper.edit,
    () => {
        void checkOcrServiceStatus();
    }
);

type IdentityDocumentFields = {
    name?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    aadhaarNumber?: string | null
    drivingLicense?: string | null
    electionID?: string | null
    pin?: string | null
}

type IdentityDocumentParseResult = {
    documentType?: 'aadhaar' | 'voter_id' | 'driving_license' | 'unknown'
    confidence?: number
    fields?: IdentityDocumentFields
}

const formatOcrDate = (date?: string | null): string => {
    if (!date) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const parts = date.split(/[/. -]/).filter(Boolean);
    if (parts.length !== 3) return '';
    const [dd, mm, year] = parts;
    if (!dd || !mm || !year) return '';
    const yyyy = year.length === 2 ? `20${year}` : year;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
};

const applyOcrResultToForm = (result: IdentityDocumentParseResult): boolean => {
    const fields = result.fields;
    let filledAnyField = false;
    const filledFields: string[] = [];

    ocrFilledFields.value = [];

    if (!fields) {
        return false;
    }

    if (fields.aadhaarNumber) {
        stepTwo.aadhaarNumber = fields.aadhaarNumber;
        filledAnyField = true;
        filledFields.push('Aadhaar number');
    }
    if (fields.drivingLicense) {
        stepTwo.drivingLicense = fields.drivingLicense;
        filledAnyField = true;
        filledFields.push('Driving licence');
    }
    if (fields.electionID) {
        stepTwo.electionID = fields.electionID;
        filledAnyField = true;
        filledFields.push('Election ID');
    }
    if (fields.dateOfBirth) {
        const dob = formatOcrDate(fields.dateOfBirth);
        if (dob) {
            stepOne.dateOfBirth = dob;
            filledAnyField = true;
            filledFields.push('Date of birth');
        }
    }
    if (fields.gender) {
        const normalizedGender = fields.gender.toLowerCase();
        if (['male', 'female', 'other'].includes(normalizedGender)) {
            stepOne.gender = normalizedGender;
            filledAnyField = true;
            filledFields.push('Gender');
        }
    }
    if (fields.name) {
        const parts = fields.name.trim().split(/\s+/);
        if (parts.length > 0 && !stepOne.firstName) {
            stepOne.firstName = parts[0];
            filledAnyField = true;
            filledFields.push('First name');
        }
        if (parts.length > 1 && !stepOne.lastName) {
            stepOne.lastName = parts.slice(1).join(' ');
            filledAnyField = true;
            filledFields.push('Last name');
        }
    }
    if (fields.pin && !stepOne.postOffice) {
        stepOne.postOffice = fields.pin;
        filledAnyField = true;
        filledFields.push('Post office / PIN');
    }

    ocrFilledFields.value = filledFields;

    return filledAnyField;
};

const runOcrAutofill = async () => {
    if (!canUseOcrAutofill.value) {
        snackbar.showSnackbar(ocrServiceMessage.value, 'warning', []);
        return;
    }

    const selectedFile = Array.isArray(ocrScanFile.value) ? ocrScanFile.value[0] : ocrScanFile.value;
    if (!(selectedFile instanceof File)) {
        snackbar.showSnackbar('Please choose a document first.', 'warning', []);
        return;
    }
    try {
        ocrLoading.value = true;
        ocrScanMessage.value = 'Reading your document...';
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (ocrDocumentType.value !== 'auto') {
            formData.append('documentType', ocrDocumentType.value);
        }
        const submitResponse = await axiosInstance.post(`${import.meta.env.VITE_API_URL}/extract/text`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const jobId = submitResponse.data?.jobId ? String(submitResponse.data.jobId) : null;
        if (!jobId) {
            snackbar.showSnackbar('Could not start document scan. Please try again.', 'error', []);
            return;
        }

        const maxAttempts = 20;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            ocrScanMessage.value = attempt < 3
                ? 'Reading your document...'
                : 'Still reading. This can take a moment for larger files.';
            const resultResponse = await axiosInstance.get(`${import.meta.env.VITE_API_URL}/extract/text/${jobId}`);
            const result = resultResponse.data?.result;
            if (!result) {
                await sleep(1500);
                continue;
            }
            if (result.pending) {
                await sleep(1500);
                continue;
            }
            if (result.error) {
                snackbar.showSnackbar(`Document scan failed: ${result.error}`, 'error', []);
                return;
            }

            const filledAnyField = applyOcrResultToForm(result);
            ocrScanFile.value = null;
            snackbar.showSnackbar(
                filledAnyField
                    ? 'Details filled from document. Please check them before saving.'
                    : 'Document was read, but no matching form details were found.',
                filledAnyField ? 'success' : 'warning',
                [],
            );
            return;
        }
        snackbar.showSnackbar('Document scan is taking longer than expected. Please try again.', 'warning', []);
    } catch (error) {
        console.log('Document scan error:', error);
        const message = error instanceof Error ? error.message : 'Document scan failed. Please try again.';
        snackbar.showSnackbar(message, 'error', []);
    } finally {
        ocrLoading.value = false;
        ocrScanMessage.value = '';
    }
};
const viewDocument = (index: number) => {
    currentDocumentUrl.value = stepSix.documents[index].file;
    isModalVisible.value = true;
};

const getDocumentAssetUrl = (file: string) => {
    if (file.startsWith('blob:') || file.startsWith('data:')) return file;
    if (file.startsWith('/api/')) return file.replace(/^\/api/, '');

    const assetBaseUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    try {
        const fileUrl = new URL(file, window.location.origin);
        return `${assetBaseUrl}/${fileUrl.pathname.split('/').pop()}`;
    } catch {
        return `${assetBaseUrl}/${file.split('/').pop()}`;
    }
};

const downloadDocument = async (index: number) => {
    const document = stepSix.documents[index];
    if (!document.file) return;

    try {
        const response = await axiosInstance.get(getDocumentAssetUrl(document.file), {
            responseType: 'blob',
        });
        const fileUrl = URL.createObjectURL(response.data);
        const downloadLink = window.document.createElement('a');
        const extension = document.file.split('?')[0].split('.').pop();
        const documentName = document.name || 'document';
        const downloadName = extension && !documentName.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
            ? `${documentName}.${extension}`
            : documentName;

        downloadLink.href = fileUrl;
        downloadLink.download = downloadName;
        window.document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    } catch (error) {
        console.log('Document download error:', error);
        snackbar.showSnackbar('Could not download the document. Please try again.', 'error', []);
    }
};
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs" />
    <UiParentCard title="Create Record">

        <v-stepper rounded="lg" class="record-stepper" :editable="stepper.edit" v-model="stepper.step" :items="stepper.items">
            <!-- Step 1: Personal Details -->
            <template v-slot:item.1>
                <v-form v-model="stepOne.valid" class="step-one-form">
                    <v-card variant="outlined" class="step-one-card">
                        <v-card-title class="record-step-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <CameraIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Profile Photo</div>
                                <div class="text-caption text-lightText">JPG or PNG, maximum 2 MB</div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row no-gutters class="step-one-profile-row align-center">
                                <v-col cols="12" sm="auto" class="step-one-profile-image">
                                    <ProfileImage :url="stepOne.profileImage" />
                                </v-col>
                                <v-col cols="12" sm class="step-one-profile-upload">
                                    <FileUpload :label="`Upload Profile Image`" :accept="'image/jpeg, image/png'"
                                        :rules="[]" upload-path="/uploads/profile-staging" @uploaded="setUploadUrl" />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card v-if="!stepper.edit" variant="outlined" class="step-one-card">
                        <v-card-title class="record-step-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <ScanIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Document Auto-fill</div>
                                <div class="text-caption text-lightText">Fill matching details from an identity document
                                </div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12">
                                    <v-alert :type="ocrServiceAvailable ? 'info' : 'warning'" variant="tonal" color="secondary"
                                        density="comfortable">
                                        {{ documentAutofillMessage }}
                                        <span v-if="ocrServiceAvailable && !ocrLoading">
                                            Please check filled details before saving.
                                        </span>
                                    </v-alert>
                                </v-col>
                                <v-col v-if="ocrFilledFields.length > 0" cols="12">
                                    <v-chip-group>
                                        <v-chip v-for="field in ocrFilledFields" :key="field" color="success"
                                            variant="tonal" size="small">
                                            Filled {{ field }}
                                        </v-chip>
                                    </v-chip-group>
                                </v-col>
                                <v-col cols="12" md="3">
                                    <v-select v-model="ocrDocumentType" :items="ocrDocumentTypes" variant="outlined"
                                        label="Document"
                                        :disabled="ocrLoading || ocrServiceLoading || !canUseOcrAutofill" />
                                </v-col>
                                <v-col cols="12" md="6" lg="7">
                                    <v-file-input v-model="ocrScanFile" variant="outlined"
                                        label="Upload Aadhaar, voter ID, or driving licence"
                                        accept=".pdf,.doc,.docx,image/png,image/jpeg"
                                        :disabled="ocrLoading || ocrServiceLoading || !canUseOcrAutofill" />
                                </v-col>
                                <v-col cols="12" md="3" lg="2" class="d-flex align-center">
                                    <v-btn variant="outlined" color="secondary" size="large" class="w-100 w-md-auto mb-6"
                                        :loading="ocrLoading || ocrServiceLoading"
                                        :disabled="ocrLoading || ocrServiceLoading || !canUseOcrAutofill"
                                        @click="runOcrAutofill">
                                        Fill From Document
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="step-one-card">
                        <v-card-title class="record-step-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <UserIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Basic Information</div>
                                <div class="text-caption text-lightText">Name, email, birth date, and gender</div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.firstName" label="First Name*"
                                        required :rules="[validationRules.required]" />
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.lastName" label="Last Name" />
                                </v-col>
                                <v-col cols="12">
                                    <v-text-field variant="outlined" v-model="stepOne.email" label="Email*"
                                        :rules="[validationRules.required, validationRules.email]" />
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.dateOfBirth" label="Date of Birth"
                                        type="date" />
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-select variant="outlined" v-model="stepOne.gender"
                                        :items="['male', 'female', 'other']" label="Gender" />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="step-one-card">
                        <v-card-title class="record-step-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <PhoneIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Contact Details</div>
                                <div class="text-caption text-lightText">Primary mobile and WhatsApp numbers</div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepOne.mobileNumber"
                                        label="Mobile Number(+91)" />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepOne.whatsappNumber"
                                        label="WhatsApp Number(+91)" />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="step-one-card">
                        <v-card-title class="record-step-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <HomeIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Home Address</div>
                                <div class="text-caption text-lightText">Primary residential address</div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.houseName" label="House Name" />
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.houseNumber"
                                        label="House Number" />
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.streetName" label="Street Name" />
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field variant="outlined" v-model="stepOne.streetNumber"
                                        label="Street Number" />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepOne.village" label="Village" />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field type="number" variant="outlined" v-model="stepOne.postOffice"
                                        label="Post Office" />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepOne.panchayat" label="Panchayat" />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepOne.district" label="District" />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-form>
            </template>

            <!-- Step 2: Sensitive Details -->
            <template v-slot:item.2>
                <v-form v-model="stepTwo.valid" class="step-two-form">
                    <v-card variant="outlined" class="step-two-card">
                        <v-card-title class="step-two-header">
                            <div class="d-flex align-center ga-3">
                                <v-avatar color="lightsecondary" size="36">
                                    <IdIcon class="text-secondary" size="20" />
                                </v-avatar>
                                <div>
                                    <div class="text-h5">Identity Documents</div>
                                    <div class="text-caption text-lightText">Secure identity and postal reference numbers</div>
                                </div>
                            </div>
                            <v-btn color="secondary" variant="text" size="small"
                                :prepend-icon="showSensitiveData ? '$eyeOff' : '$eye'"
                                @click="toggleSensitiveDataVisibility">
                                {{ showSensitiveData ? 'Hide details' : 'Show details' }}
                            </v-btn>
                        </v-card-title>
                        <v-card-text>
                            <v-alert type="info" color="secondary" variant="tonal" density="compact"
                                class="step-two-alert mb-5 mt-1">
                                Details are hidden by default to protect personal information.
                            </v-alert>

                            <v-row>
                            <v-col cols="12" md="6">
                                <v-text-field class="sensitive-visibility-field" variant="outlined"
                                    v-model="stepTwo.aadhaarNumber" label="Aadhaar Number" :type="sensitiveFieldType"
                                    :append-inner-icon="sensitiveFieldIcon"
                                    @click:append-inner="toggleSensitiveDataVisibility"
                                    :rules="[validationRules.maxLength(12), validationRules.minLength(12)]" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field class="sensitive-visibility-field" variant="outlined"
                                    v-model="stepTwo.drivingLicense" label="Driving License" :type="sensitiveFieldType"
                                    :append-inner-icon="sensitiveFieldIcon"
                                    @click:append-inner="toggleSensitiveDataVisibility"
                                    :rules="[validationRules.maxLength(15), validationRules.minLength(15)]" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field class="sensitive-visibility-field" variant="outlined"
                                    v-model="stepTwo.electionID" label="Election ID" :type="sensitiveFieldType"
                                    :append-inner-icon="sensitiveFieldIcon"
                                    @click:append-inner="toggleSensitiveDataVisibility"
                                    :rules="[validationRules.maxLength(10), validationRules.minLength(10)]" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field class="sensitive-visibility-field" variant="outlined"
                                    v-model="stepTwo.passportNumber" label="Passport Number" :type="sensitiveFieldType"
                                    :append-inner-icon="sensitiveFieldIcon"
                                    @click:append-inner="toggleSensitiveDataVisibility"
                                    :rules="[validationRules.maxLength(8), validationRules.minLength(8)]" />
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-text-field class="sensitive-visibility-field" variant="outlined"
                                    v-model="stepTwo.postBoxNumber" label="Post Box Number" :type="sensitiveFieldType"
                                    :append-inner-icon="sensitiveFieldIcon"
                                    @click:append-inner="toggleSensitiveDataVisibility" />
                            </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-form>
            </template>

            <!-- Step 3: Occupation & Address -->
            <template v-slot:item.3>
                <v-form v-model="stepThree.valid" class="step-three-form">
                    <v-card variant="outlined" class="step-three-card">
                        <v-card-title class="step-three-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <BriefcaseIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Occupation</div>
                                <div class="text-caption text-lightText">Employment and retirement information</div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepThree.job" label="Occupation (ജോലി)"
                                        required />
                                </v-col>
                                <v-col cols="12" md="6">
                                    <v-text-field variant="outlined" v-model="stepThree.retirementDate"
                                        label="Retirement Date (വിരമിക്കുന്ന തീയതി)" type="date" />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="step-three-card">
                        <v-card-title class="step-three-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <MapPinIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Retirement & Location Details</div>
                                <div class="text-caption text-lightText">Record future residence and location details
                                </div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <div class="step-three-setting"
                                :class="{ 'step-three-setting--active': stepThree.isRedirected }">
                                <div>
                                    <div class="text-subtitle-1 font-weight-medium">Add Post-Retirement Address
                                    </div>
                                    <div class="text-caption text-lightText">Where this person plans to live after
                                        retirement</div>
                                </div>
                                <v-switch v-model="stepThree.isRedirected"
                                    :color="stepThree.isRedirected ? 'secondary' : 'grey'" hide-details inset />
                            </div>
                            <div class="step-three-setting"
                                :class="{ 'step-three-setting--active': stepThree.isAbroad }">
                                <div>
                                    <div class="text-subtitle-1 font-weight-medium">Living Abroad (വിദേശത്ത്)</div>
                                    <div class="text-caption text-lightText">Mark this person as living outside the
                                        country</div>
                                </div>
                                <v-switch v-model="stepThree.isAbroad"
                                    :color="stepThree.isAbroad ? 'secondary' : 'grey'" hide-details inset />
                            </div>

                            <v-expand-transition>
                                <v-row v-if="stepThree.isRedirected" class="mt-2">
                                    <v-col cols="12" md="6">
                                        <v-text-field variant="outlined" v-model="stepThree.redirectedHouseName"
                                            label="Post-Retirement House Name" />
                                    </v-col>
                                    <v-col cols="12" md="6">
                                        <v-text-field variant="outlined" v-model="stepThree.redirectedHouseNumber"
                                            label="Post-Retirement House Number" />
                                    </v-col>
                                </v-row>
                            </v-expand-transition>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="step-three-card">
                        <v-card-title class="step-three-addresses-header">
                            <div>
                                <div class="text-h5">Other Addresses</div>
                                <div class="text-caption text-lightText">Add domestic or overseas addresses</div>
                            </div>
                            <v-btn color="secondary" variant="outlined" @click="addAddress">
                                <PlusIcon size="18" class="mr-1" />
                                Add Address
                            </v-btn>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col v-for="(address, index) in stepThree.addresses" :key="index" cols="12" lg="6">
                                    <v-card variant="outlined" class="step-three-address-card">
                                        <v-card-title class="step-three-address-card-header">
                                            <div class="d-flex align-center ga-2">
                                                <v-avatar color="lightsecondary" size="30">
                                                    <MapPinIcon class="text-secondary" size="17" />
                                                </v-avatar>
                                                <span class="text-subtitle-1 font-weight-bold">Address {{ index + 1
                                                    }}</span>
                                            </div>
                                            <v-btn color="error" variant="text" icon size="small"
                                                :aria-label="`Remove address ${index + 1}`"
                                                @click="removeAddress(index)">
                                                <TrashIcon size="18" />
                                            </v-btn>
                                        </v-card-title>
                                        <v-card-text>
                                            <v-row>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="address.houseName"
                                                        label="House Name" />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="address.houseNumber"
                                                        label="House Number" />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="address.streetName"
                                                        label="Street Name" />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="address.streetNumber"
                                                        label="Street Number" />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="address.village"
                                                        label="Village (വില്ലേജ്)" />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="address.postOffice"
                                                        label="Post Office (പോസ്റ്റ് ഓഫീസ്)" />
                                                </v-col>
                                                <v-col cols="12">
                                                    <v-select variant="outlined" v-model="address.locationType"
                                                        :items="['Domestic (സ്വദേശത്ത്)', 'Abroad (വിദേശത്ത്)']"
                                                        label="Location Type" />
                                                </v-col>
                                            </v-row>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>
                            <v-btn color="secondary" variant="outlined" block class="d-sm-none mt-2"
                                @click="addAddress">
                                <PlusIcon size="18" class="mr-1" />
                                Add Another Address
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-form>
            </template>

            <!-- Step 4: Family Details -->
            <template v-slot:item.4>
                <v-form v-model="stepFour.valid" class="step-four-form">
                    <v-card variant="outlined" class="step-four-card">
                        <v-card-title class="record-step-card-header">
                            <v-avatar color="lightsecondary" size="36">
                                <HeartIcon class="text-secondary" size="20" />
                            </v-avatar>
                            <div>
                                <div class="text-h5">Marriage Information</div>
                                <div class="text-caption text-lightText">Optional marriage and previous-address details
                                </div>
                            </div>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="4">
                                    <v-text-field variant="outlined" v-model="stepFour.marriageDate"
                                        label="Marriage Date (വിവാഹം നടന്ന തീയതി, മാസം, വർഷം)" type="date" />
                                </v-col>
                                <v-col cols="12" md="8">
                                    <v-text-field variant="outlined" v-model="stepFour.previousAddress"
                                        label="Previous Address (മുമ്പത്തെ മേൽവിലാസം)" />
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="step-four-card">
                        <v-card-title class="step-four-children-header">
                            <div class="d-flex align-center ga-3">
                                <v-avatar color="lightsecondary" size="36">
                                    <UsersIcon class="text-secondary" size="20" />
                                </v-avatar>
                                <div>
                                    <div class="text-h5">Children</div>
                                    <div class="text-caption text-lightText">Add one card for each child</div>
                                </div>
                            </div>
                            <v-btn color="secondary" variant="outlined" @click="addChild">
                                <PlusIcon size="18" class="mr-1" />
                                Add Child
                            </v-btn>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" lg="6" v-for="(child, index) in stepFour.children" :key="index">
                                    <v-card variant="outlined" class="step-four-child-card">
                                        <v-card-title class="step-four-child-header">
                                            <span class="text-subtitle-1 font-weight-bold">Child {{ index + 1 }}</span>
                                            <v-btn color="error" variant="text" icon size="small"
                                                :aria-label="`Remove child ${index + 1}`" @click="removeChild(index)">
                                                <TrashIcon size="18" />
                                            </v-btn>
                                        </v-card-title>
                                        <v-card-text>
                                            <v-row>
                                                <v-col cols="12">
                                                    <v-text-field variant="outlined" v-model="child.name"
                                                        label="Child's Name" required />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-text-field variant="outlined" v-model="child.dateOfBirth"
                                                        label="Child's Date of Birth (കുട്ടി ജനിച്ച തീയതി)" type="date"
                                                        required />
                                                </v-col>
                                                <v-col cols="12" sm="6">
                                                    <v-select variant="outlined" v-model="child.gender"
                                                        :items="['male', 'female']"
                                                        label="Child's Gender (Male/ Female)" required />
                                                </v-col>
                                            </v-row>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>
                            <v-btn color="secondary" variant="outlined" block class="d-sm-none mt-2" @click="addChild">
                                <PlusIcon size="18" class="mr-1" />
                                Add Another Child
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-form>
            </template>

            <!-- Step 5: Policy -->
            <template v-slot:item.5>
                <v-form v-model="stepFive.valid" class="step-five-form">
                    <v-card variant="outlined" class="step-five-card">
                        <v-card-title class="step-five-header">
                            <div class="d-flex align-center ga-3">
                                <v-avatar color="lightsecondary" size="36">
                                    <ShieldCheckIcon class="text-secondary" size="20" />
                                </v-avatar>
                                <div>
                                    <div class="text-h5">Policy Details</div>
                                    <div class="text-caption text-lightText">Add account and policy numbers</div>
                                </div>
                            </div>
                            <v-btn color="secondary" variant="outlined" @click="addPolicy">
                                <PlusIcon size="18" class="mr-1" />
                                Add Policy
                            </v-btn>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="6" v-for="(policy, index) in stepFive.policies" :key="index">
                                    <v-card variant="outlined" class="step-five-policy-card">
                                        <v-card-title class="step-five-policy-header">
                                            <span class="text-subtitle-1 font-weight-bold">Policy {{ index + 1 }}</span>
                                            <v-btn color="error" variant="text" icon size="small"
                                                :aria-label="`Remove policy ${index + 1}`" @click="removePolicy(index)">
                                                <TrashIcon size="18" />
                                            </v-btn>
                                        </v-card-title>
                                        <v-card-text>
                                            <v-row>
                                                <v-col cols="12">
                                                    <v-select variant="outlined" v-model="policy.type"
                                                        :items="['Account Number', 'PLI Number', 'RPLI Number', 'IPPB Number', 'Savings Bank Number', 'Other Account Numbers']"
                                                        label="Policy Type" required />
                                                </v-col>
                                                <v-col cols="12">
                                                    <v-text-field variant="outlined" v-model="policy.number"
                                                        label="Policy Number" required />
                                                </v-col>
                                            </v-row>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>
                            <v-btn color="secondary" variant="outlined" block class="d-sm-none mt-2" @click="addPolicy">
                                <PlusIcon size="18" class="mr-1" />
                                Add Another Policy
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-form>
            </template>


            <!-- Step 6: Documents -->
            <template v-slot:item.6>
                <v-form v-model="stepSix.valid" class="step-six-form">
                    <v-card variant="outlined" class="step-six-card">
                        <v-card-title class="step-six-header">
                            <div class="d-flex align-center ga-3">
                                <v-avatar color="lightsecondary" size="36">
                                    <FileTextIcon class="text-secondary" size="20" />
                                </v-avatar>

                                <div>
                                    <div class="text-h5">Supporting Documents</div>
                                    <div class="text-caption text-lightText">
                                        Upload Aadhaar, address proof, or other documents
                                    </div>
                                </div>
                            </div>

                            <v-btn color="secondary" variant="outlined" @click="uploadDocument"
                                class="d-none d-sm-flex">
                                <PlusIcon size="18" class="mr-1" />
                                Add Document
                            </v-btn>
                        </v-card-title>

                        <v-card-text>
                            <v-row>
                                <v-col cols="12" md="6" v-for="(document, index) in stepSix.documents" :key="index">
                                    <v-card variant="outlined" class="step-six-document-card">
                                        <v-card-title class="step-six-document-header">
                                            <span class="text-subtitle-1 font-weight-bold">
                                                Document {{ index + 1 }}
                                            </span>

                                            <div class="d-flex align-center ga-1">
                                                <template v-if="document.file">
                                                    <v-tooltip text="Preview Document">
                                                        <template #activator="{ props }">
                                                            <v-btn v-bind="props" icon variant="text" color="secondary"
                                                                @click="viewDocument(index)">
                                                                <EyeIcon size="18" />
                                                            </v-btn>
                                                        </template>
                                                    </v-tooltip>

                                                    <v-tooltip text="Download Document">
                                                        <template #activator="{ props }">
                                                            <v-btn v-bind="props" icon variant="text" color="secondary"
                                                                @click="downloadDocument(index)">
                                                                <DownloadIcon size="18" />
                                                            </v-btn>
                                                        </template>
                                                    </v-tooltip>
                                                </template>

                                                <v-tooltip text="Remove Document">
                                                    <template #activator="{ props }">
                                                        <v-btn v-bind="props" icon variant="text" color="error"
                                                            @click="removeDocument(index)">
                                                            <TrashIcon size="18" />
                                                        </v-btn>
                                                    </template>
                                                </v-tooltip>
                                            </div>
                                        </v-card-title>

                                        <v-card-text class="pt-0">
                                            <v-row>
                                                <v-col cols="12">
                                                    <v-text-field variant="outlined" v-model="document.name"
                                                        label="Document Name"
                                                        placeholder="e.g., Aadhaar Copy, Address Proof"
                                                        :rules="[validationRules.required]" />
                                                </v-col>

                                                <v-col cols="12">
                                                    <FileUpload label="Upload Document"
                                                        :rules="[validationRules.required]"
                                                        :upload-path="`/records/${route.params.recordId}/documents/upload`"
                                                        :existing-file-url="document.file"
                                                        @uploaded="(fileUrl, fileName) => setUploadUrlForDoc(fileUrl, fileName, index)"
                                                        @cleared="clearUploadForDoc(index)" />
                                                </v-col>
                                            </v-row>
                                        </v-card-text>
                                    </v-card>
                                </v-col>
                            </v-row>

                            <v-btn color="secondary" variant="outlined" block class="d-sm-none mt-2"
                                @click="uploadDocument">
                                <PlusIcon size="18" class="mr-1" />
                                Add Another Document
                            </v-btn>
                        </v-card-text>
                    </v-card>
                </v-form>

                <FileViewer :isVisible="isModalVisible" :file="currentDocumentUrl || ''"
                    @update:isVisible="isModalVisible = $event" />
            </template>

            <!-- Step 7: Review & Submit -->
            <template v-slot:item.7>
                <v-card variant="outlined" class="step-seven-card">
                    <v-card-title class="step-seven-header">
                        <div class="d-flex align-center ga-3">
                            <v-avatar color="lightsecondary" size="36">
                                <ClipboardCheckIcon class="text-secondary" size="20" />
                            </v-avatar>

                            <div>
                                <div class="text-h5">Review & Submit</div>
                                <div class="text-caption text-lightText">
                                    Check all entered details before submitting
                                </div>
                            </div>
                        </div>
                    </v-card-title>

                    <v-card-text>
                        <ViewComponent
                            :form="{ ...stepOne, ...stepTwo, ...stepThree, ...stepFour, ...stepFive, ...stepSix }"
                            review-mode />
                    </v-card-text>
                </v-card>
            </template>

            <!-- Custom Next and Prev buttons -->
            <template v-slot:actions="{ }">
                <v-row class="d-flex align-center justify-space-between ma-5">
                    <v-btn :disabled="stepper.step === 1" outlined color="secondary" size="default" density="default"
                        @click="previousStep">
                        Back
                    </v-btn>

                    <v-spacer></v-spacer>

                    <DropdownButton v-if="stepper.step < stepper.items.length" :loading="loading"
                        :disabled="!isCurrentStepValid" primary-label="Save & Continue" secondary-label="Save Draft"
                        :compact="true" @primary-click="submitStepData('DRAFT', true)" @secondary-click="saveDraft" />

                    <DropdownButton v-else :loading="loading" :compact="true" primary-label="Finish & Submit"
                        secondary-label="Save Draft" @primary-click="submitStepper" @secondary-click="saveDraft" />
                </v-row>
            </template>
        </v-stepper>
    </UiParentCard>

</template>

<style scoped>
:deep(.sensitive-visibility-field .v-field__append-inner .v-icon) {
    color: rgb(var(--v-theme-secondary));
    opacity: 1;
}

:deep(.sensitive-visibility-field .v-field__append-inner) {
    opacity: 1;
}

.step-three-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.step-four-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.step-five-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.step-five-card {
    border-color: rgba(var(--v-border-color), 0.15);
}

.step-five-header,
.step-five-policy-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.step-five-header {
    padding: 16px 20px;
}

.step-five-policy-card {
    height: 100%;
}

.step-five-policy-header {
    padding: 12px 16px;
}

.step-four-card {
    border-color: rgba(var(--v-border-color), 0.15);
}

.step-four-children-header,
.step-four-child-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.step-four-children-header {
    padding: 16px 20px;
}

.step-four-child-card {
    height: 100%;
}

.step-four-child-header {
    padding: 12px 16px;
}

.step-one-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.step-two-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.step-two-card {
    border-color: rgba(var(--v-border-color), 0.15);
}

.step-two-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
}

.step-two-alert {
    border-radius: 10px;
}

.step-one-card {
    border-color: rgba(var(--v-border-color), 0.15);
}

.record-step-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
}

.step-one-profile-image :deep(.v-col) {
    padding: 0;
}

.step-one-profile-row {
    gap: 20px;
}

.step-one-profile-image {
    width: 120px;
}

.step-one-profile-upload {
    min-width: 0;
}

.record-stepper :deep(.v-stepper-item--selected .v-stepper-item__avatar) {
    color: rgb(var(--v-theme-on-secondary));
    background: rgb(var(--v-theme-secondary));
}

.record-stepper :deep(.v-stepper-item--selected .v-stepper-item__title) {
    color: rgb(var(--v-theme-secondary));
}

.step-three-card {
    border-color: rgba(var(--v-border-color), 0.15);
}

.step-three-card-header,
.step-three-addresses-header,
.step-three-address-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.step-three-card-header {
    justify-content: flex-start;
    padding: 16px 20px;
}

.step-three-addresses-header {
    padding: 16px 20px;
}

.step-three-setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 64px;
    padding: 10px 14px;
    margin-bottom: 10px;
    border-radius: 12px;
    border: 1px solid rgba(var(--v-border-color), 0.12);
    background: rgba(var(--v-theme-on-surface), 0.035);
    transition: background-color 160ms ease, border-color 160ms ease;
}

.step-three-setting--active {
    border-color: rgba(var(--v-theme-secondary), 0.14);
    background: rgb(var(--v-theme-lightsecondary));
}

.step-three-address-card {
    height: 100%;
}

.step-three-address-card-header {
    padding: 12px 16px;
}

@media (max-width: 599px) {
    .step-one-form {
        gap: 12px;
    }

    .step-two-form {
        gap: 12px;
    }

    .step-two-header {
        align-items: flex-start;
        padding: 14px;
    }

    .step-two-header .v-btn {
        min-width: 40px;
        padding-inline: 8px;
        font-size: 0;
    }

    .record-step-card-header {
        padding: 14px;
    }

    .step-one-profile-row {
        gap: 12px;
    }

    .step-one-profile-image {
        width: 100%;
    }

    .step-three-form {
        gap: 12px;
    }

    .step-four-form {
        gap: 12px;
    }

    .step-five-form {
        gap: 12px;
    }

    .step-five-header {
        align-items: flex-start;
        padding: 14px;
    }

    .step-five-header>.v-btn {
        display: none;
    }

    .step-four-children-header {
        align-items: flex-start;
        padding: 14px;
    }

    .step-four-children-header>.v-btn {
        display: none;
    }

    .step-three-card-header,
    .step-three-addresses-header {
        padding: 14px;
    }

    .step-three-addresses-header {
        align-items: flex-start;
    }

    .step-three-addresses-header .v-btn {
        display: none;
    }

    .step-three-setting {
        min-height: 72px;
        padding: 12px;
    }

}

.step-six-card {
    border-radius: 12px;
}

.step-six-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
}

.step-six-document-card {
    border-radius: 12px;
    height: 100%;
}

.step-six-document-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 8px;
}

@media (max-width: 600px) {
    .step-six-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}

.step-seven-card {
    border-radius: 12px;
}

.step-seven-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
}
</style>
