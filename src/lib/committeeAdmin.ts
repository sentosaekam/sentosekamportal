import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

export function isCommitteeAdmin(user: User | null, profile: Profile | null): boolean {
  return Boolean(user && profile?.role === 'admin')
}
