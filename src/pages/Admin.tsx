import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { isCommitteeAdmin } from '../lib/committeeAdmin'
import { supabase } from '../lib/supabase'
import type { Contact, FamilyMember, Landmark, LandmarkCategory, Profile } from '../types/database'
import { Button, Card, Input, TextArea } from '../components/ui'

export function AdminPage() {
  const { t } = useTranslation()
  const { user, profile, refreshProfile } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [landmarks, setLandmarks] = useState<Landmark[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string | null>(null)
  const [familyFlatFilter, setFamilyFlatFilter] = useState('')
  const [flatFilter, setFlatFilter] = useState('')

  const [cName, setCName] = useState('')
  const [cRole, setCRole] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cEmail, setCEmail] = useState('')

  const [lName, setLName] = useState('')
  const [lCat, setLCat] = useState<LandmarkCategory>('school')
  const [lAddr, setLAddr] = useState('')
  const [lNotes, setLNotes] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, coRes, laRes, fmRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').order('sort_order', { ascending: true }),
        supabase.from('landmarks').select('*').order('sort_order', { ascending: true }),
        supabase.from('family_members').select('*').order('created_at', { ascending: false }),
      ])
      if (pRes.error) console.error('admin.profiles', pRes.error)
      if (coRes.error) console.error('admin.contacts', coRes.error)
      if (laRes.error) console.error('admin.landmarks', laRes.error)
      if (fmRes.error) console.error('admin.family_members', fmRes.error)
      if (pRes.data) setProfiles(pRes.data as Profile[])
      if (coRes.data) setContacts(coRes.data as Contact[])
      if (laRes.data) setLandmarks(laRes.data as Landmark[])
      if (fmRes.data) setFamilyMembers(fmRes.data as FamilyMember[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isCommitteeAdmin(user, profile)) void load()
  }, [user, profile, load])

  if (!profile) {
    return <p className="text-stone-500">{t('common.loading')}</p>
  }

  if (!isCommitteeAdmin(user, profile)) {
    return <Navigate to="/app" replace />
  }

  async function approve(id: string) {
    setStatus(null)
    const { error } = await supabase.from('profiles').update({ role: 'member' }).eq('id', id)
    if (error) {
      console.error('admin.approve', error)
      setStatus(`Approve failed: ${error.message}`)
      return
    }
    setStatus('User approved.')
    void load()
    void refreshProfile()
  }

  async function removeAccess(id: string) {
    setStatus(null)
    const { error } = await supabase.from('profiles').update({ role: 'pending' }).eq('id', id)
    if (error) {
      console.error('admin.removeAccess', error)
      setStatus(`Remove access failed: ${error.message}`)
      return
    }
    setStatus('User access removed (set to pending).')
    void load()
  }

  async function setUserRole(id: string, role: 'member' | 'admin') {
    setStatus(null)
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) {
      console.error('admin.setUserRole', error)
      setStatus(`Role update failed: ${error.message}`)
      return
    }
    setStatus(role === 'admin' ? 'User promoted to admin.' : 'User set to member.')
    void load()
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user profile? This cannot be undone.')) return
    setStatus(null)
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) {
      console.error('admin.deleteUser', error)
      setStatus(`Delete user failed: ${error.message}`)
      return
    }
    setStatus('User deleted.')
    void load()
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    const maxSort = contacts.reduce((m, c) => Math.max(m, c.sort_order), 0)
    const { error } = await supabase.from('contacts').insert({
      name: cName.trim(),
      role_label: cRole.trim() || null,
      phone: cPhone.trim() || null,
      email: cEmail.trim() || null,
      sort_order: maxSort + 1,
    })
    if (error) {
      console.error('admin.addContact', error)
      setStatus(`Add contact failed: ${error.message}`)
      return
    }
    setCName('')
    setCRole('')
    setCPhone('')
    setCEmail('')
    setStatus('Contact added.')
    void load()
  }

  async function deleteContact(id: string) {
    if (!confirm(t('common.delete'))) return
    setStatus(null)
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) {
      console.error('admin.deleteContact', error)
      setStatus(`Delete contact failed: ${error.message}`)
      return
    }
    setStatus('Contact deleted.')
    void load()
  }

  async function addLandmark(e: React.FormEvent) {
    e.preventDefault()
    setStatus(null)
    const maxSort = landmarks.reduce((m, l) => Math.max(m, l.sort_order), 0)
    const { error } = await supabase.from('landmarks').insert({
      name: lName.trim(),
      category: lCat,
      address: lAddr.trim() || null,
      notes: lNotes.trim() || null,
      sort_order: maxSort + 1,
    })
    if (error) {
      console.error('admin.addLandmark', error)
      setStatus(`Add landmark failed: ${error.message}`)
      return
    }
    setLName('')
    setLAddr('')
    setLNotes('')
    setLCat('school')
    setStatus('Landmark added.')
    void load()
  }

  async function deleteLandmark(id: string) {
    if (!confirm(t('common.delete'))) return
    setStatus(null)
    const { error } = await supabase.from('landmarks').delete().eq('id', id)
    if (error) {
      console.error('admin.deleteLandmark', error)
      setStatus(`Delete landmark failed: ${error.message}`)
      return
    }
    setStatus('Landmark deleted.')
    void load()
  }

  function toCsvValue(v: string | null | undefined) {
    const s = String(v ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  function downloadResidentsCsv() {
    const rows = filteredProfiles.map((p) =>
      [
        p.full_name,
        p.flat_number,
        p.phone ?? '',
        p.email ?? '',
        p.role,
        p.created_at,
      ].map(toCsvValue),
    )
    const header = ['full_name', 'flat_number', 'phone', 'email', 'role', 'created_at']
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const suffix = flatFilter.trim() ? `-flat-${flatFilter.trim()}` : ''
    a.href = url
    a.download = `residents${suffix}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setStatus(`Exported ${filteredProfiles.length} resident records.`)
  }

  const filteredProfiles = profiles.filter((p) =>
    flatFilter.trim() === '' ? true : p.flat_number.toLowerCase().includes(flatFilter.trim().toLowerCase()),
  )

  const pending = profiles.filter((p) => p.role === 'pending')
  const filteredFamilyMembers = familyMembers.filter((m) =>
    familyFlatFilter.trim() === ''
      ? true
      : m.flat_number.toLowerCase().includes(familyFlatFilter.trim().toLowerCase()),
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('admin.title')}</h1>
      {loading && <p className="mt-4 text-stone-500">{t('common.loading')}</p>}
      {status && <p className="mt-3 text-sm text-stone-700">{status}</p>}

      <section id="pending" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-stone-900">{t('admin.pendingUsers')}</h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-stone-500">{t('admin.noPending')}</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pending.map((p) => (
              <li key={p.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-medium text-stone-900">{p.full_name}</p>
                    <p className="text-sm text-stone-600">
                      {p.flat_number} · {p.phone || '—'}
                      {p.email && (
                        <>
                          {' '}
                          · <span className="font-mono text-xs">{p.email}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <Button onClick={() => void approve(p.id)}>{t('admin.approve')}</Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="contacts" className="mt-12 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">{t('admin.allProfiles')}</h2>
          <div className="flex items-center gap-2">
            <Input
              value={flatFilter}
              onChange={(e) => setFlatFilter(e.target.value)}
              placeholder="Filter by flat (e.g. 609)"
            />
            <Button onClick={downloadResidentsCsv}>Download CSV</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-700">{t('contacts.name')}</th>
                <th className="px-4 py-3 font-medium text-stone-700">{t('dashboard.flat')}</th>
                <th className="px-4 py-3 font-medium text-stone-700">{t('auth.email')}</th>
                <th className="px-4 py-3 font-medium text-stone-700">{t('dashboard.role')}</th>
                <th className="px-4 py-3 font-medium text-stone-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((p) => (
                <tr key={p.id} className="border-b border-stone-100">
                  <td className="px-4 py-3">{p.full_name}</td>
                  <td className="px-4 py-3">{p.flat_number || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.email || '—'}</td>
                  <td className="px-4 py-3">{p.role}</td>
                  <td className="px-4 py-3">
                    {p.id === profile.id ? (
                      <span className="text-xs text-stone-500">Current user</span>
                    ) : p.role === 'member' || p.role === 'admin' ? (
                      <div className="flex flex-wrap gap-2">
                        {p.role === 'member' ? (
                          <Button onClick={() => void setUserRole(p.id, 'admin')}>Make admin</Button>
                        ) : (
                          <Button onClick={() => void setUserRole(p.id, 'member')}>
                            Remove admin
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => void removeAccess(p.id)}>
                          Remove access
                        </Button>
                      </div>
                    ) : p.role === 'pending' ? (
                      <Button variant="danger" onClick={() => void deleteUser(p.id)}>
                        Delete user
                      </Button>
                    ) : (
                      <span className="text-xs text-stone-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-stone-500">{t('admin.emailHelp')}</p>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-stone-900">Family Member Records</h2>
          <div className="w-full sm:w-64">
            <Input
              value={familyFlatFilter}
              onChange={(e) => setFamilyFlatFilter(e.target.value)}
              placeholder="Filter by flat (e.g. 609)"
            />
          </div>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-700">Flat</th>
                <th className="px-4 py-3 font-medium text-stone-700">Name</th>
                <th className="px-4 py-3 font-medium text-stone-700">Relation</th>
                <th className="px-4 py-3 font-medium text-stone-700">Phone</th>
                <th className="px-4 py-3 font-medium text-stone-700">Added on</th>
              </tr>
            </thead>
            <tbody>
              {filteredFamilyMembers.map((m) => (
                <tr key={m.id} className="border-b border-stone-100">
                  <td className="px-4 py-3">{m.flat_number || '—'}</td>
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3">{m.relation || '—'}</td>
                  <td className="px-4 py-3">{m.phone || '—'}</td>
                  <td className="px-4 py-3">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-stone-900">{t('admin.contacts')}</h2>
        <Card className="mt-4">
          <form onSubmit={addContact} className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('contacts.name')}
              </label>
              <Input required value={cName} onChange={(e) => setCName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('contacts.role')}
              </label>
              <Input value={cRole} onChange={(e) => setCRole(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('contacts.phone')}
              </label>
              <Input value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('contacts.email')}
              </label>
              <Input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">{t('admin.addContact')}</Button>
            </div>
          </form>
        </Card>
        <ul className="mt-4 space-y-2">
          {contacts.map((c) => (
            <li key={c.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <strong>{c.name}</strong> — {c.role_label || '—'}
                </span>
                <Button variant="danger" onClick={() => void deleteContact(c.id)}>
                  {t('common.delete')}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-stone-900">{t('admin.landmarks')}</h2>
        <Card className="mt-4">
          <form onSubmit={addLandmark} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('landmarks.name')}
              </label>
              <Input required value={lName} onChange={(e) => setLName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('landmarks.category')}
              </label>
              <select
                value={lCat}
                onChange={(e) => setLCat(e.target.value as LandmarkCategory)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900"
              >
                <option value="school">{t('landmarks.school')}</option>
                <option value="hospital">{t('landmarks.hospital')}</option>
                <option value="other">{t('landmarks.other')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('landmarks.address')}
              </label>
              <Input value={lAddr} onChange={(e) => setLAddr(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                {t('landmarks.notes')}
              </label>
              <TextArea value={lNotes} onChange={(e) => setLNotes(e.target.value)} />
            </div>
            <Button type="submit">{t('admin.addLandmark')}</Button>
          </form>
        </Card>
        <ul className="mt-4 space-y-2">
          {landmarks.map((l) => (
            <li key={l.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>
                  <strong>{l.name}</strong> ({l.category})
                </span>
                <Button variant="danger" onClick={() => void deleteLandmark(l.id)}>
                  {t('common.delete')}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
