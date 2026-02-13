import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [payment, setPayment] = useState("efectivo")
  const [time, setTime] = useState(new Date())

  // 🔹 Hora en vivo
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 🔹 Cargar productos
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")

    setProducts(data || [])
  }

  // 🔹 Agregar producto por código
  function addProduct() {
    const product = products.find(
      p => p.barcode === barcode
    )

    if (!product) {
      alert("Producto no encontrado")
      return
    }

    if (product.stock <= 0) {
      alert("SIN STOCK")
      return
    }

    const existing = cart.find(
      p => p.id === product.id
    )

    if (existing) {
      setCart(
        cart.map(p =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      )
    } else {
      setCart([
        ...cart,
        { ...product, quantity: 1 }
      ])
    }

    setBarcode("")
  }

  function changeQty(id, delta) {
    setCart(
      cart.map(p => {
        if (p.id !== id) return p

        const newQty = p.quantity + delta

        if (newQty <= 0) return p
        if (newQty > p.stock) {
          alert("No hay más stock")
          return p
        }

        return { ...p, quantity: newQty }
      })
    )
  }

  function removeProduct(id) {
    setCart(cart.filter(p => p.id !== id))
  }

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
        sold_by: profile?.id,
        payment_method: payment
      })

      await supabase
        .from("products")
        .update({
          stock: item.stock - item.quantity
        })
        .eq("id", item.id)
    }

    alert("Venta registrada ✅")

    setCart([])
    loadProducts()
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>💳 Caja registradora</h2>

      {/* 👨‍💼 DATOS CAJERO */}
      <div style={{ marginBottom: 20 }}>
        <p>
          Cajero:{" "}
          {profile?.full_name || "—"}
        </p>

        <p>
          DNI: {profile?.dni || "—"}
        </p>

        <p>
          Fecha:{" "}
          {time.toLocaleDateString()}
        </p>

        <p>
          Hora:{" "}
          {time.toLocaleTimeString()}
        </p>
      </div>

      {/* 🔍 Código */}
      <input
        placeholder="Código de barras"
        value={barcode}
        onChange={e =>
          setBarcode(e.target.value)
        }
      />
      <button onClick={addProduct}>
        Agregar
      </button>

      {/* 🛒 Carrito */}
      <h3>🛒 Carrito</h3>

      {cart.length === 0 ? (
        <p>Vacío</p>
      ) : (
        cart.map(item => (
          <div key={item.id}>
            {item.name} — S/{item.price} — x
            {item.quantity}

            <button
              onClick={() =>
                changeQty(item.id, -1)
              }
            >
              ➖
            </button>

            <button
              onClick={() =>
                changeQty(item.id, 1)
              }
            >
              ➕
            </button>

            <button
              onClick={() =>
                removeProduct(item.id)
              }
            >
              ❌
            </button>
          </div>
        ))
      )}

      <h2>Total: S/{total.toFixed(2)}</h2>

      {/* 💰 Pago */}
      <h3>Método de pago</h3>

      <select
        value={payment}
        onChange={e =>
          setPayment(e.target.value)
        }
      >
        <option value="efectivo">
          Efectivo
        </option>
        <option value="tarjeta">
          Tarjeta
        </option>
        <option value="qr">QR</option>
      </select>

      <br />
      <br />

      <button onClick={finalizeSale}>
        💰 Realizar venta
      </button>
    </div>
  )
}
