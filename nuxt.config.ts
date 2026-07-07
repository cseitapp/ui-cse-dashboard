import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
export default defineNuxtConfig({
  //...
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    plugins: [
      vuetify({ autoImport: true }),
    ],
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  runtimeConfig: {
    // Backend API URL (can be HTTP)
    VITE_URL_PATH_TICKET: process.env.VITE_URL_PATH_TICKET,

    // Public (frontend can read if needed)
    public: {
      VITE_URL_PATH_TICKET: process.env.VITE_URL_PATH_TICKET,
    },
  },
  compatibilityDate: '2025-07-15',
  css: ['~~/assets/css/main.css'],
  app: {
    baseURL:'/',
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Lao&display=swap' },
        { rel: 'icon', type: 'image/png', href: '/logo.png' },

      ]
    }
  },
})
