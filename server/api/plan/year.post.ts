import { energy } from "../utils/energy";

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  try {
    const res  = await energy.post("api/plan/year", body)
    return res.data
  } catch (error) {
    console.error("Failed to save year plan:", error)
  }
})
