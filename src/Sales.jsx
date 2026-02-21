import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

export default function Sales({ profile }) {
  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [payment, setPayment] = useState("efectivo")
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase.from("products").select("*")
    setProducts(data || [])
  }

  function addProduct() {
    const product = products.find(p => p.barcode === barcode)

    if (!product) return alert("Producto no encontrado")
    if (product.stock <= 0) return alert("SIN STOCK")

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

  function changeQty(id, delta) {
    setCart(cart.map(p => {
      if (p.id !== id) return p

      const newQty = p.quantity + delta
      if (newQty <= 0) return p
      if (newQty > p.stock) return p

      return { ...p, quantity: newQty }
    }))
  }

  function removeProduct(id) {
    setCart(cart.filter(p => p.id !== id))
  }

  const total = cart.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  )

  // 🧾 IMPRIMIR TICKET
  function printTicket(ticket) {
    const content = `
      <div style="font-family: monospace; width: 280px;">
        <h3>MINIMARKET</h3>
        <hr/>
        Ticket: ${ticket}
        <br/>
        Cajero: ${profile?.full_name || ""}
        <br/>
        DNI: ${profile?.dni || ""}
        <br/>
        ${new Date().toLocaleString()}
        <hr/>
        ${cart.map(i =>
          `${i.name} x${i.quantity}  S/${(i.price * i.quantity).toFixed(2)}`
        ).join("<br/>")}
        <hr/>
        TOTAL: S/${total.toFixed(2)}
        <br/>
        Pago: ${payment}
        <hr/>
        Gracias por su compra
      </div>
    `

    const win = window.open("", "", "width=300,height=600")
    win.document.write(content)
    win.document.close()
    win.print()
  }

  // 💳 VENTA REAL
  async function finalizeSale() {
    if (cart.length === 0) return

    const ticket = Date.now()

    // 🧾 1. Venta principal
    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        sold_by: profile?.id || null,
        total: total,
        payment_method: payment,
        ticket_number: ticket
      })
      .select()
      .single()

    if (error || !sale) {
      console.log(error)
      return alert("Error al guardar venta")
    }

    // 📦 2. Items
    const items = cart.map(item => ({
      sale_id: sale.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }))

    const { error: itemsError } =
      await supabase.from("sale_items").insert(items)

    if (itemsError) {
      console.log(itemsError)
      return alert("Error al guardar items")
    }

    // 📉 3. STOCK CORRECTO (leer stock actual)
    for (const item of cart) {

      const { data: current } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single()

      const newStock =
        (current?.stock || 0) - item.quantity

      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.id)
    }

    printTicket(ticket)

    alert("Venta registrada — Ticket " + ticket)

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
      <div style={{
        background: "#111",
        color: "#fff",
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
      }}>
        <h2>Caja</h2>

        <div style={{
          display: "flex",
          justifyContent: "space-between"
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

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          style={{ flex: 1, padding: 12, fontSize: 18 }}
          placeholder="Escanear código"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
        />

        <button
          style={{ padding: "12px 20px", fontSize: 18 }}
          onClick={addProduct}
        >
          Agregar
        </button>
      </div>

      <div style={{
        minHeight: 200,
        border: "1px solid #ddd",
        borderRadius: 10,
        padding: 10,
        marginBottom: 20
      }}>
        {cart.length === 0 ? (
          <p>Carrito vacío</p>
        ) : (
          cart.map(item => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 10,
                borderBottom: "1px solid #eee"
              }}
            >
              <div>
                <b>{item.name}</b>
                <br />
                S/{item.price}
              </div>

              <div>
                <button onClick={() => changeQty(item.id, -1)}>-</button>
                {item.quantity}
                <button onClick={() => changeQty(item.id, 1)}>+</button>
                <button onClick={() => removeProduct(item.id)}>X</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{
        fontSize: 32,
        fontWeight: "bold",
        textAlign: "right",
        marginBottom: 20
      }}>
        Total: S/{total.toFixed(2)}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <select
          style={{ padding: 10 }}
          value={payment}
          onChange={e => setPayment(e.target.value)}
        >
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="qr">QR</option>
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
          COBRAR
        </button>
      </div>
    </div>
  )
}