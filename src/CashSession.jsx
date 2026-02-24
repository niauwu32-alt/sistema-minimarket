import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashSession({ profile }) {

  const [session, setSession] = useState(null)
  const [openingAmount, setOpeningAmount] = useState("")
  const [closingAmount, setClosingAmount] = useState("")
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
      .single()

    setSession(data || null)
    setLoading(false)
  }

  // 🔓 APERTURA
  async function openCash() {

    if (!openingAmount) return alert("Ingrese monto inicial")

    const { data } = await supabase
      .from("cash_sessions")
      .insert({
        opened_by: profile.id,
        opening_amount: Number(openingAmount),
        status: "open"
      })
      .select()
      .single()

    setSession(data)
  }

  // 🔒 CIERRE PROFESIONAL REAL
  async function closeCash() {

    if (!closingAmount) return alert("Ingrese monto contado")

    // 🔹 Ventas desde apertura
    const { data: sales } = await supabase
      .from("sales")
      .select("total, payment_method")
      .gte("created_at", session.opened_at)

    let cashSales = 0
    let totalSales = 0
    let cardSales = 0
    let qrSales = 0

    sales?.forEach(s => {

      totalSales += Number(s.total)

      if (s.payment_method === "efectivo")
        cashSales += Number(s.total)

      if (s.payment_method === "tarjeta")
        cardSales += Number(s.total)

      if (s.payment_method === "qr")
        qrSales += Number(s.total)
    })

    // 🔥 Cálculo real
    const expected =
      Number(session.opening_amount) +
      cashSales

    const difference =
      Number(closingAmount) - expected

    await supabase
      .from("cash_sessions")
      .update({
        closing_amount: Number(closingAmount),
        expected_amount: expected,
        difference: difference,
        total_sales: totalSales,
        cash_sales: cashSales,
        card_sales: cardSales,
        qr_sales: qrSales,
        status: "closed",
        closed_at: new Date()
      })
      .eq("id", session.id)

    alert(
      "Caja cerrada\n\n" +
      "Esperado: S/ " + expected +
      "\nContado: S/ " + closingAmount +
      "\nDiferencia: S/ " + difference
    )

    setSession(null)
    setClosingAmount("")
  }

  if (loading) return <p>Cargando caja…</p>

  // 🔓 SI NO HAY CAJA ABIERTA
  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Apertura de caja</h2>

        <input
          type="number"
          placeholder="Monto inicial"
          value={openingAmount}
          onChange={e => setOpeningAmount(e.target.value)}
        />

        <button onClick={openCash}>
          Abrir caja
        </button>
      </div>
    )
  }

  // 🔒 CAJA ABIERTA → POS
  return (
    <div>

      <Sales profile={profile} />

      <div style={{
        padding: 20,
        borderTop: "2px solid #000",
        marginTop: 20
      }}>
        <h3>Cierre de caja</h3>

        <input
          type="number"
          placeholder="Efectivo contado"
          value={closingAmount}
          onChange={e => setClosingAmount(e.target.value)}
        />

        <button onClick={closeCash}>
          Cerrar caja
        </button>
      </div>

    </div>
  )
}