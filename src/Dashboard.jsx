import ProductsMobile from "./ProductsMobile"
import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

// 🔥 AGREGADO — SISTEMA DE CAJA
import CashSession from "./CashSession"

export default function Dashboard({ session }) {

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {

    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    setProfile(data || null)
    setLoading(false)
  }

  if (loading) return <p>Cargando…</p>

  // 📱 DETECTAR DISPOSITIVO TÁCTIL (CELULAR)
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0

  return (
    <div>

      {isTouchDevice ? (

        // 📱 INVENTARIO (CELULAR — NO SE TOCA)
        <ProductsMobile />

      ) : (

        // 💻 CAJA PROFESIONAL (PC)
        <CashSession profile={profile} />

      )}

    </div>
  )
}