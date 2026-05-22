export default defineNuxtPlugin(() => {
  const token = useCookie('auth_token')

  globalThis.$fetch = $fetch.create({
    onResponseError({ response }) {
      if (response.status === 401 && token.value) {
        token.value = null
        navigateTo('/login')
      }
    }
  })
})
