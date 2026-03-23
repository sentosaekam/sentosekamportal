import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

export type AuthState = {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<Profile | null>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
