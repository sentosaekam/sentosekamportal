import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import clsx from 'clsx'

const langs = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
] as const

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n, t } = useTranslation()

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <Globe className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
      <label className="sr-only" htmlFor="lang-select">
        {t('common.language')}
      </label>
      <select
        id="lang-select"
        value={i18n.language.startsWith('hi') ? 'hi' : i18n.language.startsWith('mr') ? 'mr' : 'en'}
        onChange={(e) => {
          const lng = e.target.value
          void i18n.changeLanguage(lng)
          localStorage.setItem('i18nextLng', lng)
        }}
        className="rounded-lg border border-stone-200 bg-white/80 px-2 py-1.5 text-sm text-stone-800 shadow-sm outline-none ring-brand-500/30 focus:ring-2"
      >
        {langs.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
