<script setup lang="ts">
import { shallowRef } from 'vue';
import { useCustomizerStore } from '../../../stores/customizer';
import sidebarItems from './sidebarItem';

import NavGroupDD from './NavGroup/NavGroupDD.vue';

import NavItemDD from './NavItem/NavItemDD.vue';

import NavCollapseDD from './NavCollapse/NavCollapseDD.vue';

// import ExtraBox from './extrabox/ExtraBox.vue';
import Logo from '../logo/LogoMain.vue';

const customizer = useCustomizerStore();
const sidebarMenu = shallowRef(sidebarItems);
</script>

<template>
  <v-navigation-drawer left v-model="customizer.Sidebar_drawer" elevation="0" rail-width="75" mobile-breakpoint="lg" app
    class="leftSidebar" :rail="customizer.mini_sidebar" expand-on-hover>
    <!---Logo part -->

    <div class="pa-5">
      <!-- <h1>Posta Cloud</h1> -->
      <Logo />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <perfect-scrollbar class="scrollnavbar">
      <v-list class="pa-4">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu" :key="i">
          <!---Item Sub Header -->
          <NavGroupDD :item="item" v-if="item.header" :key="item.title" />
          <!---Item Divider -->
          <v-divider class="my-3" v-else-if="item.divider" />
          <!---If Has Child -->
          <NavCollapseDD class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <NavItemDD :item="item" v-else class="leftPadding" />
          <!---End Single Item-->
        </template>
      </v-list>
      <div class="pa-4">
        <!-- <ExtraBox /> -->
      </div>
      <div class="pa-4 text-center">
        <v-chip color="inputBorder" size="small"> v1.2.0 </v-chip>
      </div>
    </perfect-scrollbar>
  </v-navigation-drawer>
</template>

<style>
h1 {
  font-size: 1rem;
  color: #ff00aa;
  font-weight: bold;
  letter-spacing: 7px;
  text-transform: uppercase;
  text-shadow: 2px 2px 5px rgba(255, 0, 191, 0.384);
  background: linear-gradient(to right, #ff00bf, #9900ff);
  -webkit-background-clip: text;
  color: transparent;
  padding: 10px;
  transition: all 0.3s ease-in-out;
}

h1:hover {
  transform: scale(1.1);
  text-shadow: 2px 2px 10px rgba(0, 123, 255, 0.7);
}

</style>