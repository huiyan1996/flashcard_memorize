export const useAuth = () => {
  const user = useState('auth-user', () => null)
  const isAuthenticated = computed(() => Boolean(user.value))

  const fetchUser = async () => {
    try {
      const response = await $fetch('/api/auth/me', {
        headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
      })
      user.value = response.user
      return response.user
    } catch {
      user.value = null
      return null
    }
  }

  const login = async (credentials) => {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials,
    })

    user.value = response.user
    return response.user
  }

  const register = async (payload) => {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: payload,
    })

    user.value = response.user
    return response.user
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })

    user.value = null
    await navigateTo('/login')
  }

  return {
    user,
    isAuthenticated,
    fetchUser,
    login,
    register,
    logout,
  }
}
