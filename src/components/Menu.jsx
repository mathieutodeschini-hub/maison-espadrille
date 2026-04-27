import { useState } from 'react'
import { supabase } from '../supabase'

export default function Menu({ navigate, panierCount = 0 }) {
  const [ouvert, setOuvert] = useState(false)

  const aller = (path) => {
    setOuvert(false)
    navigate(path)
  }

  const deconnexion = async () => {
    setOuvert(false)
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
    <>
      <button style={styles.hamburger} onClick={() => setOuvert(true)}>
        <span style={styles.bar} />
        <span style={styles.bar} />
        <span style={styles.bar} />
      </button>

      {ouvert && <div style={styles.overlay} onClick={() => setOuvert(false)} />}

      <div style={{ ...styles.menu, transform: ouvert ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={styles.menuHeader}>
          <div style={styles.menuLogo}>LME</div>
          <button style={styles.btnFermer} onClick={() => setOuvert(false)}>✕</button>
        </div>
        <div style={styles.menuItems}>
          {items.map(item => (
            <button key={item.path} style={styles.menuItem} onClick={() => aller(item.path)}>
              <span style={styles.menuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <button style={styles.menuDeconnexion} onClick={deconnexion}>
          🚪 Se déconnecter
        </button>
      </div>
    </>
  )
}

const styles = {
  hamburger: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', padding: '0.5rem' },
  bar: { display: 'block', width: '22px', height: '2px', background: '#1A1209', borderRadius: '2px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 },
  menu: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: '#1A1209', zIndex: 201, display: 'flex', flexDirection: 'column', transition: 'transform 0.25s ease' },
  menuHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  menuLogo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: 'white' },
  btnFermer: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', cursor: 'pointer' },
  menuItems: { flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem 0' },
  menuItem: { background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1.25rem', fontSize: '1rem', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  menuIcon: { fontSize: '1.2rem' },
  menuDeconnexion: { background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '1.25rem', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' },
}