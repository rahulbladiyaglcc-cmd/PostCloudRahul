<template>
    <div class="text-center">
        <v-snackbar v-model="snackbarRef" class="" :color="snackbarStatus" variant="outlined">
            <div v-if="Array.isArray(errorMsg)">
                <div v-for="(msg, index) in errorMsg" :key="index">
                    <ul class="error-list">
                        <li :class="snackbarStatus" class="error-item text-caption"> {{ msg }}</li>
                    </ul>
                </div>
            </div>
            <div v-else>{{ errorMsg }}</div>
            <template v-slot:actions>
                <v-btn v-for="act of snackbarActions" :key="act.actionName" :to="act.link">
                    {{ act.actionName }}
                </v-btn>
                <v-btn variant="tonal" @click="closeSnackbar"> Close </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script lang="ts" setup>
import { useSnackbarStore, type CustomAction } from '@/stores/snackbar.store';
import { toRef, type PropType } from 'vue'

const props = defineProps({
    snackbarShow: Boolean,
    errorMsg: {
        type: [String, Array] as PropType<string | string[]>,
        required: true,
    },
    snackbarStatus: String,
    snackbarActions: {
        type: Array as () => CustomAction[], // Custom type to define snackbar actions
    },
})

const snackbar = useSnackbarStore()
const snackbarRef = toRef(props, 'snackbarShow')

const closeSnackbar = () => {
    snackbar.closeSnackbar()
}
</script>

<style scoped lang="scss"></style>