import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.API_URL, // Your API base URL
  headers: {
    'x-api-key': process.env.KEY_HEADER, // Default header
    'Content-Type': 'application/json',
  },
})
