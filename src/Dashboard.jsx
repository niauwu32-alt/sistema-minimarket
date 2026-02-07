return (
  <div style={{ padding: 20 }}>
    <h2>🏪 Panel Minimarket</h2>

    <p>
      <b>Usuario:</b>{' '}
      {profile?.email ?? 'Cargando usuario…'}
    </p>

    <p>
      <b>Rol:</b>{' '}
      {profile?.role ?? '—'}
    </p>

    <hr />

    {profile?.role === 'admin' && (
      <>
        <Sales profile={profile} />
        <Products />
      </>
    )}

    {profile?.role === 'colaborador' && (
      <>
        <Sales profile={profile} />
        <Products />
      </>
    )}

    <button onClick={() => supabase.auth.signOut()}>
      Cerrar sesión
    </button>
  </div>
)
