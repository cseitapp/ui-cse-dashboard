import { energy } from "../utils/energy";
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {

    // Call external API
    const res = await energy.get('/api/files')

    return {
      success: true,
      data: res.data
    }
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message)

    return {
      success: false,
      message: error.message,
      details: error.response?.data || null
    }
  }
})
