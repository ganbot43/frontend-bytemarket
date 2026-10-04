export default defineEventHandler(async (event) => {
  const token = await sessionToken(event)
  if (token) {
    await $fetch(`${gatewayUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  await clearUserSession(event)
  clearJwtCookie(event)
  return { ok: true }
})
