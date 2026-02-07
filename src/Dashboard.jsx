import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sales from './Sales'
import Products from './Products'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data ?? null)
      setLoading(false)
    }

    loadProfile()
  }, [session])

  if (loading) {
    return <p style={{ padding: 20 }}>Cargando perfil…</p>
  }

  if (!profile) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Perfil incompleto</h2>
        <p>Este usuario aún no tiene datos.</p>
        <button onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Panel Minimarket</h2>

      <p><b>Usuario:</b> {profile.email ?? '—'}</p>
      <p><b>Rol:</b> {profile.role ?? '—'}</p>
      <p><b>DNI:</b> {profile.dni ?? 'No registrado'}</p>

      <hr />

      {(profile.role === 'admin' || profile.role === 'colaborador') && (
        <>
          <Sales profile={profile} />
          <Products />
        </>
      )}

      <button
        style={{ marginTop: 20 }}
        onClick={() => supabase.auth.signOut()}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
