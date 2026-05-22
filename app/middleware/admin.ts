export default defineNuxtRouteMiddleware(async () => {
  const token = useCookie('auth_token')
  if (!token.value) return navigateTo('/login')

  try {
    const { user } = await $fetch<{ user: { role?: string } }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (user?.role !== 'admin') return navigateTo('/map')
  } catch {
    return navigateTo('/login')
  }
})
