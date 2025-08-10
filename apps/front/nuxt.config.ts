import Theme from '@primeuix/themes/aura';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  typescript: { strict: true },
  modules: [
    '@pinia/nuxt',
    ['@primevue/nuxt-module', {
      options: { theme: { preset: Theme } },
      components: [
        'Button',
        'DataTable',
        'Column',
        'InputText',
        'Toast',
        'Dialog',
        'Calendar',
        'Dropdown',
        'InputNumber',
        'ConfirmDialog',
        'ProgressSpinner',
      ],
    }],
  ],
  app: {
    head: {
      title: 'OweLess',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:1313'
    }
  },
})
