import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
     const query = getQuery(event);
    const start = query.start;
    const end = query.end;
    const code = query.code;
    const type = query.type;
    try {
        const res = await energy.get("api/data/period", {
            params: {
                start,
                end,
                code,
                type,
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});