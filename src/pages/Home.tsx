import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Car, MapPin, ShoppingBag } from 'lucide-react'
import { PublicHeader } from '../components/PublicHeader'
import { Button, Card } from '../components/ui'

const features = [
  { key: 'f1' as const, icon: CalendarDays },
  { key: 'f2' as const, icon: Car },
  { key: 'f3' as const, icon: MapPin },
  { key: 'f4' as const, icon: ShoppingBag },
]

export function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const societyEmail = (import.meta.env.VITE_SOCIETY_NOTIFY_EMAIL ?? '').trim()

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 md:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900 md:text-5xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/register')}>{t('home.ctaRegister')}</Button>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              {t('home.ctaSignIn')}
            </Button>
          </div>
          <p className="mt-4 text-sm text-stone-500">{t('home.accessNote')}</p>
          {societyEmail && (
            <p className="mt-3 text-sm text-stone-600">
              <span className="font-medium text-stone-700">{t('home.societyEmail')}: </span>
              <a
                href={`mailto:${societyEmail}`}
                className="text-brand-700 underline underline-offset-2 hover:text-brand-800"
              >
                {societyEmail}
              </a>
            </p>
          )}
        </div>

        <h2 className="mt-16 text-center text-xl font-semibold text-stone-900">
          {t('home.featuresTitle')}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map(({ key, icon: Icon }) => (
            <Card key={key} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">
                  {t(`home.${key}Title`)}
                </h3>
                <p className="mt-1 text-sm text-stone-600">
                  {t(`home.${key}Desc`)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
