import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function SalesHistory() {
  const [sales, setSales] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })

      setSales(data || [])
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h3>📊 Historial de ventas</h3>

      {sales.length === 0 ? (
        <p>No hay ventas</p>
      ) : (
        sales.map(s => (
          <div key={s.id}>
            {s.name} — Cant: {s.quantity} — Total: S/{s.total}
          </div>
        ))
      )}
    </div>
  )
}
