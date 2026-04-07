// import this after install `@mdi/font` package
import '@mdi/font/css/materialdesignicons.css'
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";


import 'vuetify/styles'
import { createVuetify } from 'vuetify'

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    components,
    directives,
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
