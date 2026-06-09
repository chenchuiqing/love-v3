import { randomUUID } from 'node:crypto'

import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import type { Context, MiddlewareHandler } from 'hono'

import { env, findUserById } from './config'

const SESSION_COOKIE_PATH = '/'

export interface UserSession {
  sid: string
  userId: string
  userName: string
  iat: number
}

export interface AppVariables {
  userSession: UserSession
}

const isSecure = (c: Context): boolean => {
  return c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https'
}

const encodeSession = (session: UserSession): string => {
  return Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url')
}

const decodeSession = (value: string): UserSession | null => {
  try {
    const raw = Buffer.from(value, 'base64url').toString('utf-8')
    const parsed = JSON.parse(raw) as Partial<UserSession>
    if (!parsed.sid || !parsed.userId || !parsed.userName || typeof parsed.iat !== 'number') {
      return null
    }
    return { sid: parsed.sid, userId: parsed.userId, userName: parsed.userName, iat: parsed.iat }
  } catch {
    return null
  }
}

const getSessionFromCookie = async (c: Context): Promise<UserSession | null> => {
  const signedValue = await getSignedCookie(c, env.SESSION_SECRET, env.USER_SESSION_COOKIE_NAME)
  if (!signedValue) {
    return null
  }

  const session = decodeSession(signedValue)
  if (!session) {
    return null
  }

  const expiresAt = session.iat + env.SESSION_MAX_AGE_SECONDS * 1000
  if (Date.now() > expiresAt) {
    return null
  }

  const user = findUserById(session.userId)
  if (!user) {
    return null
  }

  return session
}

export const createUserSession = async (c: Context, userId: string, userName: string): Promise<void> => {
  const session: UserSession = {
    sid: randomUUID(),
    userId,
    userName,
    iat: Date.now(),
  }

  await setSignedCookie(c, env.USER_SESSION_COOKIE_NAME, encodeSession(session), env.SESSION_SECRET, {
    path: SESSION_COOKIE_PATH,
    httpOnly: true,
    secure: isSecure(c),
    sameSite: 'Lax',
    maxAge: env.SESSION_MAX_AGE_SECONDS,
  })
}

export const clearUserSession = (c: Context): void => {
  deleteCookie(c, env.USER_SESSION_COOKIE_NAME, {
    path: SESSION_COOKIE_PATH,
    secure: isSecure(c),
    sameSite: 'Lax',
    httpOnly: true,
  })
}

export const getUserSession = async (c: Context): Promise<UserSession | null> => {
  return getSessionFromCookie(c)
}

export const requireUserAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const session = await getSessionFromCookie(c)
  if (!session) {
    return c.json({ message: '未登录或会话已失效' }, 401)
  }

  c.set('userSession', session)
  await next()
}
