import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Button, Card, Input } from '../components/ui'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabaseConfigured) return
    setError(null)
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setDone(true)
  }

  return (
    <div className="min-h-screen">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <h1 className="text-2xl font-bold text-stone-900">Forgot Password</h1>
          {done ? (
            <p className="mt-3 text-sm text-stone-600">
              Password reset email sent. Please check your inbox.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">Email</label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading || !supabaseConfigured}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-sm">
            <Link to="/login" className="text-brand-700 underline underline-offset-2">
              Back to sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
