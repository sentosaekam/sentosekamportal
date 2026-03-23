/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Society / committee contact email (optional) */
  readonly VITE_SOCIETY_NOTIFY_EMAIL?: string
  /** Only this login email may use Admin (must match Supabase Auth email; set on Vercel too) */
  readonly VITE_COMMITTEE_ADMIN_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
