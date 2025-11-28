// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'


import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    defaults: {
      global: {
        style: {
          fontFamily: "PhetsaratOT, sans-serif",
        },
      },
    },
  })
  app.vueApp.use(vuetify)
})
