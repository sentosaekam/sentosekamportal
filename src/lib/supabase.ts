import { createClient } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

// Trim — stray spaces in .env break fetch ("Failed to fetch")
const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const supabaseConfigured = Boolean(url && key)

// createClient('', '') throws at import time ("supabaseUrl is required") → blank page on Vercel
// if env vars are missing from the build. Use placeholders only so the module loads; when
// supabaseConfigured is false, AuthProvider skips real auth calls.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(
  supabaseConfigured ? url : PLACEHOLDER_URL,
  supabaseConfigured ? key : PLACEHOLDER_KEY,
  {
    auth: {
      persistSession: supabaseConfigured,
      autoRefreshToken: supabaseConfigured,
      detectSessionInUrl: supabaseConfigured,
    },
  },
)

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabaseConfigured) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('fetchProfile', error)
    return null
  }
  return data as Profile | null
}

/**
 * If a session exists but `profiles` has no row (missing trigger / old DB), the RPC
 * `ensure_my_profile` creates one. Requires `supabase/migration_ensure_my_profile.sql` on the project.
 */
export async function fetchProfileWithEnsure(userId: string): Promise<Profile | null> {
  if (!supabaseConfigured) return null
  let p = await fetchProfile(userId)
  if (p) return p
  const { error } = await supabase.rpc('ensure_my_profile')
  if (error) {
    console.error('ensure_my_profile', error)
    return null
  }
  p = await fetchProfile(userId)
  return p
}
