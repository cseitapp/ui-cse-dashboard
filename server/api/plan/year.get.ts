
import { energy } from "../utils/energy";
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const year = query.year;
    try {
        const res = await energy.get("api/plan/year", {
            params: {
                year
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});