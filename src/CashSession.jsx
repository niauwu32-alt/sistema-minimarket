import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashSession({ profile }) {

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openingAmount, setOpeningAmount] = useState("")
  const [showOpen, setShowOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    loadSession()
  }, [])

  async function loadSession() {

    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("opened_by", profile?.id)
      .eq("status", "open")
      .maybeSingle()

    if (!data) {
      setShowOpen(true)
    } else {
      setSession(data)
    }

    setLoading(false)
  }

  async function openSession() {

    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({
        opened_by: profile?.id,
        opening_amount: Number(openingAmount),
        status: "open"
      })
      .select()
      .single()

    if (error) {
      console.log(error)
      return alert("Error al abrir caja")
    }

    setSession(data)
    setShowOpen(false)
  }

  async function closeSession() {

    if (!session) return

    await supabase
      .from("cash_sessions")
      .update({
        status: "closed",
        closed_at: new Date()
      })
      .eq("id", session.id)

    setSession(null)
    setShowOpen(true)
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // 🔥 TECLADO GLOBAL
  useEffect(() => {

    function handleKeys(e) {

      // abrir caja
      if (showOpen && e.key === "Enter") {
        openSession()
      }

      // escribir monto
      if (showOpen && !isNaN(e.key)) {
        setOpeningAmount(prev => prev + e.key)
      }

      if (showOpen && e.key === "Backspace") {
        setOpeningAmount(prev => prev.slice(0, -1))
      }

      // cerrar turno
      if (e.key === "F8") {
        setConfirmClose(true)
      }

      // salir
      if (e.key === "F10") {
        logout()
      }

      // confirmar cierre
      if (confirmClose) {

        if (e.key === "Enter") {
          closeSession()
          setConfirmClose(false)
        }

        if (e.key === "Escape") {
          setConfirmClose(false)
        }
      }

    }

    window.addEventListener("keydown", handleKeys)

    return () =>
      window.removeEventListener("keydown", handleKeys)

  }, [showOpen, confirmClose, openingAmount, session])

  if (loading) return <p>Cargando...</p>

  // 🔥 PANTALLA ABRIR CAJA
  if (showOpen) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: 24
      }}>
        <div>
          <p>Apertura de caja</p>
          <p>Monto inicial:</p>
          <h2>S/ {openingAmount || 0}</h2>
          <p>ENTER para abrir</p>
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* CAJA */}
      <Sales
        profile={profile}
        sessionId={session?.id}
      />

      {/* CONFIRMACIÓN CIERRE */}
      {confirmClose && (
        <div style={{
          position: "fixed",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#111",
          color: "#fff",
          padding: 20,
          borderRadius: 10
        }}>
          Cerrar turno? ENTER = Sí / ESC = No
        </div>
      )}

    </div>
  )
}