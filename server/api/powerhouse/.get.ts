import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);  // already there ✓

    try {
        const res = await energy.get("api/dam/powerhouse", {
            params: {
                dam_code: query.dam_code  // forward to upstream API
            }
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});