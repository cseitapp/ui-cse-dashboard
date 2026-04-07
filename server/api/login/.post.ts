// server/api/login.post.ts
import { defineEventHandler, readBody } from 'h3'
import { api } from '../../api/utils/api'
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body
  const SECRET = process.env.JWT_SECRET

 try {
    const res = await api.post('/api/login', {
      project_id: process.env.PROJECT_ID,
      user_name: username,
      password: password,
      detail: 1,
    })

     if (res.data.ERROR_CODE !== '00') {
      return { success: false, message: res.data.ERROR_DESC || 'Login failed' }
    }

    // Sign JWT with DATA payload
    const payload = res.data.DATA[0] // assuming DATA is an array
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })

    // Set cookie
    setCookie(event, process.env.TOKEN , token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    return { success: true, user: payload}
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || error.message || 'API call failed' }
  }
})
