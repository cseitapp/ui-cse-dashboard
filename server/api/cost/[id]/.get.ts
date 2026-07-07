import { energy } from "../../utils/energy";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {
        const res = await energy.get(`api/cost/${id}`);
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});