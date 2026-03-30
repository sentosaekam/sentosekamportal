import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Vehicle } from '../types/database'
import { Button, Card, Input } from '../components/ui'

const MAX = 4

export function ParkingPage() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const flat = profile?.flat_number?.trim() ?? ''
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [reg, setReg] = useState('')
  const [vtype, setVtype] = useState('')
  const [parkingLocation, setParkingLocation] = useState<'basement' | 'ground_floor'>('basement')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!flat) {
      setVehicles([])
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase
      .from('vehicles')
      .select('*')
      .eq('flat_number', flat)
      .order('created_at', { ascending: true })
    if (!err && data) setVehicles(data as Vehicle[])
    setLoading(false)
  }, [flat])

  useEffect(() => {
    void load()
  }, [load])

  const count = vehicles.length
  const atLimit = count >= MAX

  const canAdd = useMemo(() => Boolean(user && flat && !atLimit), [user, flat, atLimit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !flat) return
    if (atLimit) {
      setError(t('parking.limitReached'))
      return
    }
    setError(null)
    setSaving(true)
    const { error: err } = await supabase.from('vehicles').insert({
      user_id: user.id,
      flat_number: flat,
      registration_number: reg.trim().toUpperCase(),
      vehicle_type: vtype.trim() || null,
      parking_location: parkingLocation,
    })
    setSaving(false)
    if (err) {
      if (err.message.includes('VEHICLE_LIMIT') || err.code === '23514') {
        setError(t('parking.limitDb'))
      } else {
        setError(err.message)
      }
      return
    }
    setReg('')
    setVtype('')
    setParkingLocation('basement')
    void load()
  }

  async function remove(id: string) {
    if (!confirm(t('parking.remove'))) return
    await supabase.from('vehicles').delete().eq('id', id)
    void load()
  }

  if (!flat) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">{t('parking.title')}</h1>
        <Card className="mt-6">
          <p className="text-stone-600">{t('parking.flatRequired')}</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('parking.title')}</h1>
      <p className="mt-1 text-stone-600">{t('parking.subtitle')}</p>
      <p className="mt-2 text-sm font-medium text-brand-800">
        {t('parking.yourFlat')}: <span className="font-bold">{flat}</span> —{' '}
        {t('parking.count', { count })}
      </p>
      {atLimit && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('parking.limitReached')}
        </div>
      )}

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">{t('parking.addVehicle')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('parking.regNumber')}
            </label>
            <Input
              required
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              disabled={!canAdd}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('parking.vehicleType')}
            </label>
            <Input value={vtype} onChange={(e) => setVtype(e.target.value)} disabled={!canAdd} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Parking location</label>
            <select
              value={parkingLocation}
              onChange={(e) => setParkingLocation(e.target.value as 'basement' | 'ground_floor')}
              disabled={!canAdd}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-stone-900"
            >
              <option value="basement">Basement</option>
              <option value="ground_floor">Ground floor</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving || !canAdd}>
            {saving ? t('common.loading') : t('parking.addVehicle')}
          </Button>
        </form>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-stone-900">{t('parking.listTitle')}</h2>
      {loading ? (
        <p className="mt-4 text-stone-500">{t('common.loading')}</p>
      ) : vehicles.length === 0 ? (
        <p className="mt-4 text-stone-500">{t('parking.none')}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-mono font-semibold text-stone-900">
                    {v.registration_number}
                  </p>
                  {v.vehicle_type && (
                    <p className="text-sm text-stone-600">{v.vehicle_type}</p>
                  )}
                  <p className="text-sm text-stone-600">
                    Parking: {v.parking_location === 'ground_floor' ? 'Ground floor' : 'Basement'}
                  </p>
                </div>
                {(v.user_id === user?.id || profile?.role === 'admin') && (
                  <Button variant="danger" onClick={() => void remove(v.id)}>
                    {t('common.delete')}
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
