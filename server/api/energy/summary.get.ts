
import { energy } from "../utils/energy";
export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const start_date = query.start_date;
    const end_date = query.end_date;
    const type = query.type;
    const dam_code = query.dam_code;
    const yearweek = query.yearweek;
    try {
        const res = await energy.get("api/data/summary", {
            params: {
                start_date,
                end_date,
                type,
                dam_code,
                ...(yearweek ? { yearweek } : {}),
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});