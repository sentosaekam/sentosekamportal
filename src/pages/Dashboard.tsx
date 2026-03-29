import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Car, MapPin, Shield, ShoppingBag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Card, Button, Input } from '../components/ui'
import type { FamilyMember } from '../types/database'

const links = [
  { to: '/app/hall', key: 'nav.hall', icon: CalendarDays },
  { to: '/app/parking', key: 'nav.parking', icon: Car },
  { to: '/app/contacts', key: 'nav.contacts', icon: MapPin },
  { to: '/app/market', key: 'nav.market', icon: ShoppingBag },
] as const

export function DashboardPage() {
  const { t } = useTranslation()
  const { profile, refreshProfile } = useAuth()
  const [flat, setFlat] = useState(profile?.flat_number ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [fmName, setFmName] = useState('')
  const [fmRelation, setFmRelation] = useState('')
  const [fmPhone, setFmPhone] = useState('')
  const [fmBirthDate, setFmBirthDate] = useState('')
  const [fmSaving, setFmSaving] = useState(false)

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

  async function loadFamilyMembers(ownerId: string) {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    if (error) {
      console.error('dashboard.family_members', error)
      return
    }
    setFamilyMembers((data ?? []) as FamilyMember[])
  }

  async function addFamilyMemberRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    const name = fmName.trim()
    if (!name) return
    setFmSaving(true)
    const { error } = await supabase.from('family_members').insert({
      owner_id: profile.id,
      added_by: profile.id,
      flat_number: profile.flat_number,
      name,
      relation: fmRelation.trim() || null,
      phone: fmPhone.trim() || null,
      birth_date: fmBirthDate || null,
    })
    setFmSaving(false)
    if (error) {
      console.error('dashboard.addFamilyMember', error)
      return
    }
    setFmName('')
    setFmRelation('')
    setFmPhone('')
    setFmBirthDate('')
    await loadFamilyMembers(profile.id)
  }

  async function deleteFamilyMember(id: string) {
    if (!confirm('Delete this family member record?')) return
    const { error } = await supabase.from('family_members').delete().eq('id', id)
    if (error) {
      console.error('dashboard.deleteFamilyMember', error)
      return
    }
    if (profile) await loadFamilyMembers(profile.id)
  }

  useEffect(() => {
    if (!profile) return
    void loadFamilyMembers(profile.id)
  }, [profile])

  function getAgeText(birthDate: string | null | undefined) {
    if (!birthDate) return '—'
    const dob = new Date(`${birthDate}T00:00:00`)
    if (Number.isNaN(dob.getTime())) return '—'
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const monthDiff = today.getMonth() - dob.getMonth()
    const dayDiff = today.getDate() - dob.getDate()
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1
    return `${age}`
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

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">Family Members ({profile?.flat_number || '—'})</h2>
        <p className="mt-1 text-sm text-stone-600">
          Add family records under your flat. No login or admin approval is needed.
        </p>
        <form onSubmit={addFamilyMemberRecord} className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Name</label>
            <Input required value={fmName} onChange={(e) => setFmName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Relation</label>
            <Input value={fmRelation} onChange={(e) => setFmRelation(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Phone</label>
            <Input value={fmPhone} onChange={(e) => setFmPhone(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Birth date</label>
            <Input
              type="date"
              value={fmBirthDate}
              onChange={(e) => setFmBirthDate(e.target.value)}
            />
          </div>
          <div className="sm:col-span-4">
            <Button type="submit" disabled={fmSaving}>
              {fmSaving ? t('common.loading') : 'Add Member Record'}
            </Button>
          </div>
        </form>
        <ul className="mt-4 space-y-2">
          {familyMembers.length === 0 ? (
            <li className="text-sm text-stone-500">No family member records yet.</li>
          ) : (
            familyMembers.map((m) => (
              <li key={m.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span>
                    <strong>{m.name}</strong> — {m.relation || '—'} — {m.phone || '—'} — DOB:{' '}
                    {m.birth_date || '—'} — Age: {getAgeText(m.birth_date)}
                  </span>
                  <Button variant="danger" onClick={() => void deleteFamilyMember(m.id)}>
                    {t('common.delete')}
                  </Button>
                </Card>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
