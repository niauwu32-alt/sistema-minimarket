import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

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

  if (loading) {
    return <h2>Cargando...</h2>
  }

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>🔐 Inicia sesión</h2>

        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithPassword({
              email: 'niauwu32@gmail.com',
              password: 'Dkbn4f4v8vgRxXXw'
            })
            if (error) alert(error.message)
          }}
        >
          Entrar (test)
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>✅ LOGIN OK</h1>
      <p>Usuario: {session.user.email}</p>

      <button onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </div>
  )
}
