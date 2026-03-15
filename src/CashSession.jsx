import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashSession({ profile }) {

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [opening, setOpening] = useState("")
  const [showClose, setShowClose] = useState(false)
  const [closingAmount, setClosingAmount] = useState("")

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

  // ABRIR CAJA
  async function openCash() {

    if (!opening) return alert("Ingrese monto inicial")

    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({
        opened_by: profile.id,
        opening_amount: Number(opening),
        status: "open"
      })
      .select()
      .single()

    if (error) {
      console.log(error)
      alert("Error al abrir caja")
      return
    }

    setSession(data)
  }

  // CERRAR CAJA
  async function closeCash() {

    if (!closingAmount)
      return alert("Ingrese dinero contado")

    const { data: sales } = await supabase
      .from("sales")
      .select("total,payment_method")
      .eq("session_id", session.id)

    let efectivo = 0

    sales?.forEach(s => {
      if (s.payment_method === "efectivo")
        efectivo += Number(s.total)
    })

    const expected =
      Number(session.opening_amount) + efectivo

    const diff =
      Number(closingAmount) - expected

    const { error } = await supabase
      .from("cash_sessions")
      .update({
        closing_amount: Number(closingAmount),
        expected_amount: expected,
        difference: diff,
        status: "closed",
        closed_at: new Date()
      })
      .eq("id", session.id)

    if (error) {
      console.log(error)
      alert("Error al cerrar caja")
      return
    }

    alert(
      "Caja cerrada\n" +
      "Esperado: S/" + expected +
      "\nContado: S/" + closingAmount +
      "\nDiferencia: S/" + diff
    )

    setSession(null)
    setShowClose(false)
    setClosingAmount("")
  }

  // SALIR DEL SISTEMA
  async function logout() {
    await supabase.auth.signOut()
    location.reload()
  }

  if (loading) return <p>Cargando caja…</p>

  // SI NO HAY CAJA ABIERTA
  if (!session) {
    return (
      <div style={{ padding: 40 }}>

        <h2>Apertura de caja</h2>

        <input
          type="number"
          placeholder="Monto inicial"
          value={opening}
          onChange={e => setOpening(e.target.value)}
        />

        <div style={{ marginTop: 10 }}>

          <button onClick={openCash}>
            Abrir caja
          </button>

          <button
            style={{ marginLeft: 10 }}
            onClick={logout}
          >
            Salir
          </button>

        </div>

      </div>
    )
  }

  return (
    <div>

      {/* BARRA SUPERIOR */}
      <div style={{
        background: "#111",
        color: "white",
        padding: 12,
        display: "flex",
        justifyContent: "space-between"
      }}>

        <div>
          Caja abierta — Inicio S/ {session.opening_amount}
        </div>

        <div>

          <button
            onClick={() => setShowClose(true)}
          >
            Cerrar turno
          </button>

          <button
            style={{ marginLeft: 10 }}
            onClick={logout}
          >
            Salir
          </button>

        </div>

      </div>

      {/* POS */}
      <Sales
        profile={profile}
        sessionId={session.id}
      />

      {/* MODAL CIERRE */}
      {showClose && (

        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>

          <div style={{
            background: "white",
            padding: 30,
            minWidth: 300
          }}>

            <h3>Cierre de caja</h3>

            <input
              type="number"
              placeholder="Dinero contado"
              value={closingAmount}
              onChange={e =>
                setClosingAmount(e.target.value)
              }
            />

            <div style={{ marginTop: 15 }}>

              <button onClick={closeCash}>
                Confirmar cierre
              </button>

              <button
                style={{ marginLeft: 10 }}
                onClick={() =>
                  setShowClose(false)
                }
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}