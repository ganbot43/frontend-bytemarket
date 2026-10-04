// Protege el panel /admin: solo admin y superadmin
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  await fetch()
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  const role = user.value?.role
  if (role !== 'admin' && role !== 'superadmin') {
    return navigateTo('/mi-cuenta')
  }
})
