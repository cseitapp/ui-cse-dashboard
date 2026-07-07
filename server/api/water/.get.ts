
import { energy } from "../utils/energy";
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    try {
        const res = await energy.get("api/water", {
             params: {
                code: query.code,  // forward to upstream API
                date: query.date
            }
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});