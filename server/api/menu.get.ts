// server/api/menu.get.ts
import axios from 'axios'

export default defineEventHandler(async (event) => {
    try {
        const query = getQuery(event) // get query params
        const roleId = query.roleId
        const projectId = process.env.PROJECT_ID
        const status = 1

        const url = `${process.env.API_URL}/api/menu/role?project_id=${projectId}&role_id=${roleId}&status=${status}`
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
