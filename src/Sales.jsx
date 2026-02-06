alert('🔥 SALES NUEVO CARGADO 🔥')
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState('')
  const [products, setProducts] = useState({})
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('')

  // 📦 cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      const map = {}
      data.forEach(p => (map[p.barcode] = p))
      setProducts(map)
    }
    loadProducts()
  }, [])

  // ➕ agregar producto
  const addProduct = () => {
    const p = products[barcode]
    if (!p) {
      alert('Producto no encontrado')
      return
    }

    const existing = cart.find(i => i.id === p.id)

    if (existing) {
      setCart(cart.map(i =>
        i.id === p.id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setCart([...cart, {
        ...p,
        quantity: 1
      }])
    }

    setBarcode('')
  }

  // ➕ cantidad
  const increaseQty = (id) => {
    setCart(cart.map(i =>
      i.id === id ? { ...i, quantity: i.quantity + 1 } : i
    ))
  }

  // ➖ cantidad (nunca < 1)
  const decreaseQty = (id) => {
    setCart(cart
      .map(i =>
        i.id === id ? { ...i, quantity: i.quantity - 1 } : i
      )
      .filter(i => i.quantity > 0)
    )
  }

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  // ✅ realizar venta
  const finalizeSale = async () => {
    if (cart.length === 0) {
      alert('Carrito vacío')
      return
    }

    if (!paymentMethod) {
      alert('Selecciona método de pago')
      return
    }

    // 1️⃣ crear venta
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        cashier_id: profile.id,
        cashier_email: profile.email,
        payment_method: paymentMethod,
        total
      })
      .select()
      .single()

    if (error) {
      alert('Error al guardar venta')
      return
    }

    // 2️⃣ items + stock
    for (let item of cart) {
      await supabase.from('sale_items').insert({
        sale_id: sale.id,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      })

      await supabase
        .from('products')
        .update({ stock: item.stock - item.quantity })
        .eq('id', item.id)
    }

    alert('Venta realizada ✅')
    setCart([])
    setPaymentMethod('')
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 Caja registradora</h2>

      <p>
        👤 <b>Cajero:</b> {profile.email}<br />
        📅 <b>Fecha:</b> {new Date().toLocaleDateString()}<br />
        ⏰ <b>Hora:</b> {new Date().toLocaleTimeString()}
      </p>

      <hr />

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
      />
      <button onClick={addProduct}>Agregar</button>

      <h3>🛒 Carrito</h3>

      {cart.length === 0 && <p>Vacío</p>}

      <ul>
        {cart.map(i => (
          <li key={i.id}>
            {i.name} — S/{i.price} × {i.quantity} =
            <b> S/{(i.price * i.quantity).toFixed(2)}</b>

            <button onClick={() => increaseQty(i.id)}> ➕ </button>
            <button onClick={() => decreaseQty(i.id)}> ➖ </button>
          </li>
        ))}
      </ul>

      <h3>Total: S/{total.toFixed(2)}</h3>

      <hr />

      <h4>💳 Método de pago</h4>

      <label>
        <input
          type="radio"
          checked={paymentMethod === 'efectivo'}
          onChange={() => setPaymentMethod('efectivo')}
        />
        Efectivo
      </label>

      <br />

      <label>
        <input
          type="radio"
          checked={paymentMethod === 'qr'}
          onChange={() => setPaymentMethod('qr')}
        />
        QR (Yape / Plin)
      </label>

      <br />

      <label>
        <input
          type="radio"
          checked={paymentMethod === 'tarjeta'}
          onChange={() => setPaymentMethod('tarjeta')}
        />
        Tarjeta
      </label>

      <br /><br />

      <button onClick={finalizeSale}>
        ✅ REALIZAR VENTA
      </button>
    </div>
  )
}
