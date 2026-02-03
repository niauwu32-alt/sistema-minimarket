import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Sales from './Sales'
import Products from './Products'

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('sales') // sales | products

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setProfile(data))
  }, [session.user.id])

  if (!profile) return <p>Cargando…</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Panel Minimarket</h2>
      <p><b>Usuario:</b> {profile.email}</p>
      <p><b>Rol:</b> {profile.role}</p>

      <hr />

      {/* 🔘 SELECTOR DE VISTA */}
      {(profile.role === 'empleado' || profile.role === 'admin') && (
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setView('sales')}>
            💳 Caja
          </button>
          <button onClick={() => setView('products')}>
            📦 Stock
          </button>
        </div>
      )}

      <hr />

      {/* 👨‍💼 EMPLEADO */}
      {profile.role === 'empleado' && (
        <>
          {view === 'sales' && <Sales profile={profile} />}
          {view === 'products' && <Products />}
        </>
      )}

      {/* 🧑‍💻 ADMIN VE TODO SIN LIMITES */}
      {profile.role === 'admin' && (
        <>
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
