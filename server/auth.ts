import { randomUUID } from 'node:crypto'

import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie'
import type { Context, MiddlewareHandler } from 'hono'

import { env } from './config'

const SESSION_COOKIE_PATH = '/'

export interface AdminSession {
  sid: string
  iat: number
}

export interface AppVariables {
  adminSession: AdminSession
}

const isSecure = (c: Context): boolean => {
  return c.req.url.startsWith('https://') || c.req.header('x-forwarded-proto') === 'https'
}

const encodeSession = (session: AdminSession): string => {
  return Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url')
}

const decodeSession = (value: string): AdminSession | null => {
  try {
    const raw = Buffer.from(value, 'base64url').toString('utf-8')
    const parsed = JSON.parse(raw) as Partial<AdminSession>
    if (!parsed.sid || typeof parsed.iat !== 'number') {
      return null
    }
    return { sid: parsed.sid, iat: parsed.iat }
  } catch {
    return null
  }
}

const getSessionFromCookie = async (c: Context): Promise<AdminSession | null> => {
  const signedValue = await getSignedCookie(c, env.SESSION_SECRET, env.SESSION_COOKIE_NAME)
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

  return session
}

export const createAdminSession = async (c: Context): Promise<void> => {
  const session: AdminSession = {
    sid: randomUUID(),
    iat: Date.now(),
  }

  await setSignedCookie(c, env.SESSION_COOKIE_NAME, encodeSession(session), env.SESSION_SECRET, {
    path: SESSION_COOKIE_PATH,
    httpOnly: true,
    secure: isSecure(c),
    sameSite: 'Lax',
    maxAge: env.SESSION_MAX_AGE_SECONDS,
  })
}

export const clearAdminSession = (c: Context): void => {
  deleteCookie(c, env.SESSION_COOKIE_NAME, {
    path: SESSION_COOKIE_PATH,
    secure: isSecure(c),
    sameSite: 'Lax',
    httpOnly: true,
  })
}

export const requireAuth: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const session = await getSessionFromCookie(c)
  if (!session) {
    return c.json({ message: '未登录或会话已失效' }, 401)
  }

  c.set('adminSession', session)
  await next()
}
