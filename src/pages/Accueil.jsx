import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Accueil() {
  const navigate = useNavigate()

  const deconnexion = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <img
          src="/logo.jpg"
          alt="La Maison de l'Espadrille"
          style={styles.logo}
          onError={e => e.target.style.display = 'none'}
        />
        <h1 style={styles.titre}>La Maison de l'Espadrille</h1>
        <p style={styles.subtitle}>Espace commandes</p>
      </div>

      <div style={styles.menu}>
        <button style={styles.card} onClick={() => navigate('/catalogue')}>
          <div style={styles.cardIcon}>📦</div>
          <div style={styles.cardTitre}>Catalogue</div>
          <div style={styles.cardDesc}>Parcourir les collections par saison</div>
        </button>

        <button style={styles.card} onClick={() => navigate('/recherche')}>
          <div style={styles.cardIcon}>🔍</div>
          <div style={styles.cardTitre}>Recherche</div>
          <div style={styles.cardDesc}>Trouver un produit par EAN, référence ou nom</div>
        </button>

        <button style={styles.card} onClick={() => navigate('/panier')}>
          <div style={styles.cardIcon}>🛒</div>
          <div style={styles.cardTitre}>Mon panier</div>
          <div style={styles.cardDesc}>Voir et valider ma commande en cours</div>
        </button>

        <button style={styles.card} onClick={() => navigate('/historique')}>
          <div style={styles.cardIcon}>📋</div>
          <div style={styles.cardTitre}>Historique</div>
          <div style={styles.cardDesc}>Consulter mes commandes passées</div>
        </button>
      </div>

      <button style={styles.btnDeconnexion} onClick={deconnexion}>
        Déconnexion
      </button>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#2C1A0E',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 1rem 2rem',
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem 1rem 2rem',
    width: '100%',
  },
  logo: {
    width: '200px',
    marginBottom: '1rem',
    objectFit: 'contain',
  },
  titre: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.6rem',
    color: 'white',
    textAlign: 'center',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    textAlign: 'center',
  },
  menu: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '480px',
    marginBottom: '2rem',
  },
  card: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '14px',
    padding: '1.25rem 1rem',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  cardIcon: {
    fontSize: '1.5rem',
  },
  cardTitre: {
    color: 'white',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
  btnDeconnexion: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.5)',
    borderRadius: '8px',
    padding: '0.6rem 1.5rem',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
}