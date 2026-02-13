import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])

  // 🔹 Cargar productos
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*")
    setProducts(data || [])
  }

  // 🔹 Agregar por código
  function addProduct() {
    const product = products.find(p => p.barcode === barcode)

    if (!product) {
      alert("Producto no encontrado")
      return
    }

    if (product.stock <= 0) {
      alert("Sin stock")
      return
    }

    const existing = cart.find(p => p.id === product.id)

    if (existing) {
      setCart(cart.map(p =>
        p.id === product.id
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }

    setBarcode("")
  }

  // 🔹 Quitar producto
  function removeProduct(id) {
    setCart(cart.filter(p => p.id !== id))
  }

  // 🔹 Total
  const total = cart.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  )

  // 🔹 Finalizar venta
  async function finalizeSale() {
    if (cart.length === 0) return

    for (const item of cart) {
      await supabase.from("sales").insert({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        product_id: item.id,
        sold_by: profile?.id
      })

      await supabase
        .from("products")
        .update({
          stock: item.stock - item.quantity
        })
        .eq("id", item.id)
    }

    alert("Venta realizada ✅")
    setCart([])
    loadProducts()
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 Caja registradora</h2>

      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e => setBarcode(e.target.value)}
      />
      <button onClick={addProduct}>Agregar</button>

      <h3>🛒 Carrito</h3>

      {cart.length === 0 ? (
        <p>Vacío</p>
      ) : (
        cart.map(item => (
          <div key={item.id}>
            {item.name} — S/{item.price} — x{item.quantity}
            <button onClick={() => removeProduct(item.id)}>❌</button>
          </div>
        ))
      )}

      <h3>Total: S/{total.toFixed(2)}</h3>

      <button onClick={finalizeSale}>
        Realizar venta
      </button>
    </div>
  )
}
