/**
 * Proxy genérico: todo /api/** que no tenga handler propio en Nuxt
 * (auth, _auth/session, _nuxt_icon...) se reenvía al API Gateway,
 * adjuntando el JWT de la sesión como Bearer.
 */
export default defineEventHandler(async (event) => {
  const token = await sessionToken(event)
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  return proxyRequest(event, `${gatewayUrl()}${event.path}`, { headers })
})
