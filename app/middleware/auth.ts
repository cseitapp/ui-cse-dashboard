import { useAuthUser, fetchUser } from '~~/composables/useAuth'

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useAuthUser()
  const nuxtApp = useNuxtApp()
  // Only fetch user if not in state
  if (!user.value) {
    const res = await fetchUser(nuxtApp.ssrContext?.event)
    if (!res.valid && to.path !== '/login') {
      return navigateTo('/login')
    }
  } else if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
