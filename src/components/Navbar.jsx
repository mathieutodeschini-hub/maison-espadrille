import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Navbar({ panierCount = 0 }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const deconnexion = async () => {
    await supabase.auth.signOut()
  }

  const items = [
    { path: '/accueil', icon: '🏠', label: 'Accueil' },
    { path: '/catalogue', icon: '📦', label: 'Catalogue' },
    { path: '/recherche', icon: '🔍', label: 'Recherche' },
    { path: '/panier', icon: '🛒', label: panierCount > 0 ? `Panier (${panierCount})` : 'Panier' },
    { path: '/historique', icon: '📋', label: 'Historique' },
  ]

  return (
    <div style={styles.navbar}>
      {items.map(item => (
        <button
          key={item.path}
          style={{ ...styles.navBtn, ...(pathname === item.path ? styles.navActif : {}) }}
          onClick={() => navigate(item.path)}
        >
          <span style={styles.navIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      <button style={styles.navBtn} onClick={deconnexion}>
        <span style={styles.navIcon}>🚪</span>
        <span>Quitter</span>
      </button>
    </div>
  )
}

const styles = {
  navbar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'white', display: 'flex',
    borderTop: '1px solid #E8DDD0', zIndex: 10,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  navBtn: {
    flex: 1, background: 'none', border: 'none',
    padding: '0.65rem 0.1rem', fontSize: '0.58rem',
    cursor: 'pointer', color: '#9B8B7A',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.2rem',
  },
  navActif: { color: '#1A1209', fontWeight: '700' },
  navIcon: { fontSize: '1.1rem' },
}