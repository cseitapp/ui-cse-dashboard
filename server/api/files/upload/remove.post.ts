import { defineEventHandler, readBody } from 'h3'
import { api } from '../../utils/api'


export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const res = await api.post('api/files/remove/folder', body)
    return {
      ERROR_CODE: res.data.ERROR_CODE,
      ERROR_DESC: res.data.ERROR_DESC,
      DATA: res.data.DATA
    };
  } catch (err) {
    console.error('API error:', err)
    return { success: false, error: 'Something went wrong' }
  }
})
