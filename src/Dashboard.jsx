import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

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

      if (!error) {
        setProfile(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [session.user.id])

  if (loading) {
    return <p>Cargando perfil…</p>
  }

  if (!profile) {
    return (
      <div style={{ padding: 40 }}>
        <h2>⚠️ Perfil no encontrado</h2>
        <p>Este usuario no tiene perfil creado.</p>
        <button onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>🏪 Panel Minimarket</h1>

      <p><b>Usuario:</b> {profile.email}</p>
      <p><b>Rol:</b> {profile.role}</p>

      <hr />

      {/* AQUÍ VA TU SISTEMA */}
      {profile.role === 'admin' && (
        <p>🔧 Acceso total (admin)</p>
      )}

      {profile.role === 'vendedor' && (
        <p>💳 Vista de ventas</p>
      )}

      {profile.role === 'stock' && (
        <p>📦 Control de stock</p>
      )}

      <br />

      <button onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </div>
  )
}
