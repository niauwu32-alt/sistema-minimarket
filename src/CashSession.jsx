import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashSession({ profile }) {

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [opening, setOpening] = useState("")
  const [showClose, setShowClose] = useState(false)
  const [closingAmount, setClosingAmount] = useState("")

  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadSession()
  }, [])

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(null), 4000)
  }

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

  async function openCash() {

    if (!opening) {
      showMessage("Ingrese monto inicial")
      return
    }

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
      showMessage("Error al abrir caja")
      return
    }

    setSession(data)
    showMessage("Caja abierta correctamente")
  }

  async function closeCash() {

    if (!closingAmount) {
      showMessage("Ingrese dinero contado")
      return
    }

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
      showMessage("Error al cerrar caja")
      return
    }

    showMessage(
      `Turno cerrado — Esperado S/${expected} | Contado S/${closingAmount} | Dif S/${diff}`
    )

    setSession(null)
    setShowClose(false)
    setClosingAmount("")
  }

  async function logout() {
    await supabase.auth.signOut()
    location.reload()
  }

  if (loading) return <p>Cargando caja…</p>

  if (!session) {
    return (
      <div style={{ padding: 40 }}>

        {message && (
          <div style={{
            background:"#222",
            color:"white",
            padding:10,
            marginBottom:15
          }}>
            {message}
          </div>
        )}

        <h2>Apertura de caja</h2>

        <input
          type="number"
          placeholder="Monto inicial"
          value={opening}
          onChange={e => setOpening(e.target.value)}
        />

        <div style={{ marginTop:10 }}>

          <button onClick={openCash}>
            Abrir caja
          </button>

          <button
            style={{ marginLeft:10 }}
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

      {message && (
        <div style={{
          background:"#222",
          color:"white",
          padding:10
        }}>
          {message}
        </div>
      )}

      <div style={{
        background:"#111",
        padding:10,
        display:"flex",
        justifyContent:"flex-end"
      }}>

        <button
          onClick={() => setShowClose(true)}
        >
          Cerrar turno
        </button>

        <button
          style={{ marginLeft:10 }}
          onClick={logout}
        >
          Salir
        </button>

      </div>

      <Sales
        profile={profile}
        sessionId={session.id}
      />

      {showClose && (

        <div style={{
          position:"fixed",
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:"rgba(0,0,0,0.5)",
          display:"flex",
          justifyContent:"center",
          alignItems:"center"
        }}>

          <div style={{
            background:"white",
            padding:30
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

            <div style={{ marginTop:15 }}>

              <button onClick={closeCash}>
                Confirmar
              </button>

              <button
                style={{ marginLeft:10 }}
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