export interface MsgOptions {
  duration?: number
  showClose?: boolean
  grouping?: boolean
  offset?: number
}

export function useMessage() {
  function success(message: string, options?: MsgOptions) {
    return ElMessage({ message, type: 'success', duration: 3000, grouping: true, ...options })
  }
  function error(message: string, options?: MsgOptions) {
    return ElMessage({ message, type: 'error', duration: 4000, showClose: true, grouping: true, ...options })
  }
  function warning(message: string, options?: MsgOptions) {
    return ElMessage({ message, type: 'warning', duration: 3500, showClose: true, grouping: true, ...options })
  }
  function info(message: string, options?: MsgOptions) {
    return ElMessage({ message, type: 'info', duration: 3000, grouping: true, ...options })
  }
  return { success, error, warning, info }
}
