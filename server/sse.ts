import type { SSEStreamingApi } from 'hono/streaming'

type SSECallback = (data: unknown) => void | Promise<void>

const userListeners = new Map<string, Set<SSECallback>>()

export const addListener = (userId: string, callback: SSECallback): void => {
  if (!userListeners.has(userId)) {
    userListeners.set(userId, new Set())
  }
  userListeners.get(userId)!.add(callback)
}

export const removeListener = (userId: string, callback: SSECallback): void => {
  const listeners = userListeners.get(userId)
  if (listeners) {
    listeners.delete(callback)
    if (listeners.size === 0) {
      userListeners.delete(userId)
    }
  }
}

export const notifyUser = (userId: string, data: unknown): void => {
  const listeners = userListeners.get(userId)
  if (listeners) {
    for (const cb of listeners) {
      void Promise.resolve(cb(data)).catch(() => {})
    }
  }
}

export const isUserOnline = (userId: string): boolean => {
  const listeners = userListeners.get(userId)
  return !!listeners && listeners.size > 0
}
