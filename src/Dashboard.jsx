import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import Sales from "./Sales"

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // 🔹 Cargar perfil del usuario
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

  // 🔹 Loading seguro
  if (loading) {
    return <p>Cargando perfil…</p>
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Panel Minimarket</h2>

      <p>
        Usuario:{" "}
        {profile?.email || session?.user?.email || "—"}
      </p>

      <p>
        Rol: {profile?.role || "colaborador"}
      </p>

      {/* 🔥 Vista de caja */}
      <Sales profile={profile} />
    </div>
  )
}
