import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
     const query = getQuery(event);
    const start = query.start;
    const end = query.end;
    const code = query.code;
    try {
        const res = await energy.get("api/data/dam", {
            params: {
                start,
                end,
                code
            },
        });
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});