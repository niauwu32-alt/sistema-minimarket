import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState('')
  const [cart, setCart] = useState([]) // SIEMPRE array
  const [productsMap, setProductsMap] = useState({})

  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      const map = {}
      ;(data || []).forEach(p => {
        map[p.barcode] = p
      })
      setProductsMap(map)
    }
    loadProducts()
  }, [])

  const addToCart = () => {
    const product = productsMap[barcode]
    if (!product) {
      alert('Producto no encontrado')
      return
    }
    if (product.stock <= 0) {
      alert('Stock agotado')
      return
    }

    setCart(prev => {
      const existing = prev.find(p => p.id === product.id)
      if (existing) {
        if (existing.quantity + 1 > product.stock) return prev
        return prev.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })

    setBarcode('')
  }

  const changeQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(p => {
          if (p.id !== id) return p
          const qty = Math.max(0, p.quantity + delta)
          return { ...p, quantity: qty }
        })
        .filter(p => p.quantity > 0)
    )
  }

  const total = cart.reduce((s, p) => s + p.price * p.quantity, 0)

  const finalizeSale = async () => {
    if (cart.length === 0) return

    for (const item of cart) {
      await supabase.from('sales').insert({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        sold_by: profile?.id ?? null,
        payment_method: 'efectivo'
      })

      await supabase
        .from('products')
        .update({ stock: item.stock - item.quantity })
        .eq('id', item.id)
    }

    alert('Venta registrada')
    setCart([])
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>💳 Caja registradora</h3>

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
      />
      <button onClick={addToCart}>Agregar</button>

      <h4>🛒 Carrito</h4>

      {cart.length === 0 ? (
        <p>Vacío</p>
      ) : (
        cart.map(p => (
          <div key={p.id}>
            {p.name} — S/{p.price} — Cant: {p.quantity}
            <button onClick={() => changeQty(p.id, +1)}>+</button>
            <button onClick={() => changeQty(p.id, -1)}>-</button>
          </div>
        ))
      )}

      <h4>Total: S/{total.toFixed(2)}</h4>
      <button onClick={finalizeSale} disabled={cart.length === 0}>
        Finalizar venta
      </button>
    </div>
  )
}
