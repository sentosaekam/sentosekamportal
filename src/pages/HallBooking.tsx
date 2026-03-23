import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { rangesOverlap } from '../lib/hall'
import type { HallBooking } from '../types/database'
import { Button, Card, Input } from '../components/ui'

export function HallBookingPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState<HallBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('hall_bookings')
      .select('*')
      .order('start_at', { ascending: true })
    if (!err && data) setBookings(data as HallBooking[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !profile) return
    setError(null)
    const startD = new Date(start)
    const endD = new Date(end)
    if (!(endD > startD)) {
      setError(t('hall.invalidRange'))
      return
    }
    for (const b of bookings) {
      const bs = parseISO(b.start_at)
      const be = parseISO(b.end_at)
      if (rangesOverlap(startD, endD, bs, be)) {
        setError(t('hall.overlapError'))
        return
      }
    }
    setSaving(true)
    const { error: err } = await supabase.from('hall_bookings').insert({
      user_id: user.id,
      start_at: startD.toISOString(),
      end_at: endD.toISOString(),
      title: title.trim() || null,
    })
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setTitle('')
    setStart('')
    setEnd('')
    void load()
  }

  async function removeBooking(id: string) {
    if (!confirm(t('hall.remove'))) return
    await supabase.from('hall_bookings').delete().eq('id', id)
    void load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('hall.title')}</h1>
      <p className="mt-1 text-stone-600">{t('hall.subtitle')}</p>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">{t('hall.newBooking')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('hall.purpose')}
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('hall.start')}
            </label>
            <Input
              type="datetime-local"
              required
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('hall.end')}
            </label>
            <Input
              type="datetime-local"
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
          {error && (
            <p className="sm:col-span-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? t('common.loading') : t('common.submit')}
            </Button>
          </div>
        </form>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-stone-900">{t('hall.upcoming')}</h2>
      {loading ? (
        <p className="mt-4 text-stone-500">{t('common.loading')}</p>
      ) : bookings.length === 0 ? (
        <p className="mt-4 text-stone-500">{t('hall.noBookings')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-medium text-stone-900">
                    {b.title || t('hall.title')}
                  </p>
                  <p className="text-sm text-stone-600">
                    {format(parseISO(b.start_at), 'PPp')} — {format(parseISO(b.end_at), 'PPp')}
                  </p>
                </div>
                {(b.user_id === user?.id || profile?.role === 'admin') && (
                  <Button variant="danger" onClick={() => void removeBooking(b.id)}>
                    {t('hall.remove')}
                  </Button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
