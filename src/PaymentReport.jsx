export default function PaymentReport({ sales }) {
  const report = {}

  sales.forEach(s => {
    const m = s.payment_method || 'DESCONOCIDO'
    report[m] = (report[m] || 0) + Number(s.total)
  })

  return (
    <div>
      <h2>📊 Ventas por método de pago (HOY)</h2>

      <ul>
        {Object.entries(report).map(([m, t]) => (
          <li key={m}>
            {m}: S/{t.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  )
}
