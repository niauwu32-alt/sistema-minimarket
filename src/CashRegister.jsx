import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashRegister({ profile }) {

  const [session, setSession] = useState(null)
  const [opening, setOpening] = useState("")
  const [closing, setClosing] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {
    if (!profile?.id) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("opened_by", profile.id)
      .eq("status", "open")
      .maybeSingle()

    setSession(data || null)
    setLoading(false)
  }

  // 🔓 APERTURA DE CAJA
  async function openCash() {

    const amount = Number(opening)

    if (!amount && amount !== 0) {
      alert("Ingrese monto inicial")
      return
    }

    const { data } = await supabase
      .from("cash_sessions")
      .insert({
        opened_by: profile.id,
        opening_amount: amount
      })
      .select()
      .single()

    setSession(data)
  }

  // 🔒 CIERRE DE CAJA
  async function closeCash() {

    const real = Number(closing)

    if (!real && real !== 0) {
      alert("Ingrese monto contado")
      return
    }

    // 💰 calcular ventas del turno
    const { data: sales } = await supabase
      .from("sales")
      .select("total")
      .eq("session_id", session.id)

    const totalSales =
      sales?.reduce((sum, s) => sum + Number(s.total || 0), 0) || 0

    const systemAmount =
      Number(session.opening_amount) + totalSales

    const difference = real - systemAmount

    await supabase
      .from("cash_sessions")
      .update({
        closing_amount: real,
        system_amount: systemAmount,
        difference: difference,
        status: "closed",
        closed_at: new Date()
      })
      .eq("id", session.id)

    alert("Caja cerrada")

    setSession(null)
    setOpening("")
    setClosing("")
  }

  if (loading) return <p>Cargando caja…</p>

  // 🔓 PANTALLA DE APERTURA
  if (!session) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Apertura de caja</h2>

        <input
          type="number"
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

  // 🟢 CAJA ABIERTA → POS ACTIVO
  return (
    <div>

      <Sales profile={profile} sessionId={session.id} />

      <hr />

      <h3>Cierre de caja</h3>

      <input
        type="number"
        placeholder="Dinero contado"
        value={closing}
        onChange={e => setClosing(e.target.value)}
      />

      <button onClick={closeCash}>
        Cerrar caja
      </button>

    </div>
  )
}