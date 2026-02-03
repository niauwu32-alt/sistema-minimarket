import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState('')
  const [products, setProducts] = useState({})
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)

  // 🔹 cargar productos siempre actualizados
  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')

    if (!error && data) {
      const map = {}
      data.forEach(p => {
        map[p.barcode] = p
      })
      setProducts(map)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // 🔹 agregar producto al carrito
  const addToCart = () => {
    const product = products[barcode]

    if (!product) {
      alert('❌ Producto no encontrado')
      return
    }

    if (product.stock <= 0) {
      alert('❌ Sin stock')
      return
    }

    const existing = cart.find(i => i.id === product.id)

    if (existing) {
      if (existing.quantity + 1 > product.stock) {
        alert('❌ Stock insuficiente')
        return
      }

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

  // 🔹 quitar producto del carrito
  const removeFromCart = (id) => {
    setCart(cart.filter(i => i.id !== id))
  }

  // 🔹 total
  const total = cart.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  )

  // 🔹 cerrar venta
  const finalizeSale = async () => {
    if (cart.length === 0) return

    setLoading(true)

    for (const item of cart) {
      // 1️⃣ registrar venta
      const { error: saleError } = await supabase
        .from('sales')
        .insert({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
          sold_by: profile.id
        })

      if (saleError) {
        alert('❌ Error registrando venta')
        console.error(saleError)
        setLoading(false)
        return
      }

      // 2️⃣ bajar stock REAL (desde BD, no desde estado viejo)
      const { error: stockError } = await supabase
        .rpc('decrease_stock', {
          product_id: item.id,
          qty: item.quantity
        })

      if (stockError) {
        alert('❌ Error bajando stock')
        console.error(stockError)
        setLoading(false)
        return
      }
    }

    alert('✅ Venta registrada')
    setCart([])
    await loadProducts() // 🔥 refresco real sin recargar página
    setLoading(false)
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

      <button onClick={addToCart}>
        Agregar
      </button>

      <h3>🛒 Carrito</h3>

      {cart.length === 0 && <p>Vacío</p>}

      <ul>
        {cart.map(item => (
          <li key={item.id}>
            {item.name} — S/{item.price} × {item.quantity}
            <button onClick={() => removeFromCart(item.id)}>
              ❌
            </button>
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
