import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sales from './Sales'
import Stock from './Stock'

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

      if (error) {
        console.error('Error cargando perfil', error)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    loadProfile()
  }, [session.user.id])

  if (loading) return <p>Cargando perfil…</p>
  if (!profile) return <p>No se encontró el perfil</p>

  return (
    <div>
      <h1>🏪 Panel Minimarket</h1>

      <p><strong>Usuario:</strong> {profile.email}</p>
      <p><strong>Rol:</strong> {profile.role}</p>

      {profile.role === 'admin' && (
        <>
          <Sales profile={profile} />
          <Stock />
        </>
      )}

      {profile.role === 'colaborador' && (
        <>
          <Sales profile={profile} />
          <Stock />
        </>
      )}
    </div>
  )
}
