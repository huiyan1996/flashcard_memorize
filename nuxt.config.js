export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 4,
  },
  routeRules: {
    '/api/**': { cache: false, swr: false },
  },
  nitro: {
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Credentials': 'true',
        },
      },
    },
  },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    jwtSecret: process.env.NUXT_JWT_SECRET || process.env.JWT_SECRET || 'flashmem-dev-secret-change-in-production',
    mongoUri: process.env.NUXT_MONGO_URI || process.env.MONGODB_URI || '',
    public: {
      appName: 'FlashMem',
    },
  },
  app: {
    head: {
      title: 'FlashMem',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        },
        { name: 'description', content: 'FlashMem - Flashcard memorization platform' },
      ],
    },
  },
})
