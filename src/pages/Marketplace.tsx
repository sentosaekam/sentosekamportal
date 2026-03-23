import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Listing } from '../types/database'
import { Button, Card, Input, TextArea } from '../components/ui'

export function MarketplacePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
    if (!err && data) setListings(data as Listing[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setError(null)
    setSaving(true)
    const { error: err } = await supabase.from('listings').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      price: price.trim() || null,
      category: category.trim() || null,
      status: 'active',
    })
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    setTitle('')
    setDescription('')
    setPrice('')
    setCategory('')
    void load()
  }

  async function markSold(id: string) {
    await supabase.from('listings').update({ status: 'sold' }).eq('id', id)
    void load()
  }

  async function removeListing(id: string) {
    if (!confirm(t('common.delete'))) return
    await supabase.from('listings').delete().eq('id', id)
    void load()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">{t('market.title')}</h1>
      <p className="mt-1 text-stone-600">{t('market.subtitle')}</p>

      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-stone-900">{t('market.newListing')}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('market.titleLabel')}
            </label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              {t('market.description')}
            </label>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('market.price')}
              </label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t('market.category')}
              </label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? t('common.loading') : t('common.submit')}
          </Button>
        </form>
      </Card>

      <h2 className="mt-10 text-lg font-semibold text-stone-900">{t('market.allListings')}</h2>
      {loading ? (
        <p className="mt-4 text-stone-500">{t('common.loading')}</p>
      ) : listings.length === 0 ? (
        <p className="mt-4 text-stone-500">{t('market.empty')}</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {listings.map((l) => (
            <li key={l.id}>
              <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-stone-900">{l.title}</p>
                  {l.description && (
                    <p className="mt-1 text-sm text-stone-600">{l.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-500">
                    {l.price && <span>{l.price}</span>}
                    {l.category && <span>{l.category}</span>}
                    <span>
                      {format(parseISO(l.created_at), 'PP')}
                    </span>
                    <span
                      className={
                        l.status === 'sold'
                          ? 'font-medium text-stone-400'
                          : 'font-medium text-green-700'
                      }
                    >
                      {l.status === 'sold' ? t('market.statusSold') : t('market.statusActive')}
                    </span>
                  </div>
                </div>
                {l.user_id === user?.id && l.status === 'active' && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => void markSold(l.id)}>
                      {t('market.markSold')}
                    </Button>
                    <Button variant="danger" onClick={() => void removeListing(l.id)}>
                      {t('common.delete')}
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
