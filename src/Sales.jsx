import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile, onSaleDone }) {
  const [barcode, setBarcode] = useState('')
  const [products, setProducts] = useState({})
  const [cart, setCart] = useState([])

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')

      const map = {}
      data?.forEach(p => (map[p.barcode] = p))
      setProducts(map)
    }

    loadProducts()
  }, [])

  const addToCart = () => {
    const p = products[barcode]
    if (!p) {
      alert('Producto no encontrado')
      return
    }

    const existing = cart.find(i => i.id === p.id)

    if (existing) {
      setCart(
        cart.map(i =>
          i.id === p.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
      setCart([...cart, { ...p, quantity: 1 }])
    }

    setBarcode('')
  }

  const total = cart.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  )

  const finalizeSale = async () => {
    for (const item of cart) {
      // registrar venta
      await supabase.from('sales').insert({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        sold_by: profile.id
      })

      // bajar stock (seguro)
      await supabase.rpc('decrease_stock', {
        product_id: item.id,
        qty: item.quantity
      })
    }

    alert('Venta registrada ✅')
    setCart([])
    onSaleDone()
  }

  return (
    <div>
      <h2>💳 Caja registradora</h2>

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
      />
      <button onClick={addToCart}>Agregar</button>

      <h3>Carrito</h3>
      <ul>
        {cart.map(i => (
          <li key={i.id}>
            {i.name} — S/{i.price} × {i.quantity}
          </li>
        ))}
      </ul>

      <h3>Total: S/{total.toFixed(2)}</h3>

      {cart.length > 0 && (
        <button onClick={finalizeSale}>
          Cerrar venta
        </button>
      )}
    </div>
  )
}
