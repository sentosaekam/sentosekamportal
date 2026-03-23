import { useTranslation } from 'react-i18next'
import { supabaseConfigured } from '../lib/supabase'

export function SetupBanner() {
  const { t } = useTranslation()
  if (supabaseConfigured) return null
  return (
    <div
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900"
      role="status"
    >
      {t('common.setupRequired')}
    </div>
  )
}
