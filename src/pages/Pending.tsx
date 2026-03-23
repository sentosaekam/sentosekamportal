import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Button, Card } from '../components/ui'

export function PendingPage() {
  const { t } = useTranslation()
  const { refreshProfile } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200/80 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-bold text-stone-900">{t('common.appName')}</span>
          </div>
          <LanguageSwitcher />
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-stone-900">{t('pending.title')}</h1>
          <p className="mt-3 text-stone-600">{t('pending.body')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                void refreshProfile()
              }}
            >
              {t('pending.refresh')}
            </Button>
            <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
              {t('nav.signOut')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
