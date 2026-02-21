import ProductsMobile from "./ProductsMobile"
import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

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

  // 📱 DETECTAR CELULAR
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0


  // ================================
  // 💰 FUNCIONES DE CAJA
  // ================================

  async function openCash() {

    if (!profile?.id) return

    const amount = prompt("Dinero inicial en caja")

    if (!amount) return

    const { error } = await supabase
      .from("cash_closings")
      .insert({
        opened_by: profile.id,
        opening_amount: Number(amount)
      })

    if (error) alert("Error al abrir caja")
    else alert("Caja abierta correctamente")
  }

  async function closeCash() {

    if (!profile?.id) return

    const realAmount = prompt("Dinero contado al cerrar")

    if (!realAmount) return

    const { data: sales } = await supabase
      .from("sales")
      .select("*")
      .eq("sold_by", profile.id)

    const totalSales =
      sales?.reduce((sum, s) => sum + Number(s.total), 0) || 0

    const totalCash =
      sales
        ?.filter(s => s.payment_method === "efectivo")
        .reduce((sum, s) => sum + Number(s.total), 0) || 0

    const totalCard =
      sales
        ?.filter(s => s.payment_method === "tarjeta")
        .reduce((sum, s) => sum + Number(s.total), 0) || 0

    const totalQr =
      sales
        ?.filter(s => s.payment_method === "qr")
        .reduce((sum, s) => sum + Number(s.total), 0) || 0

    await supabase
      .from("cash_closings")
      .update({
        closed_by: profile.id,
        closed_at: new Date(),
        closing_amount: Number(realAmount),
        total_sales: totalSales,
        total_cash: totalCash,
        total_card: totalCard,
        total_qr: totalQr,
        sales_count: sales.length,
        status: "closed"
      })
      .eq("status", "open")

    alert("Caja cerrada")
  }


  return (
    <div>

      {isTouchDevice ? (

        // 📱 INVENTARIO (CELULAR)
        <ProductsMobile />

      ) : (

        // 💻 CAJA (PC)
        <div>

          {/* 🔹 CONTROLES DE CAJA */}
          <div style={{
            display: "flex",
            gap: 10,
            padding: 10,
            background: "#eee"
          }}>
            <button onClick={openCash}>
              Abrir caja
            </button>

            <button onClick={closeCash}>
              Cerrar caja
            </button>
          </div>

          {/* 🔹 SISTEMA DE VENTAS */}
          <Sales profile={profile} />

        </div>

      )}

    </div>
  )
}