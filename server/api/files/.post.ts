import { defineEventHandler, readMultipartFormData } from 'h3'
import { energy } from '../utils/energy'
import FormData from 'form-data'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData) {
      throw new Error('No form data received')
    }

    const form = new FormData()

    for (const part of formData) {
      if (!part.name) continue

      if (part.filename) {
        // ✅ File field
        form.append(part.name, part.data, {
          filename: part.filename,
          contentType: part.type,
        })
      } else {
        // ✅ Text fields (dam_id, old_file, date, code, section, status, created_by ...)
        form.append(part.name, part.data.toString())
      }
    }

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