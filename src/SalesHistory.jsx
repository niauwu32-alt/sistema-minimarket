export default function SalesHistory({ sales }) {
  return (
    <div>
      <h2>📊 Historial de ventas</h2>

      {sales.length === 0 ? (
        <p>No hay ventas</p>
      ) : (
        <ul>
          {sales.map(s => (
            <li key={s.id}>
              {s.name} — Cant: {s.quantity} — S/{s.total}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
