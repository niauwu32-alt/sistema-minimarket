import Sales from "./Sales"
import Products from "./Products"

export default function Dashboard({ profile }) {
  if (!profile) return <p>Cargando...</p>

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Panel Minimarket</h2>

      <p>Usuario: {profile.email || "—"}</p>
      <p>Rol: {profile.role || "—"}</p>

      {/* 🔹 Vendedor o colaborador */}
      {profile.role !== "admin" && (
        <Sales profile={profile} />
      )}

      {/* 🔹 Admin ve todo */}
      {profile.role === "admin" && (
        <>
          <Sales profile={profile} />
          <Products />
        </>
      )}
    </div>
  )
}
