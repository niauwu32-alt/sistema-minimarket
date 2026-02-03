export default function CashClosing({ sales }) {
  const total = sales.reduce((s, v) => s + Number(v.total), 0)
  const units = sales.reduce((s, v) => s + Number(v.quantity), 0)

  return (
    <div>
      <h2>💰 Cierre de caja (HOY)</h2>
      <p>Ventas: {sales.length}</p>
      <p>Productos vendidos: {units}</p>
      <p><b>Total del día: S/{total.toFixed(2)}</b></p>
    </div>
  )
}
