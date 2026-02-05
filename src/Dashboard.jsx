console.log('🔥 DASHBOARD CARGADO 🔥')
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sales from './Sales'
import Products from './Products'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('sales')

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, email, role')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
        } else {
          setProfile(data)
        }
      })
  }, [session.user.id])

  if (!profile) return <p>Cargando perfil…</p>

  const canUseSystem =
    profile.role === 'admin' || profile.role === 'colaborador'

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Panel Minimarket</h2>
      <p><b>Usuario:</b> {profile.email}</p>
      <p><b>Rol:</b> {profile.role}</p>

      <hr />

      {canUseSystem && (
        <>
          <div style={{ marginBottom: 10 }}>
            <button onClick={() => setView('sales')}>
              💳 Caja
            </button>
            <button onClick={() => setView('products')}>
              📦 Stock
            </button>
          </div>

          <hr />

          {view === 'sales' && <Sales profile={profile} />}
          {view === 'products' && <Products />}
        </>
      )}

      <hr />

      <button onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </div>
  )
}
