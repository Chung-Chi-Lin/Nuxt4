const POLL_INTERVAL = 3 * 60 * 1000 // 3 分鐘

export function useSessionGuard() {
  const token     = useCookie('auth_token')
  const sessionId = useCookie('session_id')
  let timer: ReturnType<typeof setInterval> | null = null

  async function checkSession(): Promise<void> {
    if (!token.value || !sessionId.value) return
    try {
      await $fetch('/api/auth/me', {
        headers: {
          Authorization:  `Bearer ${token.value}`,
          'x-session-id': sessionId.value,
        },
      })
    } catch (err: any) {
      const status = err?.response?.status ?? err?.data?.statusCode
      if (status === 401) {
        useTokenExpiry().triggerExpiry()
      }
    }
  }

  onMounted(() => {
    timer = setInterval(checkSession, POLL_INTERVAL)
  })

  onUnmounted(() => {
    if (timer) { clearInterval(timer); timer = null }
  })
}
