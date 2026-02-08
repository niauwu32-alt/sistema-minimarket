import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function PaymentReport() {
  const [report, setReport] = useState({})

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('sales').select('payment_method,total')
      const r = {}
      ;(data || []).forEach(s => {
        r[s.payment_method] = (r[s.payment_method] || 0) + s.total
      })
      setReport(r)
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h3>💰 Reporte por método</h3>

      {Object.entries(report).length === 0 ? (
        <p>Sin datos</p>
      ) : (
        Object.entries(report).map(([method, total]) => (
          <div key={method}>
            {method}: S/{total.toFixed(2)}
          </div>
        ))
      )}
    </div>
  )
}
