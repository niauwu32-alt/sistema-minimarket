import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState([])
  const [productsMap, setProductsMap] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('efectivo')

  // 🔄 cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')

      if (error) {
        console.error(error)
        return
      }

      const map = {}
      data.forEach(p => {
        map[p.barcode] = p
      })
      setProductsMap(map)
    }

    loadProducts()
  }, [])

  // ➕ agregar al carrito
  const addToCart = () => {
    const product = productsMap[barcode]

    if (!product) {
      alert('Producto no encontrado')
      return
    }

    const existing = cart.find(p => p.id === product.id)

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        alert('Stock insuficiente')
        return
      }

      setCart(
        cart.map(p =>
          p.id === product.id
            ? {
                ...p,
                quantity: p.quantity + 1,
                total: (p.quantity + 1) * p.price
              }
            : p
        )
      )
    } else {
      if (product.stock <= 0) {
        alert('Sin stock')
        return
      }

      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          total: product.price
        }
      ])
    }

    setBarcode('')
  }

  // ➕➖ modificar cantidad
  const changeQty = (id, delta) => {
    setCart(
      cart.map(p => {
        if (p.id !== id) return p
        const newQty = p.quantity + delta
        if (newQty < 1) return p
        if (newQty > p.stock) return p
        return {
          ...p,
          quantity: newQty,
          total: newQty * p.price
        }
      })
    )
  }

  // ❌ eliminar del carrito
  const removeFromCart = id => {
    setCart(cart.filter(p => p.id !== id))
  }

  // 💾 finalizar venta
  const finalizeSale = async () => {
    if (cart.length === 0) return

    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) {
      alert('Usuario no autenticado')
      return
    }

    const ticketNumber = Date.now() // simple y único

    for (const item of cart) {
      const { error } = await supabase.from('sales').insert({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        product_id: item.id,
        sold_by: profile.id, // profiles.id (correcto)
        payment_method: paymentMethod,
        ticket_number: ticketNumber
      })

      if (error) {
        console.error(error)
        alert('Error al guardar venta')
        return
      }

      // 🔽 descontar stock REAL
      await supabase
        .from('products')
        .update({ stock: item.stock - item.quantity })
        .eq('id', item.id)
    }

    alert('Venta registrada ✅')
    setCart([])
  }

  const totalAmount = cart.reduce((sum, p) => sum + p.total, 0)

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 Caja registradora</h2>

      <p>
        Cajero: <strong>{profile?.email}</strong>
      </p>
      <p>Fecha: {new Date().toLocaleString()}</p>

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
      />
      <button onClick={addToCart}>Agregar</button>

      <h3>🛒 Carrito</h3>

      {cart.length === 0 && <p>Vacío</p>}

      <ul>
        {cart.map(p => (
          <li key={p.id}>
            {p.name} — S/{p.price}  
            <br />
            <button onClick={() => changeQty(p.id, -1)}>-</button>
            <strong> {p.quantity} </strong>
            <button onClick={() => changeQty(p.id, 1)}>+</button>
            <br />
            Subtotal: S/{p.total.toFixed(2)}
            <button onClick={() => removeFromCart(p.id)}> ❌</button>
          </li>
        ))}
      </ul>

      <h3>Total: S/{totalAmount.toFixed(2)}</h3>

      <h4>Método de pago</h4>
      <select
        value={paymentMethod}
        onChange={e => setPaymentMethod(e.target.value)}
      >
        <option value="efectivo">Efectivo</option>
        <option value="qr">QR</option>
        <option value="tarjeta">Tarjeta</option>
      </select>

      <br /><br />

      {cart.length > 0 && (
        <button onClick={finalizeSale}>
          ✅ Realizar venta
        </button>
      )}
    </div>
  )
}
