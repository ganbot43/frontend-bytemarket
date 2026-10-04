export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, string>>(event)

  await $fetch(`${gatewayUrl()}/api/auth/register`, { method: 'POST', body }).catch((err: any) => {
    throw createError({
      statusCode: err?.response?.status || 400,
      message: err?.data?.message || 'No se pudo completar el registro',
    })
  })

  // Tras registrarse, el cliente queda logueado directamente
  const user = await loginAgainstGateway(event, body.email, body.password)
  return { user: { id: user.id, name: user.name, role: user.role } }
})
