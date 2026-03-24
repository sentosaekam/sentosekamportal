import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { PublicHeader } from '../components/PublicHeader'
import { Button, Card, Input } from '../components/ui'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading || !user) return
    if (!profile) {
      navigate('/account-issue', { replace: true })
      return
    }
    if (profile.role === 'pending') navigate('/pending', { replace: true })
    else navigate('/app', { replace: true })
  }, [authLoading, user, profile, navigate])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) return
    setError(null)
    setLoading(true)
    const emailNorm = email.trim().toLowerCase()
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password,
      })
      if (err) {
        const m = err.message ?? ''
        const isNetwork =
          /failed to fetch|networkerror|load failed|network request failed/i.test(m)
        if (isNetwork) {
          setError(t('common.networkError'))
          return
        }
        const looksLikeWrongPassword =
          /invalid login credentials|invalid email or password/i.test(m)
        setError(looksLikeWrongPassword ? t('auth.invalidCredentials') : m)
        return
      }
      // Session is applied by the client; onAuthStateChange loads the profile. Do not await
      // refreshProfile() here — it duplicated that work and could leave the button stuck on “Loading…”.
      // Navigation runs from the effect below once authLoading + user + profile are ready.
    } catch (unknown) {
      const m = unknown instanceof Error ? unknown.message : String(unknown)
      const isNetwork =
        /failed to fetch|networkerror|load failed|network request failed/i.test(m)
      setError(isNetwork ? t('common.networkError') : m)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-stone-900">{t('auth.signInTitle')}</h1>
          <p className="mt-1 text-sm text-stone-600">
            <Link to="/register" className="text-brand-700 underline underline-offset-2">
              {t('auth.noAccount')}
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('auth.email')}
              </label>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('auth.password')}
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
              {loading ? t('common.loading') : t('nav.signIn')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
