import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    try {
        const res = await energy.get("api/water/data", {
            params: {
                type: query.type,
                code: query.code,
                start_date: query.start,
                end_date: query.end,
            }
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});