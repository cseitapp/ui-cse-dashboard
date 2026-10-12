// server/api/menu.get.ts
import axios from 'axios'

export default defineEventHandler(async (event) => {
    try {
        const formatDate = (d?: string): string => {
            if (!d) return ''
            const [y, m, day] = d.split('-')
            return `${day}/${m}/${y}`
        }

        const query = getQuery(event) // get query params
        const code = query.code
        const start = formatDate(query.start as string)
        const end = formatDate(query.end as string)

        const url = `${process.env.API_RAINFALL}/api/dashboard/branch?branch_code=${code}&parameter_id=RainRt,Rain rateing&start_date=${start}&end_date=${end}`
        // console.log(url)
        const res = await axios.get(url, {
            headers: {
                'x-api-key': process.env.KEY_RAINFALL,
            },
        })
        if (res.data.ERROR_CODE === '00') {
            return res.data
        }
        return { success: false, data: [] }
    } catch (err) {
        console.error('Failed to fetch menu:', err)
        return { success: false, data: [] }
    }
})
