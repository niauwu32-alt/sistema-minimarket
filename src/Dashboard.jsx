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

  // 📱 Detectar celular por tamaño de pantalla
  const isMobile = window.innerWidth < 768

  return (
    <div>
      {isMobile ? (
        <ProductsMobile />
      ) : (
        <Sales profile={profile} />
      )}
    </div>
  )
}
