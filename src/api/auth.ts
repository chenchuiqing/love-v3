import { ApiError, apiRequest } from './client'

let hasValidSession = false
let hasCheckedSession = false

export const loginAdmin = async (password: string): Promise<void> => {
  await apiRequest<{ ok: true }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
  hasValidSession = true
  hasCheckedSession = true
}

export const logoutAdmin = async (): Promise<void> => {
  await apiRequest<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
  })
  hasValidSession = false
  hasCheckedSession = true
}

export const checkAdminSession = async (force = false): Promise<boolean> => {
  if (!force && hasCheckedSession) {
    return hasValidSession
  }

  try {
    await apiRequest<{ ok: true }>('/api/auth/me')
    hasValidSession = true
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      hasValidSession = false
      hasCheckedSession = true
      return false
    }
    throw error
  }

  hasCheckedSession = true
  return true
}
