import type { BusinessConfig } from '~/types'

export const useBusinessConfig = () => {
  return useState<BusinessConfig | null>('businessConfig', () => null)
}
