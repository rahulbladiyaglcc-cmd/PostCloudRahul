import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export interface CustomAction {
  actionName: string
  link: string | URL
}

export const useSnackbarStore = defineStore('SnackbarStore', () => {
  const isOpen = ref(false)
  const message = ref('')
  const status = ref('error')
  const customActions: Ref<CustomAction[]> = ref([])

  const showSnackbar = (msg: string, st: string, optionalActions?: CustomAction[]) => {
    message.value = msg
    status.value = st
    isOpen.value = true
    if (optionalActions) {
      customActions.value.push(...optionalActions) // Spread the array into customActions
    }
    if (status.value.toLowerCase() === 'success') {
      setTimeout(() => {
        closeSnackbar()
      }, 1500)
    }
  }

  function closeSnackbar() {
    isOpen.value = false
    customActions.value.splice(0, customActions.value.length) // Clear custom actions
  }

  return { isOpen, message, status, showSnackbar, closeSnackbar, customActions }
})
