// server/api/menu.get.ts
import axios from 'axios'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event) // get query params
        const branch = ''

        const url = `${process.env.API_URL}/api/branch?branch_code=${branch}`
        // console.log(url)
        const res = await axios.get(url, {
          headers: {
            'x-api-key': process.env.KEY_HEADER,
          },
        })
        if(res.data.ERROR_CODE === '00'){
            return res.data
        }
        return {success: false, data: []}
    } catch (err) {
        console.error('Failed to fetch menu:', err)
        return { success: false, data: [] }
    }
})
