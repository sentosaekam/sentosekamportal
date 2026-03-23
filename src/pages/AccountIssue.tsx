import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { fetchProfileWithEnsureDetailed, supabase } from '../lib/supabase'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { Button, Card } from '../components/ui'

export function AccountIssuePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, loading, refreshProfile } = useAuth()
  const [busy, setBusy] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    if (loading || !profile) return
    if (profile.role === 'pending') navigate('/pending', { replace: true })
    else navigate('/app', { replace: true })
  }, [loading, profile, navigate])

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
          <h1 className="text-xl font-bold text-stone-900">{t('auth.accountIssueTitle')}</h1>
          <p className="mt-3 text-stone-600">{t('auth.accountIssueBody')}</p>
          <ul className="mt-4 list-inside list-disc text-sm text-stone-600">
            <li>{t('auth.accountIssueHint1')}</li>
            <li>{t('auth.accountIssueHint2')}</li>
            <li>{t('auth.accountIssueHint3')}</li>
          </ul>
          {lastError && (
            <p
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 whitespace-pre-wrap"
              role="alert"
            >
              {lastError}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              disabled={busy}
              onClick={() => {
                if (!user) return
                setBusy(true)
                setLastError(null)
                void (async () => {
                  const r = await fetchProfileWithEnsureDetailed(user.id)
                  await refreshProfile()
                  if (!r.profile && r.ensureRpcError) setLastError(r.ensureRpcError)
                  setBusy(false)
                })()
              }}
            >
              {busy ? t('common.loading') : t('auth.retry')}
            </Button>
            <Button variant="secondary" onClick={() => void supabase.auth.signOut()}>
              {t('nav.signOut')}
            </Button>
          </div>
          <p className="mt-6 text-sm text-stone-500">
            <Link to="/" className="text-brand-700 underline">
              {t('nav.home')}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
