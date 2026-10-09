import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
     const query = getQuery(event);
    const date = query.dateselect;
    const dam = query.dam;
    try {
        const res = await energy.get("api/data/sum/dam", {
            params: {
                date,
                dam,
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});