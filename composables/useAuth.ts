import axios from 'axios'


//set user state
export const useAuthUser = () => {
  const user = useState<any>('user', () => null)
  return user
}
//call username
export const fetchUser = async (event?: any) => {
  const user = useAuthUser()
  try {
    const res = await $fetch('/api/check-token', {
      headers: event?.node?.req?.headers
    })
    if (res.valid) {
      user.value = res.data
    } else {
      user.value = null
    }
    return res
  } catch (error) {
    return { valid: false, message: error }
  }
}

export const useLogin = async (username: string, password: string) => {
  try {
    const res = await axios.post('/api/login', { username, password })

    // Axios puts the response data in res.data
    if (res.data.success) {
      ///create api for check user in DB if no create new if have modify
      const userRes = await axios.post('/api/user', res.data.user)
      useAuthUser().value = res.data.user
      const roleId = res.data.user.ROLE_ID
      if (roleId) {
        try {
          const menuRes = await axios.get('/api/menu', { params: { roleId } })
          if (menuRes.data.ERROR_CODE === '00') {
            localStorage.setItem('menu', JSON.stringify(menuRes.data.DATA))
          } else {
            localStorage.removeItem('menu')
          }
        } catch (menuErr) {
          console.error('Failed to fetch menu after login', menuErr)
          localStorage.removeItem('menu')
        }
      }
    }
    return res.data
  } catch (err: any) {
    // If API returns error response, try to get message
    const message = err.response?.data?.message || 'Server error'
    return { success: false, message }
  }
}

export const useLogout = async () => {
  // Clear auth user in state
  useAuthUser().value = null

  // Call server API to clear httpOnly cookie
  const res = await $fetch('/api/logout', { method: 'POST' })
  if (res.success) {
    window.location.href = '/login'
  }
}
