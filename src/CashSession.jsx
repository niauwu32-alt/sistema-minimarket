import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function CashSession({ profile }) {

  const [cash, setCash] = useState(null)
  const [initial, setInitial] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkCash()
  }, [])

  // 🔎 Ver si ya hay caja abierta
  async function checkCash() {

    const { data } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("opened_by", profile?.id)
      .eq("status", "open")
      .single()

    setCash(data || null)
    setLoading(false)
  }

  // 🟢 ABRIR CAJA
  async function openCash() {

    if (!initial) return alert("Ingrese dinero inicial")

    const { data, error } = await supabase
      .from("cash_sessions")
      .insert({
        opened_by: profile.id,
        initial_cash: parseFloat(initial)
      })
      .select()
      .single()

    if (error) {
      console.log(error)
      return alert("Error al abrir caja")
    }

    setCash(data)
  }

  // 🔴 CERRAR CAJA
  async function closeCash() {

    const { error } = await supabase
      .from("cash_sessions")
      .update({
        closed_at: new Date(),
        status: "closed"
      })
      .eq("id", cash.id)

    if (error) {
      console.log(error)
      return alert("Error al cerrar caja")
    }

    alert("Caja cerrada")
    setCash(null)
    setInitial("")
  }

  if (loading) return <p>Cargando caja...</p>

  // 🚫 SIN CAJA ABIERTA
  if (!cash) {
    return (
      <div style={{
        maxWidth: 400,
        margin: "auto",
        padding: 30,
        fontFamily: "Arial"
      }}>
        <h2>Apertura de caja</h2>

        <input
          type="number"
          placeholder="Dinero inicial"
          value={initial}
          onChange={e => setInitial(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 20,
            fontSize: 18
          }}
        />

        <button
          onClick={openCash}
          style={{
            width: "100%",
            padding: 15,
            fontSize: 18,
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 8
          }}
        >
          Abrir caja
        </button>
      </div>
    )
  }

  // ✅ CAJA ABIERTA → TU SISTEMA DE VENTAS
  return (
    <div>

      <div style={{
        background: "#111",
        color: "#fff",
        padding: 10
      }}>
        Caja abierta — Inicial: S/{cash.initial_cash}
      </div>

      <Sales profile={profile} />

      <div style={{
        maxWidth: 400,
        margin: "20px auto"
      }}>
        <button
          onClick={closeCash}
          style={{
            width: "100%",
            padding: 15,
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: 8
          }}
        >
          Cerrar caja
        </button>
      </div>

    </div>
  )
}