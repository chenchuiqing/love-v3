import { ApiError, apiRequest } from './client'

interface UserInfo {
  id: string
  name: string
}

let cachedUser: UserInfo | null = null
let hasChecked = false

export const getUserOptions = async (): Promise<UserInfo[]> => {
  const result = await apiRequest<{ data: UserInfo[] }>('/api/auth/user/options')
  return result.data
}

export const userLogin = async (name: string, password: string): Promise<UserInfo> => {
  const result = await apiRequest<{ data: UserInfo }>('/api/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  })
  cachedUser = result.data
  hasChecked = true
  return result.data
}

export const userLogout = async (): Promise<void> => {
  await apiRequest<{ ok: true }>('/api/auth/user/logout', {
    method: 'POST',
  })
  cachedUser = null
  hasChecked = true
}

export const checkUserSession = async (force = false): Promise<UserInfo | null> => {
  if (!force && hasChecked) {
    return cachedUser
  }

  try {
    const result = await apiRequest<{ data: UserInfo }>('/api/auth/user/me')
    cachedUser = result.data
    hasChecked = true
    return result.data
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      cachedUser = null
      hasChecked = true
      return null
    }
    throw error
  }
}

export const getCachedUser = (): UserInfo | null => cachedUser
