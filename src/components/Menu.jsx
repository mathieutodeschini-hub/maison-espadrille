import { useState } from 'react'
import { supabase } from '../supabase'

export default function Menu({ navigate, panierCount = 0, hamburgerColor = 'white' }) {
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
    { path: '/historique', icon: '📋', label: 'Mes commandes' },
    { path: '/profil', icon: '👤', label: 'Mon profil' },
    { path: '/mentions-legales', icon: '📄', label: 'Mentions légales' },
    { path: '/cgv', icon: '📜', label: 'CGV' },
  ]

  return (
    <>
      {/* Bouton hamburger */}
      <button style={styles.hamburger} onClick={() => setOuvert(true)}>
        <span style={{ ...styles.bar, background: hamburgerColor }} />
        <span style={{ ...styles.bar, background: hamburgerColor }} />
        <span style={{ ...styles.bar, background: hamburgerColor }} />
      </button>

      {/* Overlay */}
      {ouvert && <div style={styles.overlay} onClick={() => setOuvert(false)} />}

      {/* Menu */}
      <div style={{ ...styles.menu, transform: ouvert ? 'translateX(0)' : 'translateX(-100%)' }}>
        {/* En-tête menu */}
        <div style={styles.menuHeader}>
          <div>
            <div style={styles.menuLogo}>La Maison de l'Espadrille</div>
            <div style={styles.menuLogoSub}>Espace commandes</div>
          </div>
          <button style={styles.btnFermer} onClick={() => setOuvert(false)}>✕</button>
        </div>

        {/* Items */}
        <div style={styles.menuItems}>
          {items.map(item => (
            <button key={item.path} style={styles.menuItem} onClick={() => aller(item.path)}>
              <span style={styles.menuItemIcon}>{item.icon}</span>
              <span style={styles.menuItemLabel}>{item.label}</span>
              <span style={styles.menuItemArrow}>›</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.menuFooter}>
          <button style={styles.btnDeconnexion} onClick={deconnexion}>
            <span>🚪</span>
            <span>Se déconnecter</span>
          </button>
          <div style={styles.menuVersion}>La Maison de l'Espadrille © 2025</div>
        </div>
      </div>
    </>
  )
}

const styles = {
  hamburger: {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: '5px',
    padding: '0.4rem', borderRadius: '8px',
  },
  bar: {
    display: 'block', width: '20px', height: '1.5px',
    borderRadius: '2px',
    // background est passé inline via la prop hamburgerColor
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(44,26,14,0.5)',
    zIndex: 200, backdropFilter: 'blur(2px)',
  },
  menu: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: '300px', background: 'var(--beige-card)',
    zIndex: 201, display: 'flex', flexDirection: 'column',
    transition: 'transform 0.3s ease',
    borderRight: '1px solid var(--border)',
  },
  menuHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '2rem 1.5rem 1.25rem',
    borderBottom: '1px solid var(--border)',
    background: 'var(--brown-dark)',
  },
  menuLogo: {
    fontFamily: 'Playfair Display, serif', fontSize: '1rem',
    color: 'white', fontWeight: '600', lineHeight: 1.3,
  },
  menuLogoSub: {
    fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
    marginTop: '0.25rem', letterSpacing: '0.05em',
  },
  btnFermer: {
    background: 'rgba(255,255,255,0.1)', border: 'none',
    color: 'white', fontSize: '1rem', cursor: 'pointer',
    width: '30px', height: '30px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  menuItems: {
    flex: 1, display: 'flex', flexDirection: 'column',
    padding: '0.75rem 0', overflowY: 'auto',
  },
  menuItem: {
    background: 'none', border: 'none',
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    padding: '0.85rem 1.5rem', cursor: 'pointer',
    textAlign: 'left', borderBottom: '1px solid var(--border)',
    transition: 'background 0.15s',
  },
  menuItemIcon: { fontSize: '1.1rem', width: '24px', textAlign: 'center' },
  menuItemLabel: { flex: 1, fontSize: '0.92rem', fontWeight: '500', color: 'var(--brown-dark)' },
  menuItemArrow: { color: 'var(--text-muted)', fontSize: '1.1rem' },
  menuFooter: {
    padding: '1.25rem 1.5rem',
    borderTop: '1px solid var(--border)',
  },
  btnDeconnexion: {
    background: 'none', border: '1px solid var(--border)',
    borderRadius: '25px', color: 'var(--text-muted)',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.7rem 1.25rem', fontSize: '0.85rem',
    cursor: 'pointer', width: '100%', justifyContent: 'center',
    marginBottom: '0.85rem',
  },
  menuVersion: {
    fontSize: '0.68rem', color: 'var(--text-muted)',
    textAlign: 'center',
  },
}
