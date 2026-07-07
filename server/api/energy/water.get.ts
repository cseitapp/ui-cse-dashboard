import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const start = query.start;
    const end = query.end;
    const code = query.code;
    const type = query.type;
    const yearweek_start = query.yearweek_start;
    const yearweek_end = query.yearweek_end;

    try {
        const res = await energy.get("api/data/waterlevel", {
            params: {
                start,
                end,
                code,
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