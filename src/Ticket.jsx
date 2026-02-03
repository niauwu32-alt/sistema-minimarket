export default function Ticket({ sale, onClose }) {
  if (!sale) return null

  const printTicket = () => window.print()

  return (
    <div style={styles.overlay}>
      <div style={styles.ticket}>
        <h3 style={{ textAlign: 'center' }}>🧾 MINIMARKET</h3>
        <p style={{ textAlign: 'center' }}>
          Ticket N° <b>{sale.ticketNumber}</b>
        </p>
        <hr />

        {sale.items.map((i, idx) => (
          <div key={idx} style={styles.row}>
            <span>{i.name}</span>
            <span>{i.quantity} x S/{i.price}</span>
            <span>S/{i.total.toFixed(2)}</span>
          </div>
        ))}

        <hr />
        <p>Método de pago: <b>{sale.payment}</b></p>

        <h4 style={{ textAlign: 'right' }}>
          TOTAL: S/{sale.total.toFixed(2)}
        </h4>

        <p>Fecha: {new Date().toLocaleString()}</p>
        <p style={{ textAlign: 'center' }}>Gracias por su compra 🙏</p>

        <div style={{ marginTop: 10 }}>
          <button onClick={printTicket}>🖨 Imprimir</button>
          <button onClick={onClose} style={{ marginLeft: 10 }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  ticket: {
    background: '#fff',
    padding: 20,
    width: 300,
    fontFamily: 'monospace'
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12
  }
}
