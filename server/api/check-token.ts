import { defineEventHandler, getCookie } from 'h3'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

export default defineEventHandler((event) => {
  const token = getCookie(event, process.env.TOKEN)
  // return token;
  if (!token) {
    return { valid: false, message: 'No token' }
  }
  try {
    const payload = jwt.verify(token, SECRET) // throws if expired/invalid
     const newMaxAge = 60 * 60 // seconds
    setCookie(event, process.env.TOKEN, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: newMaxAge,
      path: '/',
    })
    return { valid: true, data: payload }
  } catch (err: any) {
    return { valid: false, message: err }
  }
})
