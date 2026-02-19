import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

export default function ProductsMobile() {

  const [products, setProducts] = useState([])

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("name")

    setProducts(data || [])
  }

  async function changeStock(id, current, delta) {

    const newStock = current + delta
    if (newStock < 0) return

    await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", id)

    loadProducts()
  }

  return (
    <div style={{
      padding: 15,
      fontFamily: "Arial",
      maxWidth: 600,
      margin: "auto"
    }}>

      <h2>Inventario</h2>

      {products.map(p => (
        <div key={p.id} style={{
          border: "1px solid #ddd",
          padding: 10,
          borderRadius: 8,
          marginBottom: 10
        }}>

          <b>{p.name}</b>
          <br />

          Precio: S/{p.price}
          <br />

          Stock: {p.stock}

          <div style={{ marginTop: 8 }}>

            <button
              onClick={() => changeStock(p.id, p.stock, -1)}
            >
              -1
            </button>

            <button
              onClick={() => changeStock(p.id, p.stock, +1)}
              style={{ marginLeft: 8 }}
            >
              +1
            </button>

          </div>
        </div>
      ))}

    </div>
  )
}
