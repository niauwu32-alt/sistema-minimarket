import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState('')
  const [products, setProducts] = useState({})
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)

  // 🔹 cargar productos UNA SOLA VEZ
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      const map = {}
      data?.forEach(p => (map[p.barcode] = p))
      setProducts(map)
    }

    loadProducts()
  }, [])

  const addToCart = () => {
    const product = products[barcode]
    if (!product) return alert('❌ Producto no encontrado')
    if (product.stock <= 0) return alert('❌ Sin stock')

    const existing = cart.find(i => i.id === product.id)

    if (existing) {
      if (existing.quantity + 1 > product.stock)
        return alert('❌ Stock insuficiente')

      setCart(
        cart.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      )
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }

    setBarcode('')
  }

  const total = cart.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  )

  const finalizeSale = async () => {
    if (cart.length === 0) return
    setLoading(true)

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

      // bajar stock en BD
      await supabase.rpc('decrease_stock', {
        product_id: item.id,
        qty: item.quantity
      })

      // 🔥 bajar stock LOCAL (SIN REFETCH)
      setProducts(prev => ({
        ...prev,
        [item.barcode]: {
          ...prev[item.barcode],
          stock: prev[item.barcode].stock - item.quantity
        }
      }))
    }

    setCart([])
    setLoading(false)
    alert('✅ Venta registrada')
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h2>💳 Caja registradora</h2>

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addToCart()}
      />

      <button onClick={addToCart}>Agregar</button>

      <h3>🛒 Carrito</h3>

      {cart.length === 0 && <p>Vacío</p>}

      <ul>
        {cart.map(item => (
          <li key={item.id}>
            {item.name} — S/{item.price} × {item.quantity}
          </li>
        ))}
      </ul>

      <h3>Total: S/{total.toFixed(2)}</h3>

      {cart.length > 0 && (
        <button onClick={finalizeSale} disabled={loading}>
          {loading ? 'Procesando…' : 'Cerrar venta'}
        </button>
      )}
    </div>
  )
}
