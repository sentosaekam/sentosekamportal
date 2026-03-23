import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Contact } from '../types/database'
import { Card } from '../components/ui'

export function ContactsPage() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) setRows(data as Contact[])
      setLoading(false)
    })()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('contacts.title')}</h1>
      <p className="mt-1 text-stone-600">{t('contacts.subtitle')}</p>
      {loading ? (
        <p className="mt-6 text-stone-500">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-stone-500">{t('contacts.empty')}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((c) => (
            <li key={c.id}>
              <Card>
                <p className="text-lg font-semibold text-stone-900">{c.name}</p>
                {c.role_label && (
                  <p className="text-sm text-brand-800">{c.role_label}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-600">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="inline-flex items-center gap-1.5 hover:text-brand-700"
                    >
                      <Phone className="h-4 w-4" />
                      {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-1.5 hover:text-brand-700"
                    >
                      <Mail className="h-4 w-4" />
                      {c.email}
                    </a>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
