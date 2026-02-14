import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [payment, setPayment] = useState("efectivo")
  const [time, setTime] = useState(new Date())

  // 🕒 Hora en vivo
  useEffect(() => {
    const i = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(i)
  }, [])

  // 📦 Cargar productos
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
    setProducts(data || [])
  }

  // 🔎 Agregar producto
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

  // 💰 Finalizar venta
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
    <div style={{
      maxWidth: 900,
      margin: "auto",
      padding: 20,
      fontFamily: "Arial"
    }}>
      {/* 🧾 CABECERA */}
      <div style={{
        background: "#111",
        color: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
      }}>
        <h2 style={{ margin: 0 }}>
          💳 Caja
        </h2>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14
        }}>
          <div>
            {profile?.full_name}
            <br />
            DNI: {profile?.dni}
          </div>

          <div style={{ textAlign: "right" }}>
            {time.toLocaleDateString()}
            <br />
            {time.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* 🔍 BUSCADOR */}
      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: 20
      }}>
        <input
          style={{
            flex: 1,
            padding: 12,
            fontSize: 18
          }}
          placeholder="Escanear código"
          value={barcode}
          onChange={e =>
            setBarcode(e.target.value)
          }
        />

        <button
          style={{
            padding: "12px 20px",
            fontSize: 18
          }}
          onClick={addProduct}
        >
          Agregar
        </button>
      </div>

      {/* 🛒 CARRITO */}
      <div style={{
        minHeight: 200,
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 10,
        marginBottom: 20
      }}>
        {cart.length === 0 ? (
          <p style={{ color: "#888" }}>
            Carrito vacío
          </p>
        ) : (
          cart.map(item => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                padding: 10,
                borderBottom:
                  "1px solid #eee"
              }}
            >
              <div>
                <b>{item.name}</b>
                <br />
                S/{item.price}
              </div>

              <div>
                <button
                  onClick={() =>
                    changeQty(item.id, -1)
                  }
                >
                  ➖
                </button>

                {item.quantity}

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
            </div>
          ))
        )}
      </div>

      {/* 💰 TOTAL */}
      <div style={{
        fontSize: 32,
        fontWeight: "bold",
        textAlign: "right",
        marginBottom: 20
      }}>
        Total: S/{total.toFixed(2)}
      </div>

      {/* 💳 PAGO */}
      <div style={{
        display: "flex",
        gap: 10,
        alignItems: "center"
      }}>
        <select
          style={{
            padding: 10,
            fontSize: 16
          }}
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
          <option value="qr">
            QR
          </option>
        </select>

        <button
          style={{
            flex: 1,
            padding: 15,
            fontSize: 20,
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: 8
          }}
          onClick={finalizeSale}
        >
          💰 COBRAR
        </button>
      </div>
    </div>
  )
}
