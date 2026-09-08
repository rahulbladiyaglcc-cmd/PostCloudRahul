import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import vuetify from './plugins/vuetify'
import '@/scss/style.scss'
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar'
import VueApexCharts from 'vue3-apexcharts'
import VueTablerIcons from 'vue-tabler-icons'

import { fakeBackend } from '@/utils/helpers/fake-backend'

import { initVoterStorage } from '@/utils/voterStorage'

// print
import print from 'vue3-print-nb'
import axiosInstance from './axiosInstance.interceptor'
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.config.globalProperties.$axios = axiosInstance;
fakeBackend()
app.use(router)
app.use(PerfectScrollbarPlugin)
app.use(VueTablerIcons)
app.use(print)
// Removed the object literal with the unknown property 'iconfont'
app.use(VueApexCharts)

// Ensure IndexedDB voter data is fully hydrated before mounting
initVoterStorage().finally(() => {
  app.use(vuetify).mount('#app')
})

