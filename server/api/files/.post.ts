import { defineEventHandler, readMultipartFormData } from 'h3'
import { energy } from '../utils/energy'
import FormData from 'form-data'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw new Error('No file uploaded')
    }

    const file = formData.find(f => f.name === 'file')

    if (!file) {
      throw new Error('File is required')
    }

    // ✅ Create new FormData for external API
    const form = new FormData()
    form.append('file', file.data, file.filename)

    const res = await energy.post('/api/files/upload', form, {
      headers: form.getHeaders()
    })

    return {
      success: true,
      data: res.data
    }

  } catch (error: any) {
    console.error('Upload Error:', error.response?.data || error.message)

    return {
      success: false,
      message: error.message,
      details: error.response?.data || null
    }
  }
})