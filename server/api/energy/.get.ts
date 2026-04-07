
import { energy } from "../utils/energy";
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const start = query.start;
    const end = query.end;
    try {
        const res = await energy.get("api/data/range", {
            params: {
                start,
                end,
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});