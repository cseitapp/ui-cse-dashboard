// server/api/logout.post.ts
import { defineEventHandler, deleteCookie } from 'h3'
import { navigateTo } from 'nuxt/app'

export default defineEventHandler((event) => {
  // Delete the token cookie
  deleteCookie(event, process.env.TOKEN , { path: '/' })
  // navigateTo('/login')
  return { success: true }
})
