import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
    try {
        const res = await energy.get("api/cost");
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});