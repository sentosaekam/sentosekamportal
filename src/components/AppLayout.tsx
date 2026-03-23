import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Car,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Shield,
  ShoppingBag,
  Users,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Button } from './ui'

export function AppLayout() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-brand-100 text-brand-900'
        : 'text-stone-600 hover:bg-stone-100',
    )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/25">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">{t('common.appName')}</p>
              <p className="text-xs text-stone-500">{t('common.tagline')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              className="!px-2"
              onClick={() => void supabase.auth.signOut()}
            >
              <LogOut className="h-4 w-4" />
              {t('nav.signOut')}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:py-8">
        <nav className="flex shrink-0 flex-row flex-wrap gap-1 md:w-56 md:flex-col md:gap-0.5">
          <NavLink to="/app" end className={linkClass}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/app/hall" className={linkClass}>
            <Home className="h-4 w-4 shrink-0" />
            {t('nav.hall')}
          </NavLink>
          <NavLink to="/app/parking" className={linkClass}>
            <Car className="h-4 w-4 shrink-0" />
            {t('nav.parking')}
          </NavLink>
          <NavLink to="/app/contacts" className={linkClass}>
            <Users className="h-4 w-4 shrink-0" />
            {t('nav.contacts')}
          </NavLink>
          <NavLink to="/app/landmarks" className={linkClass}>
            <MapPin className="h-4 w-4 shrink-0" />
            {t('nav.landmarks')}
          </NavLink>
          <NavLink to="/app/market" className={linkClass}>
            <ShoppingBag className="h-4 w-4 shrink-0" />
            {t('nav.market')}
          </NavLink>
          {isAdmin && (
            <NavLink to="/app/admin" className={linkClass}>
              <Shield className="h-4 w-4 shrink-0" />
              {t('nav.admin')}
            </NavLink>
          )}
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
