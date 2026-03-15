import { useState, useEffect, useRef } from "react"
import { supabase } from "./supabaseClient"

export default function Sales({ profile, sessionId }) {

  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [payment, setPayment] = useState("efectivo")
  const [time, setTime] = useState(new Date())

  const barcodeRef = useRef(null)

  // Hora en vivo
  useEffect(() => {
    const i = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(i)
  }, [])

  // Mantener input activo
  useEffect(() => {
    barcodeRef.current?.focus()
  }, [])

  // Cargar productos
  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {

    const { data } = await supabase
      .from("products")
      .select("*")

    setProducts(data || [])
  }

  // AGREGAR PRODUCTO
  function addProduct() {

    let code = barcode
    let qty = 1

    // cantidad rápida: 2*750123
    if (barcode.includes("*")) {

      const parts = barcode.split("*")

      qty = parseInt(parts[0])
      code = parts[1]
    }

    const product = products.find(
      p => p.barcode === code
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
            ? { ...p, quantity: p.quantity + qty }
            : p
        )
      )

    } else {

      setCart([
        ...cart,
        { ...product, quantity: qty }
      ])

    }

    setBarcode("")
    barcodeRef.current?.focus()
  }

  function changeQty(id, delta) {

    setCart(
      cart.map(p => {

        if (p.id !== id) return p

        const newQty = p.quantity + delta

        if (newQty <= 0) return p
        if (newQty > p.stock) return p

        return { ...p, quantity: newQty }
      })
    )
  }

  function removeProduct(id) {

    setCart(
      cart.filter(p => p.id !== id)
    )
  }

  const total = cart.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  )

  // FINALIZAR VENTA
  async function finalizeSale() {

    if (cart.length === 0) return

    const ticket = Date.now()

    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        sold_by: profile?.id || null,
        total: total,
        payment_method: payment,
        ticket_number: ticket,
        session_id: sessionId
      })
      .select()
      .single()

    if (error || !sale) {

      console.log(error)
      alert("Error al guardar venta")

      return
    }

    const items = cart.map(item => ({

      sale_id: sale.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }))

    const { error: itemsError } =
      await supabase
        .from("sale_items")
        .insert(items)

    if (itemsError) {

      console.log(itemsError)
      alert("Error al guardar items")

      return
    }

    // actualizar stock
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
        .update({
          stock: newStock
        })
        .eq("id", item.id)
    }

    alert("Venta registrada")

    setCart([])
    loadProducts()
    barcodeRef.current?.focus()
  }

  return (

    <div style={{
      maxWidth: 900,
      margin: "auto",
      padding: 20,
      fontFamily: "Arial"
    }}>

      {/* CABECERA */}

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

          <div style={{
            textAlign: "right"
          }}>

            {time.toLocaleDateString()}
            <br />
            {time.toLocaleTimeString()}

          </div>

        </div>

      </div>

      {/* SCANER */}

      <div style={{
        display: "flex",
        gap: 10,
        marginBottom: 20
      }}>

        <input
          ref={barcodeRef}
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
          onKeyDown={(e) => {

            if (e.key === "Enter") {

              addProduct()
            }
          }}
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

      {/* CARRITO */}

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

                <button
                  onClick={() =>
                    changeQty(item.id, -1)
                  }
                >
                  -
                </button>

                {item.quantity}

                <button
                  onClick={() =>
                    changeQty(item.id, 1)
                  }
                >
                  +
                </button>

                <button
                  onClick={() =>
                    removeProduct(item.id)
                  }
                >
                  X
                </button>

              </div>

            </div>

          ))

        )}

      </div>

      {/* TOTAL */}

      <div style={{
        fontSize: 32,
        fontWeight: "bold",
        textAlign: "right",
        marginBottom: 20
      }}>

        Total: S/{total.toFixed(2)}

      </div>

      {/* PAGO */}

      <div style={{
        display: "flex",
        gap: 10
      }}>

        <select
          style={{
            padding: 10
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

          COBRAR

        </button>

      </div>

    </div>

  )
}