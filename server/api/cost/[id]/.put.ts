import { energy } from "../../utils/energy";

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;
    const body = await readBody(event);

    try {
        const res = await energy.put(`api/cost/${id}`, body);
        return res.data;
    } catch (error) {
        console.error("API Error:", error.message);
    }
});