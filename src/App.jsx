import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

import Products from './Products'
import Sales from './Sales'
import SalesHistory from './SalesHistory'
import CashClosing from './CashClosing'
import PaymentReport from './PaymentReport'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  // 🔥 estados centrales
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
    })

    supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
    })
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
    loadSales()
    loadProducts()
  }

  // 🔥 SOLO VENTAS DEL DÍA
  const loadSales = async () => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })

    setSales(data || [])
  }

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name')

    setProducts(data || [])
  }

  if (!session) return <h2>Inicia sesión</h2>
  if (!profile) return <h2>Cargando perfil...</h2>

  return (
    <div style={{ padding: 30 }}>
      <h1>Panel Minimarket</h1>

      <p><b>Usuario:</b> {session.user.email}</p>
      <p><b>Rol:</b> {profile.role}</p>
      <p><b>Dispositivo:</b> {profile.device}</p>

      <hr />

      {(profile.role === 'admin' || profile.role === 'vendedor') && (
        <Sales
          profile={profile}
          products={products}
          onSaleDone={() => {
            loadSales()
            loadProducts() // 🔥 actualiza stock
          }}
        />
      )}

      <hr />

      {(profile.role === 'admin' || profile.role === 'stock') && (
        <Products products={products} />
      )}

      <hr />

      {profile.role === 'admin' && (
        <>
          <SalesHistory sales={sales} />
          <CashClosing sales={sales} />
          <PaymentReport sales={sales} />
        </>
      )}
    </div>
  )
}
