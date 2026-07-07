import { energy } from "../../utils/energy";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody(event);

  try {
    const res = await energy.put(`/api/water/${id}`, body);

    return res.data;
  } catch (error) {
    console.error("API Error:", error?.response?.data || error.message);

    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.response?.data?.message || "Failed to update plan",
    });
  }
});