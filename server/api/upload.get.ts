import { defineEventHandler } from 'h3'
import { api } from './utils/api'

export default defineEventHandler(async (event) => {
  try {
      const query = getQuery(event);
  
      // Call your Express API
      const res = await api.get('/api/files',{
        params: {path : query.path}
      });
  
      // Return the API response
      return {
          ERROR_CODE: res.data.ERROR_CODE,
          ERROR_DESC: res.data.ERROR_DESC,
          DATA: res.data.DATA
        };
    } catch (err) {
      console.error("API call error:", err);
      return {
        success: false,
        error: "Something Wrong"
      };
    }
})
