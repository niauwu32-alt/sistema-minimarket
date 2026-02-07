import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState([])
  const [productsMap, setProductsMap] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('')
  const [now, setNow] = useState(new Date())

  /* ⏰ hora en tiempo real */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* 📦 cargar productos */
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('products').select('*')
      if (error) return console.error(error)

      const map = {}
      data.forEach(p => (map[p.barcode] = p))
      setProductsMap(map)
    }
    load()
  }, [])

  /* ➕ agregar producto */
  const addToCart = () => {
    const product = productsMap[barcode]
    if (!product) return alert('Producto no encontrado')
    if (product.stock <= 0) return alert('Producto sin stock')

    const exists = cart.find(p => p.id === product.id)

    if (exists) {
      if (exists.quantity + 1 > product.stock)
        return alert('Stock insuficiente')

      setCart(cart.map(p =>
        p.id === product.id
          ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * p.price }
          : p
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.price }])
    }

    setBarcode('')
  }

  /* ➕➖ cambiar cantidad */
  const changeQty = (id, delta) => {
    setCart(cart.map(p => {
      if (p.id !== id) return p
      const q = p.quantity + delta
      if (q < 1 || q > p.stock) return p
      return { ...p, quantity: q, total: q * p.price }
    }))
  }

  /* ❌ eliminar */
  const removeFromCart = id => {
    setCart(cart.filter(p => p.id !== id))
  }

  /* 💾 finalizar venta */
  const finalizeSale = async () => {
    if (!paymentMethod) return alert('Seleccione método de pago')
    if (cart.length === 0) return

    const ticket = Date.now()

    for (const item of cart) {
      const { error } = await supabase.from('sales').insert({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        product_id: item.id,
        sold_by: profile.id,
        payment_method: paymentMethod,
        ticket_number: ticket
      })

      if (error) {
        console.error(error)
        return alert('Error al guardar venta')
      }

      /* 🔽 descontar stock en DB */
      await supabase
        .from('products')
        .update({ stock: item.stock - item.quantity })
        .eq('id', item.id)

      /* ⚡ actualizar stock en pantalla */
      setProductsMap(prev => ({
        ...prev,
        [item.barcode]: {
          ...prev[item.barcode],
          stock: prev[item.barcode].stock - item.quantity
        }
      }))
    }

    alert('Venta realizada ✅')
    setCart([])
    setPaymentMethod('')
  }

  const total = cart.reduce((s, p) => s + p.total, 0)

  return (
    <div style={{
      maxWidth: 520,
      margin: '20px auto',
      background: '#fff',
      padding: 20,
      borderRadius: 10,
      boxShadow: '0 0 15px rgba(0,0,0,.1)'
    }}>
      <h2>🏪 Caja</h2>

      <p><strong>Cajero:</strong> {profile?.email}</p>
      <p><strong>DNI:</strong> {profile.dni || '—'}</p>
      <p>{now.toLocaleDateString()} — {now.toLocaleTimeString()}</p>

      <hr />

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        style={{ width: '100%', padding: 8 }}
      />
      <button onClick={addToCart} style={{ width: '100%', marginTop: 5 }}>
        Agregar
      </button>

      <h3>🛒 Carrito</h3>
      {cart.length === 0 && <p>Vacío</p>}

      {cart.map(p => (
        <div key={p.id} style={{ borderBottom: '1px solid #ddd', padding: 5 }}>
          <strong>{p.name}</strong> — S/{p.price}
          <div>
            <button onClick={() => changeQty(p.id, -1)}>-</button>
            <strong> {p.quantity} </strong>
            <button onClick={() => changeQty(p.id, 1)}>+</button>
            <button onClick={() => removeFromCart(p.id)}> ❌</button>
          </div>
          <small>Subtotal: S/{p.total.toFixed(2)}</small>
        </div>
      ))}

      <h3>Total: S/{total.toFixed(2)}</h3>

      <h4>Método de pago</h4>
      <select
        value={paymentMethod}
        onChange={e => setPaymentMethod(e.target.value)}
        style={{ width: '100%', padding: 6 }}
      >
        <option value="">Seleccione</option>
        <option value="efectivo">Efectivo</option>
        <option value="qr">QR</option>
        <option value="tarjeta">Tarjeta</option>
      </select>

      <button
        onClick={finalizeSale}
        style={{
          marginTop: 15,
          width: '100%',
          padding: 10,
          background: '#2e7d32',
          color: '#fff',
          fontSize: 16,
          border: 'none',
          borderRadius: 6
        }}
      >
        ✅ Realizar venta
      </button>

      {/* 🧾 BOLETA SIMULADA */}
      {cart.length > 0 && (
        <>
          <hr />
          <h4>🧾 Boleta (simulada)</h4>
          {cart.map(p => (
            <div key={p.id}>
              {p.name} x{p.quantity} — S/{p.total.toFixed(2)}
            </div>
          ))}
          <strong>Total: S/{total.toFixed(2)}</strong>
        </>
      )}
    </div>
  )
}
