export default function Products({ products }) {
  return (
    <div>
      <h2>📦 Productos</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          const [products, setProducts] = useState()

            <tr key={p.id}>
              <td>{p.name}</td>
              <td>S/{p.price}</td>
              <td>{p.stock}</td>
            </tr>
        
        </tbody>
      </table>
    </div>
  )
}
