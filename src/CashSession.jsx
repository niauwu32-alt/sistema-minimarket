import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashSession({ profile }) {

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [opening, setOpening] = useState("")
  const [closing, setClosing] = useState("")

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {

    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("opened_by", profile?.id)
      .eq("status", "open")
      .single()

    setSession(data || null)
    setLoading(false)
  }

  // 🔓 ABRIR CAJA
  async function openCash() {

    const amount = parseFloat(opening || 0)

    const { data } = await supabase
      .from("cash_sessions")
      .insert({
        opened_by: profile?.id,
        opening_amount: amount
      })
      .select()
      .single()

    setSession(data)
  }

  // 🔒 CERRAR CAJA
  async function closeCash() {

    const counted = parseFloat(closing || 0)

    // 🔥 calcular ventas del turno
    const { data: sales } = await supabase
      .from("sales")
      .select("*")
      .gte("created_at", session.opened_at)

    let total = 0
    let cash = 0
    let card = 0
    let qr = 0

    sales?.forEach(s => {
      total += s.total || 0

      if (s.payment_method === "efectivo") cash += s.total
      if (s.payment_method === "tarjeta") card += s.total
      if (s.payment_method === "qr") qr += s.total
    })

    const expected = session.opening_amount + cash
    const diff = counted - expected

    await supabase
      .from("cash_sessions")
      .update({
        closed_at: new Date(),
        closing_amount: counted,
        expected_amount: expected,
        difference: diff,
        total_sales: total,
        cash_sales: cash,
        card_sales: card,
        qr_sales: qr,
        status: "closed"
      })
      .eq("id", session.id)

    alert("Caja cerrada correctamente")

    setSession(null)
  }

  if (loading) return <p>Cargando caja...</p>

  // 🔓 SIN CAJA ABIERTA
  if (!session) {
    return (
      <div style={{ padding: 30 }}>
        <h2>Apertura de caja</h2>

        <input
          placeholder="Monto inicial"
          value={opening}
          onChange={e => setOpening(e.target.value)}
        />

        <button onClick={openCash}>
          Abrir caja
        </button>
      </div>
    )
  }

  // 🔥 CAJA ABIERTA — MOSTRAR POS
  return (
    <div>

      <Sales profile={profile} />

      <div style={{
        marginTop: 20,
        padding: 20,
        borderTop: "2px solid #ddd"
      }}>
        <h3>Cerrar caja</h3>

        <input
          placeholder="Efectivo contado"
          value={closing}
          onChange={e => setClosing(e.target.value)}
        />

        <button onClick={closeCash}>
          Cerrar caja
        </button>
      </div>

    </div>
  )
}