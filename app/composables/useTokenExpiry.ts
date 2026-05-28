const _isExpired = ref(false)
const _countdown = ref(5)
let _timer: ReturnType<typeof setInterval> | null = null

export function useTokenExpiry() {
  function _redirect() {
    _isExpired.value = false
    if (_timer) { clearInterval(_timer); _timer = null }
    document.cookie = 'auth_token=; Max-Age=0; path=/'
    navigateTo('/login')
  }

  function triggerExpiry() {
    if (_isExpired.value) return
    _isExpired.value = true
    _countdown.value = 5

    _timer = setInterval(() => {
      _countdown.value--
      if (_countdown.value <= 0) _redirect()
    }, 1000)
  }

  function skipCountdown() {
    _redirect()
  }

  return {
    isExpired:    readonly(_isExpired),
    countdown:    readonly(_countdown),
    triggerExpiry,
    skipCountdown,
  }
}

export function isTokenError(err: any): boolean {
  return err?.response?.status === 401 || err?.data?.statusCode === 401
}
