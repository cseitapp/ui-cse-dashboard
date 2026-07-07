import { energy } from "../../utils/energy";

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
//   console.log(body)
  try {
    const res  = await energy.post("api/plan/year/edit", body)
    return res.data
  } catch (error) {
    console.error("Failed to save year plan:", error)
  }
})
