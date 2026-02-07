import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // obtener sesión inicial
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null)
      setLoading(false)
    })

    // escuchar cambios de auth
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ⏳ mientras carga
  if (loading) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Cargando aplicación…</h2>
      </div>
    )
  }

  // 🔐 si NO hay sesión
  if (!session) {
    return <Login />
  }

  // ✅ sesión existe → Dashboard
  return <Dashboard session={session} />
}
