const MainRoutes = {
  path: '/',
  meta: {
    requiresAuth: true
  },
  redirect: '/dashboard/default',
  component: () => import('@/layouts/full/FullLayout.vue'),
  children: [
    {
      name: 'LandingPage',
      path: '',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'Default',
      path: 'dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'MainDashboard',
      path: 'main/dashboard/default',
      component: () => import('@/views/dashboards/default/DefaultDashboard.vue')
    },
    {
      name: 'Starter',
      path: 'starter',
      component: () => import('@/views/StarterPage.vue')
    },
    {
      name: 'Create Record',
      path: 'create/record',
      component: () => import('@/views/record/RecordForm.vue')
    },
    {
      name: 'Edit Record',
      path: 'edit/record/:recordId',
      component: () => import('@/views/record/RecordForm.vue')
    },
    {
      name: 'Records List',
      path: 'list/record',
      component: () => import('@/views/record/ListRecords.vue')
    },
    {
      name: 'AI Chat',
      path: 'ai-chat',
      component: () => import('@/views/ai/AiChatPage.vue')
    },
    {
      name: 'Tabler Icons',
      path: 'icons/tabler',
      component: () => import('@/views/utilities/icons/TablerIcons.vue')
    },
    {
      name: 'Material Icons',
      path: 'icons/material',
      component: () => import('@/views/utilities/icons/MaterialIcons.vue')
    },
    {
      name: 'Typography',
      path: 'utils/typography',
      component: () => import('@/views/utilities/typography/TypographyPage.vue')
    },
    {
      name: 'Shadows',
      path: 'utils/shadows',
      component: () => import('@/views/utilities/shadows/ShadowPage.vue')
    },
    {
      name: 'Colors',
      path: 'utils/colors',
      component: () => import('@/views/utilities/colors/ColorPage.vue')
    }
  ]
}

export default MainRoutes
