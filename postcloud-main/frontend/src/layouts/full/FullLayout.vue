<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import { SettingsIcon } from 'vue-tabler-icons';
import VerticalSidebarVue from './vertical-sidebar/VerticalSidebar.vue';
import VerticalHeaderVue from './vertical-header/VerticalHeader.vue';
import Customizer from './customizer/CustomizerPanel.vue';
import FooterPanel from './footer/FooterPanel.vue';
import { useCustomizerStore } from '../../stores/customizer';
import GlobalLoader from '@/components/shared/GlobalLoader.vue';
import AiChatWidget from '@/components/ai/AiChatWidget.vue';
const customizer = useCustomizerStore();
const route = useRoute();
const isAiChatPage = computed(() => route.name === 'AI Chat');
</script>

<template>
  <v-locale-provider>

    <v-app theme="PurpleTheme"
      :class="[customizer.fontTheme, customizer.mini_sidebar ? 'mini-sidebar' : '', customizer.inputBg ? 'inputWithbg' : '']">

      <Customizer />
      <VerticalSidebarVue />
      <VerticalHeaderVue v-if="!isAiChatPage" />
      <GlobalLoader />
      <AiChatWidget v-if="!isAiChatPage" />

      <v-main>

        <v-container fluid class="page-wrapper" :class="{ 'page-wrapper-ai-chat': isAiChatPage }">
          <div>
            <RouterView />
            <v-btn v-if="!isAiChatPage" class="customizer-btn" size="large" icon variant="flat" color="secondary"
              @click.stop="customizer.SET_CUSTOMIZER_DRAWER(!customizer.Customizer_drawer)">
              <SettingsIcon class="icon" />
            </v-btn>
          </div>
        </v-container>
        <v-container v-if="!isAiChatPage" fluid class="pt-0">
          <div>
            <FooterPanel />
          </div>
        </v-container>
      </v-main>
    </v-app>
  </v-locale-provider>
</template>

<style scoped>
.page-wrapper-ai-chat {
  height: 100vh;
  min-height: 0;
}

.page-wrapper-ai-chat > div {
  height: 100%;
}
</style>
