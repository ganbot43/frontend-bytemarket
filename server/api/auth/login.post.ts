export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<{ email?: string; password?: string }>(event)
  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Completa tu correo y tu contraseña.' })
  }
  const user = await loginAgainstGateway(event, email, password)
  return { user: { id: user.id, name: user.name, role: user.role } }
})
