import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Navbar({ panierCount = 0 }) {
  const navigate = useNavigate()

  const deconnexion = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.navbar}>
      <button style={styles.navBtn} onClick={() => navigate('/accueil')}>
        <span style={styles.icon}>🏠</span>
        <span>Accueil</span>
      </button>
      <button style={styles.navBtn} onClick={() => navigate('/catalogue')}>
        <span style={styles.icon}>📦</span>
        <span>Catalogue</span>
      </button>
      <button style={styles.navBtn} onClick={() => navigate('/recherche')}>
        <span style={styles.icon}>🔍</span>
        <span>Recherche</span>
      </button>
      <button style={styles.navBtn} onClick={() => navigate('/panier')}>
        <span style={styles.icon}>🛒</span>
        <span>{panierCount > 0 ? `Panier (${panierCount})` : 'Panier'}</span>
      </button>
      <button style={styles.navBtn} onClick={() => navigate('/historique')}>
        <span style={styles.icon}>📋</span>
        <span>Historique</span>
      </button>
      <button style={styles.navBtn} onClick={deconnexion}>
        <span style={styles.icon}>🚪</span>
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
    padding: '0.6rem 0.1rem', fontSize: '0.58rem',
    cursor: 'pointer', color: '#9B8B7A',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '0.2rem',
    lineHeight: 1.4,
  },
  icon: { fontSize: '1.1rem' },
}