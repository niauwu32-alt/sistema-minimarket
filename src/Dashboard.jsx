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

  // 📱 DETECCIÓN REAL DE MÓVIL
  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i
      .test(navigator.userAgent)

  return (
    <div>

      {isMobile ? (

        // 📱 INVENTARIO CELULAR
        <ProductsMobile />

      ) : (

        // 💻 CAJA PC
        <Sales profile={profile} />

      )}

    </div>
  )
}
