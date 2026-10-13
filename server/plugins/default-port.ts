import { config as loadEnv } from 'dotenv'

export default defineNitroPlugin(() => {
  // Nitro does not load dotenv files when its generated entry point is run
  // directly, so load the project's production environment first.
  loadEnv({ path: '.env.local', quiet: true })

  // Keep a production-safe default when the environment file is unavailable.
  if (!process.env.NITRO_PORT && !process.env.PORT) {
    process.env.PORT = '4455'
  }
})
