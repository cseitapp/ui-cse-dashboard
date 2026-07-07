
import { energy } from "../utils/energy";
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const dateselect = query.dateselect as string;
    try {
        const res = await energy.get("api/data/all", {
            params: {
                dateselect
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});