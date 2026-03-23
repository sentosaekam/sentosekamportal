import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 520,
            margin: '48px auto',
            padding: 24,
          }}
        >
          <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
          <p style={{ color: '#444', marginTop: 12 }}>
            The app hit an error while loading. Open the browser developer console (F12 → Console) for
            details, or check Vercel: Project → Settings → Environment Variables (
            <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>) and redeploy.
          </p>
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              background: '#f5f5f4',
              borderRadius: 8,
              fontSize: 12,
              overflow: 'auto',
            }}
          >
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
