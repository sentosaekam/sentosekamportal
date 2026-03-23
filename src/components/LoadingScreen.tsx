import { useTranslation } from 'react-i18next'

export function LoadingScreen() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-stone-600">{t('common.loading')}</p>
    </div>
  )
}
