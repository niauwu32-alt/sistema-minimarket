import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile, products, onSaleDone }) {
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState([])
  const [payment, setPayment] = useState('EFECTIVO')

  const productsMap = {}
  products.forEach(p => (productsMap[p.barcode] = p))

  const addToCart = () => {
    const product = productsMap[barcode]
    if (!product) return alert('Producto no encontrado')

    const existing = cart.find(p => p.id === product.id)

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        alert('Stock insuficiente')
        return
      }

      setCart(cart.map(p =>
        p.id === product.id
          ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * p.price }
          : p
      ))
    } else {
      if (product.stock <= 0) {
        alert('Sin stock')
        return
      }

      setCart([...cart, { ...product, quantity: 1, total: product.price }])
    }

    setBarcode('')
  }

  const finalizeSale = async () => {
    try {
      for (let item of cart) {
        await supabase.from('sales').insert([{
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
          sold_by: profile.id,
          payment_method: payment
        }])

        await supabase.rpc('decrease_stock', {
          product_id: item.id,
          qty: item.quantity
        })
      }

      setCart([])
      onSaleDone()

    } catch (err) {
      alert(err.message)
    }
  }

  const total = cart.reduce((s, p) => s + p.total, 0)

  return (
    <div>
      <h2>💳 Caja registradora</h2>

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addToCart()}
      />
      <button onClick={addToCart}>Agregar</button>

      <div>
        <select value={payment} onChange={e => setPayment(e.target.value)}>
          <option>EFECTIVO</option>
          <option>YAPE</option>
          <option>PLIN</option>
          <option>TARJETA</option>
        </select>
      </div>

      <ul>
        {cart.map(p => (
          <li key={p.id}>
            {p.name} — {p.quantity} × S/{p.price} = S/{p.total}
          </li>
        ))}
      </ul>

      <h3>Total: S/{total}</h3>

      {cart.length > 0 && (
        <button onClick={finalizeSale}>Cerrar venta</button>
      )}
    </div>
  )
}
