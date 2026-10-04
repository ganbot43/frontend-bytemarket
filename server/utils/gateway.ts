import type { H3Event } from 'h3'

/** URL base del API Gateway (Spring Cloud Gateway) */
export function gatewayUrl(): string {
  const config = useRuntimeConfig()
  return (config.apiGatewayUrl as string) || 'http://localhost:8085'
}

/** Token JWT guardado en la sesión sellada de nuxt-auth-utils */
export async function sessionToken(event: H3Event): Promise<string | undefined> {
  const session = await getUserSession(event)
  return (session as any)?.secure?.token
}

const JWT_COOKIE = 'jwt_token'

export function setJwtCookie(event: H3Event, token: string) {
  setCookie(event, JWT_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 60 * 60 * 24,
  })
}

export function clearJwtCookie(event: H3Event) {
  deleteCookie(event, JWT_COOKIE, { path: '/' })
}

/** Login contra user-service y creación de la sesión Nuxt */
export async function loginAgainstGateway(event: H3Event, email: string, password: string) {
  const res = await $fetch<{ user: any; token: string; message?: string }>(
    `${gatewayUrl()}/api/auth/login`,
    { method: 'POST', body: { email, password } },
  ).catch((err: any) => {
    throw createError({
      statusCode: err?.response?.status || 401,
      message: err?.data?.message || 'Email o contraseña incorrectos',
    })
  })

  await setUserSession(event, {
    user: {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role,
    },
    secure: { token: res.token },
    loggedInAt: Date.now(),
  })
  setJwtCookie(event, res.token)

  return res.user
}
