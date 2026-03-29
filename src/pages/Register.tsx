import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { User } from '@supabase/supabase-js'
import { useAuth } from '../hooks/useAuth'
import { PublicHeader } from '../components/PublicHeader'
import { Button, Card, Input } from '../components/ui'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuth()
  const [searchParams] = useSearchParams()
  const familyMode = searchParams.get('family') === '1'

  useEffect(() => {
    if (authLoading || !user) return
    if (familyMode) return
    if (!profile) {
      navigate('/account-issue', { replace: true })
      return
    }
    if (profile.role === 'pending') navigate('/pending', { replace: true })
    else navigate('/app', { replace: true })
  }, [authLoading, user, profile, navigate])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [flatNumber, setFlatNumber] = useState(searchParams.get('flat') ?? '')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function upsertPendingProfile(user: User, emailNorm: string) {
    const payload = {
      id: user.id,
      full_name: fullName.trim(),
      flat_number: flatNumber.trim(),
      phone: phone.trim() || null,
      email: emailNorm,
      role: 'pending' as const,
    }
    const { error: upsertErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
    if (upsertErr) {
      // Keep sign-up successful even if profile upsert is blocked by RLS/legacy policy.
      console.error('register.upsertPendingProfile', upsertErr)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) return
    setError(null)
    setLoading(true)
    const emailNorm = email.trim().toLowerCase()
    const passwordRaw = password.trim()

    if (!emailNorm || !passwordRaw) {
      setError('Please enter a valid email and password.')
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: emailNorm,
      password: passwordRaw,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName.trim(),
          flat_number: flatNumber.trim(),
          phone: phone.trim() || undefined,
        },
      },
    })
    setLoading(false)
    if (err) {
      const m = err.message ?? ''
      const isNetwork =
        /failed to fetch|networkerror|load failed|network request failed/i.test(m)
      setError(isNetwork ? t('common.networkError') : m)
      return
    }

    if (data.user) {
      await upsertPendingProfile(data.user, emailNorm)
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <div className="mx-auto max-w-md px-4 py-12">
          <Card>
            <h1 className="text-xl font-bold text-stone-900">{t('auth.registerTitle')}</h1>
            <p className="mt-3 text-stone-600">{t('auth.checkEmail')}</p>
            <p className="mt-3 text-sm text-stone-500">{t('pending.body')}</p>
            <Link to="/login" className="mt-4 inline-block text-brand-700 underline">
              {t('nav.signIn')}
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-stone-900">{t('auth.registerTitle')}</h1>
          <p className="mt-1 text-sm text-stone-600">{t('auth.registerSubtitle')}</p>
          <p className="mt-2 text-sm">
            <Link to="/login" className="text-brand-700 underline underline-offset-2">
              {t('auth.hasAccount')}
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('auth.fullName')}
              </label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('auth.flatNumber')}
              </label>
              <Input
                required
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('auth.phone')}
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={6}
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
              {loading ? t('common.loading') : t('nav.register')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
