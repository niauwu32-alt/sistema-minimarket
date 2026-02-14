import Sales from "./Sales"

export default function Dashboard({ session }) {
  const profile = session?.user || {}

  return (
    <div>
      {/* Solo la caja */}
      <Sales profile={profile} />
    </div>
  )
}
