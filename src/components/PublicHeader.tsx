import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2 } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui'

export function PublicHeader() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-stone-900">{t('common.appName')}</p>
            <p className="text-xs text-stone-500">{t('common.tagline')}</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" onClick={() => navigate('/login')}>
            {t('nav.signIn')}
          </Button>
          <Button onClick={() => navigate('/register')}>{t('nav.register')}</Button>
        </div>
      </div>
    </header>
  )
}
