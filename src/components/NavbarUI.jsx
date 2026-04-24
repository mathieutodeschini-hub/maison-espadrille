export default function NavbarUI({ navigate, active = '', panierCount = 0 }) {
  const s = {
    navbar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', borderTop: '1px solid #E8DDD0', zIndex: 10 },
    btn: { flex: 1, background: 'none', border: 'none', padding: '0.6rem 0.1rem', fontSize: '0.58rem', cursor: 'pointer', color: '#9B8B7A', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' },
    actif: { color: '#1A1209', fontWeight: '700' },
    icon: { fontSize: '1.1rem' },
  }
  const items = [
    { path: '/accueil', icon: '🏠', label: 'Accueil' },
    { path: '/catalogue', icon: '📦', label: 'Catalogue' },
    { path: '/recherche', icon: '🔍', label: 'Recherche' },
    { path: '/panier', icon: '🛒', label: panierCount > 0 ? `Panier (${panierCount})` : 'Panier' },
    { path: '/historique', icon: '📋', label: 'Historique' },
  ]
  return (
    <div style={s.navbar}>
      {items.map(item => (
        <button
          key={item.path}
          style={{ ...s.btn, ...(active === item.path ? s.actif : {}) }}
          onClick={() => navigate(item.path)}
        >
          <span style={s.icon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}