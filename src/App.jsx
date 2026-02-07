import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <p>Cargando…</p>

  if (!session) return <Login />

  return <Dashboard session={session} />
}
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <p>Cargando…</p>
  if (!session) return <Login />

  // 🔥 CUALQUIER usuario logueado entra al Dashboard
  return <Dashboard session={session} />
}
