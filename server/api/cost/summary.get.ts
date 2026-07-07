import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const start_date = query.start_date;
    const end_date = query.end_date;
    const dam_code = query.dam_code;
    const type = query.type;
    const yearweek_start = query.yearweek_start;
    const yearweek_end = query.yearweek_end;

    try {
        const res = await energy.get("api/cost/summary", {
            params: {
                start_date,
                end_date,
                dam_code,
                type,
                ...(yearweek_start ? { yearweek_start } : {}),
                ...(yearweek_end ? { yearweek_end } : {}),
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});