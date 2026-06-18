const AUTH_EXPIRED_KEY = '__authExpiredError__'

/** catch 塊判斷：是否為 token 失效造成的錯誤（已由 authFetch 自動觸發過期 modal） */
export function isAuthExpiredError(err: unknown): boolean {
  return !!(err as any)?.[AUTH_EXPIRED_KEY]
}

/**
 * 包裝 $fetch，自動注入 Authorization header，
 * 遇到 401 時自動觸發 token 過期 modal 並拋出可辨識的錯誤。
 *
 * @param token - useCookie ref 或 computed ref（傳字串的 prop 請用 computed(() => props.token)）
 */
export function useAuthFetch(token: Ref<string | null | undefined> | ComputedRef<string | null | undefined>) {
  const { triggerExpiry } = useTokenExpiry()

  async function authFetch<T = any>(url: string, options: Record<string, any> = {}): Promise<T> {
    const { headers, ...rest } = options
    try {
      return await $fetch<T>(url, {
        ...rest,
        headers: {
          Authorization: `Bearer ${token.value ?? ''}`,
          ...headers,
        },
      })
    } catch (err: any) {
      if (isTokenError(err)) {
        triggerExpiry()
        err[AUTH_EXPIRED_KEY] = true
      }
      throw err
    }
  }

  return { authFetch }
}
