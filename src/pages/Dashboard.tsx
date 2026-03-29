import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Car, MapPin, Shield, ShoppingBag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Card, Button, Input } from '../components/ui'

const links = [
  { to: '/app/hall', key: 'nav.hall', icon: CalendarDays },
  { to: '/app/parking', key: 'nav.parking', icon: Car },
  { to: '/app/contacts', key: 'nav.contacts', icon: MapPin },
  { to: '/app/market', key: 'nav.market', icon: ShoppingBag },
] as const

export function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { profile, refreshProfile } = useAuth()
  const [flat, setFlat] = useState(profile?.flat_number ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFlat(profile.flat_number)
    setPhone(profile.phone ?? '')
  }, [profile])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ flat_number: flat.trim(), phone: phone.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    void refreshProfile()
  }

  async function addFamilyMember() {
    const flatParam = encodeURIComponent((profile?.flat_number ?? '').trim())
    navigate(`/register?flat=${flatParam}&family=1`)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('dashboard.title')}</h1>
      <p className="mt-2 text-stone-600">
        {t('dashboard.welcome', { name: profile?.full_name ?? '—' })}
      </p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <dt className="text-sm font-medium text-stone-500">{t('dashboard.flat')}</dt>
          <dd className="mt-1 text-lg font-semibold text-stone-900">
            {profile?.flat_number || '—'}
          </dd>
        </Card>
        <Card>
          <dt className="text-sm font-medium text-stone-500">{t('dashboard.role')}</dt>
          <dd className="mt-1 text-lg font-semibold text-stone-900">
            {profile?.role === 'admin'
              ? t('dashboard.roleAdmin')
              : t('dashboard.roleMember')}
          </dd>
        </Card>
      </dl>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">{t('dashboard.profileTitle')}</h2>
        <p className="mt-1 text-sm text-stone-600">{t('dashboard.profileHint')}</p>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('auth.flatNumber')}
            </label>
            <Input value={flat} onChange={(e) => setFlat(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('auth.phone')}
            </label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </Card>
      <h2 className="mt-10 text-lg font-semibold text-stone-900">
        {t('dashboard.quickLinks')}
      </h2>
      <div className="mt-3">
        <Button variant="secondary" onClick={() => void addFamilyMember()}>
          Add Family Member
        </Button>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map(({ to, key, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:bg-brand-50/50"
            >
              <Icon className="h-5 w-5 text-brand-600" />
              <span className="font-medium text-stone-800">{t(key)}</span>
            </Link>
          </li>
        ))}
        {profile?.role === 'admin' && (
          <>
            <li>
              <Link
                to="/app/admin#pending"
                className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                <Shield className="h-5 w-5 text-brand-700" />
                <span className="font-medium text-stone-800">Approve Users</span>
              </Link>
            </li>
            <li>
              <Link
                to="/app/admin#contacts"
                className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
              >
                <Shield className="h-5 w-5 text-brand-700" />
                <span className="font-medium text-stone-800">Contact Details</span>
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}
