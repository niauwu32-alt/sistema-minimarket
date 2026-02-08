export default function Ticket({ sale }) {
  const items = Array.isArray(sale?.items) ? sale.items : []

  return (
    <div style={{ padding: 20 }}>
      <h3>🧾 Ticket</h3>
      {items.length === 0 ? (
        <p>Sin items</p>
      ) : (
        items.map((p, idx) => (
          <div key={idx}>
            {i.name} x {i.quantity} — S/{i.total}
          </div>
        ))
      )}
    </div>
  )
}
