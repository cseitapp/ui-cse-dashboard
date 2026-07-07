import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);

  const type = query.type;
  const start_date = query.start_date;
  const end_date = query.end_date;
  const code = query.code;

  try {
    const res = await energy.get("/api/plan", {
      params: {
        type,
        start_date,
        end_date,
        code,
      },
    });

    return res.data;
  } catch (error) {
    console.error("API Error:", error.message);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch plan",
    });
  }
});