import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  // @ts-ignore
  $pinia.use(createPersistedState())
})
