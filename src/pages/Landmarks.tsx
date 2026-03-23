import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import type { Landmark, LandmarkCategory } from '../types/database'
import { Card } from '../components/ui'

function categoryLabel(t: (k: string) => string, c: LandmarkCategory) {
  if (c === 'school') return t('landmarks.school')
  if (c === 'hospital') return t('landmarks.hospital')
  return t('landmarks.other')
}

export function LandmarksPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Landmark[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from('landmarks')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) setRows(data as Landmark[])
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('landmarks.title')}</h1>
      <p className="mt-1 text-stone-600">{t('landmarks.subtitle')}</p>
      {loading ? (
        <p className="mt-6 text-stone-500">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-stone-500">{t('landmarks.empty')}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((l) => (
            <li key={l.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-lg font-semibold text-stone-900">{l.name}</p>
                  <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-800">
                    {categoryLabel(t, l.category)}
                  </span>
                </div>
                {l.address && (
                  <p className="mt-2 text-sm text-stone-600">
                    <span className="font-medium">{t('landmarks.address')}: </span>
                    {l.address}
                  </p>
                )}
                {l.notes && (
                  <p className="mt-2 text-sm text-stone-500">{l.notes}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
