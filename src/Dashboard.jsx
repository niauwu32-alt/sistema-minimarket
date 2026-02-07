import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sales from './Sales'
import Products from './Products'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Error cargando profile:', error)
      } else {
        setProfile(data)
      }

      setLoading(false)
    }

    loadProfile()
  }, [session])

  // ⏳ mientras carga
  if (loading) {
    return <p>Cargando perfil…</p>
  }

  // 🚨 si no existe profile
  if (!profile) {
    return <p>Perfil no encontrado</p>
  }

  // ✅ YA ES SEGURO usar profile.email
  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Panel Minimarket</h2>

      <p><b>Usuario:</b> {profile.email}</p>
      <p><b>Rol:</b> {profile.role}</p>

      <hr />

      {/* vistas por rol */}
      {profile.role === 'admin' && (
        <>
          <Sales profile={profile} />
          <Products />
        </>
      )}

      {profile.role === 'colaborador' && (
        <>
          <Sales profile={profile} />
          <Products />
        </>
      )}

      <button
        onClick={() => supabase.auth.signOut()}
        style={{ marginTop: 20 }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}
