import { createClient, type User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

/** Same shape as DB trigger — for client insert fallback (omit email so older DBs without column still work). */
function pendingProfileInsert(user: User): Record<string, string | null> {
  const meta = user.user_metadata ?? {}
  const fullName =
    typeof meta.full_name === 'string' && meta.full_name.trim()
      ? meta.full_name.trim()
      : 'Member'
  const flat =
    typeof meta.flat_number === 'string' && meta.flat_number.trim()
      ? meta.flat_number.trim()
      : ''
  const phoneRaw = typeof meta.phone === 'string' ? meta.phone.trim() : ''
  return {
    id: user.id,
    full_name: fullName,
    flat_number: flat,
    phone: phoneRaw === '' ? null : phoneRaw,
    role: 'pending',
  }
}

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
  const { profile } = await fetchProfileWithEnsureDetailed(userId)
  return profile
}

/** Same as {@link fetchProfileWithEnsure} but returns RPC error text for UI (e.g. account-issue page). */
export async function fetchProfileWithEnsureDetailed(userId: string): Promise<{
  profile: Profile | null
  ensureRpcError: string | null
}> {
  if (!supabaseConfigured) return { profile: null, ensureRpcError: null }
  let p = await fetchProfile(userId)
  if (p) return { profile: p, ensureRpcError: null }

  const { error: rpcError } = await supabase.rpc('ensure_my_profile')
  if (rpcError) console.error('ensure_my_profile', rpcError)

  p = await fetchProfile(userId)
  if (p) return { profile: p, ensureRpcError: null }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return {
      profile: null,
      ensureRpcError:
        rpcError?.message ??
        'Could not load your account. Sign out and sign in again, or contact the committee.',
    }
  }

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(pendingProfileInsert(user))

  if (insertError) {
    if (insertError.code === '23505') {
      p = await fetchProfile(userId)
      if (p) return { profile: p, ensureRpcError: null }
    }
    const parts = [rpcError?.message, insertError.message].filter(Boolean)
    return {
      profile: null,
      ensureRpcError:
        parts.join(' — ') ||
        'Could not create your society profile. Ask the committee to run supabase/migration_profiles_self_insert_policy.sql in the SQL Editor.',
    }
  }

  p = await fetchProfile(userId)
  if (p) return { profile: p, ensureRpcError: null }
  return {
    profile: null,
    ensureRpcError:
      'Profile row still missing after create. Run the README backfill SQL or check RLS on public.profiles.',
  }
}
