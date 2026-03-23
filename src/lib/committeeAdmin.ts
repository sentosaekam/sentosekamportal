import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

/**
 * Committee portal access: must be `admin` in DB and match `VITE_COMMITTEE_ADMIN_EMAIL`
 * when that env var is set. If unset, any user with `role === 'admin'` keeps access (backwards compatible).
 */
export function isCommitteeAdmin(user: User | null, profile: Profile | null): boolean {
  if (!user || profile?.role !== 'admin') return false
  const allowed = (import.meta.env.VITE_COMMITTEE_ADMIN_EMAIL ?? '').trim().toLowerCase()
  if (!allowed) return true
  return (user.email ?? '').toLowerCase() === allowed
}
