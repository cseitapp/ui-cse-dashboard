import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
     const query = getQuery(event);
    const date = query.dateselect;
    const dam = query.dam;
    const start =query.start_date;
    const end = query.end_date
    try {
        const res = await energy.get("api/data/sum/dam", {
            params: {
                date,
                dam,
                start,
                end
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});