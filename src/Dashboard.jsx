import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sales from './Sales'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!error) setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [session.user.id])

  if (loading) return <p>Cargando perfil…</p>

  if (!profile) {
    return (
      <div style={{ padding: 40 }}>
        <h2>⚠️ Perfil no encontrado</h2>
        <button onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>🏪 Panel Minimarket</h1>

      <p><b>Usuario:</b> {profile.email || session.user.email}</p>
      <p><b>Rol:</b> {profile.role}</p>

      <hr />

      {(profile.role === 'admin' || profile.role === 'vendedor') && (
        <Sales profile={profile} />
      )}

      <hr />

      <button onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </div>
  )
}
