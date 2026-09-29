// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  icon: {
    serverBundle: {
      collections: ['lucide', 'simple-icons']
    }
  },
  app: {
    head: {
      title: process.env.NUXT_PUBLIC_APP_NAME || 'Aktivitas Harian',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5' },
        { name: 'description', content: 'Aplikasi Pencatatan Aktivitas Harian' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    // Turso
    tursoUrl: '',
    tursoAuthToken: '',

    // Session
    sessionSecret: '',
    sessionMaxAge: 86400,

    // Google Drive
    googleDriveServiceAccount: '',

    // App
    appUrl: process.env.NUXT_APP_URL || '',
    appName: process.env.NUXT_PUBLIC_APP_NAME || 'Aktivitas Harian',

    public: {
      uploadMaxSize: 2097152 // 2MB
    }
  },
  nitro: {
    bodySize: '25MB',
    routeRules: {
      '/api/**': { csr: false }
    }
  }
})