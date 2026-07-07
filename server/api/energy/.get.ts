import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);

    try {
        const res = await energy.get("api/data", {
            params: query, // optional: pass query to API
        });

        return {
            success: true,
            data: res.data,
        };

    } catch (error) {
        console.error("API Error:", error.message);

        throw createError({
            statusCode: 500,
            statusMessage: error.message || "Internal Server Error",
        });
    }
});