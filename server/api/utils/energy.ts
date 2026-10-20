import axios from 'axios'

const configuredTimeout = Number(process.env.API_ENERGY_TIMEOUT_MS)
const requestTimeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout
  : 12_000

export const energy = axios.create({
  baseURL: process.env.API_ENERGY, // Your API base URL
  timeout: requestTimeout,
  headers: {
    'x-api-key': process.env.API_KEY, // Default header
    // 'Content-Type': 'application/json',
  },
  transitional: {
    clarifyTimeoutError: true,
  },
})
