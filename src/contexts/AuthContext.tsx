import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { fetchProfileWithEnsure, supabase, supabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types/database'
import { AuthContext } from './auth-context'

const PROFILE_SYNC_TIMEOUT_MS = 12000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const prevUserIdRef = useRef<string | null>(null)

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!supabaseConfigured) {
      setProfile(null)
      return null
    }
    const u = (await supabase.auth.getUser()).data.user
    if (!u) {
      setProfile(null)
      return null
    }
    let p: Profile | null = null
    try {
      p = await Promise.race([
        fetchProfileWithEnsure(u.id),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), PROFILE_SYNC_TIMEOUT_MS)
        }),
      ])
    } catch (e) {
      console.error('fetchProfileWithEnsure', e)
    }
    setProfile(p)
    return p
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    async function syncFromSession(s: Session | null) {
      const uid = s?.user?.id ?? null
      const userChanged = uid !== prevUserIdRef.current

      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        prevUserIdRef.current = uid
        if (userChanged) setLoading(true)
        let p: Profile | null = null
        try {
          p = await Promise.race([
            fetchProfileWithEnsure(s.user.id),
            new Promise<null>((resolve) => {
              setTimeout(() => resolve(null), PROFILE_SYNC_TIMEOUT_MS)
            }),
          ])
        } catch (e) {
          console.error('fetchProfileWithEnsure', e)
        }
        if (mounted) {
          setProfile(p)
          setLoading(false)
        }
      } else {
        prevUserIdRef.current = null
        if (mounted) {
          setProfile(null)
          setLoading(false)
        }
      }
    }

    void supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        await syncFromSession(s)
      })
      .catch((e) => {
        console.error('auth.getSession', e)
        if (mounted) setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      try {
        await syncFromSession(s)
      } catch (e) {
        console.error('onAuthStateChange', e)
        if (mounted) setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      refreshProfile,
    }),
    [session, user, profile, loading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
