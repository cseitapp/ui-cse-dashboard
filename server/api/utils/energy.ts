import axios from 'axios'

export const energy = axios.create({
  baseURL: process.env.API_ENERGY, // Your API base URL
  headers: {
    'x-api-key': process.env.API_KEY, // Default header
    // 'Content-Type': 'application/json',
  },
})
