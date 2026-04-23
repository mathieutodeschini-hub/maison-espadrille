import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

export default function Catalogue() {
  const [produits, setProduits] = useState([])
  const [saisons, setSaisons] = useState([])
  const [saisonActive, setSaisonActive] = useState('toutes')
  const [recherche, setRecherche] = useState('')
  const [panier, setPanier] = useState([])
  const [produitOuvert, setProduitOuvert] = useState(null)
  const [qtys, setQtys] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    chargerProduits()
    const panierSauvegarde = localStorage.getItem('panier')
    if (panierSauvegarde) setPanier(JSON.parse(panierSauvegarde))
  }, [])

  const chargerProduits = async () => {
    const { data } = await supabase.from('produits').select('*').eq('actif', true).order('saison')
    if (data) {
      setProduits(data)
      const s = [...new Set(data.map(p => p.saison))].filter(Boolean)
      setSaisons(s)
    }
    setLoading(false)
  }

  const sauvegarderPanier = (nouveauPanier) => {
    setPanier(nouveauPanier)
    localStorage.setItem('panier', JSON.stringify(nouveauPanier))
  }

  const ouvrirProduit = (p) => {
    setProduitOuvert(p)
    const ligne = panier.find(l => l.id === p.id)
    setQtys(ligne ? { ...ligne.qtys } : {})
  }

  const validerProduit = () => {
    const totalQty = Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
    let nouveauPanier
    if (totalQty === 0) {
      nouveauPanier = panier.filter(l => l.id !== produitOuvert.id)
    } else {
      const existe = panier.find(l => l.id === produitOuvert.id)
      if (existe) {
        nouveauPanier = panier.map(l => l.id === produitOuvert.id ? { ...l, qtys } : l)
      } else {
        nouveauPanier = [...panier, { ...produitOuvert, qtys }]
      }
    }
    sauvegarderPanier(nouveauPanier)
    setProduitOuvert(null)
    setQtys({})
  }

  const totalPanier = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const produitsFiltres = produits.filter(p => {
    const matchSaison = saisonActive === 'toutes' || p.saison === saisonActive
    const matchRecherche = !recherche ||
      p.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      p.reference?.toLowerCase().includes(recherche.toLowerCase()) ||
      p.coloris?.toLowerCase().includes(recherche.toLowerCase())
    return matchSaison && matchRecherche
  })

  const deconnexion = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return (
    <div style={styles.loading}>Chargement du catalogue...</div>
  )

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.logo}>LME</h1>
          <div style={styles.headerActions}>
            <button style={styles.btnPanier} onClick={() => navigate('/panier')}>
              🛒 {totalPanier > 0 && <span style={styles.badge}>{totalPanier}</span>}
            </button>
            <button style={styles.btnScanner} onClick={() => navigate('/scanner')}>
              📷
            </button>
          </div>
        </div>

        {/* Recherche */}
        <input
          style={styles.search}
          placeholder="Rechercher un produit..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />

        {/* Filtres saisons */}
        <div style={styles.saisons}>
          <button
            style={{ ...styles.saisonBtn, ...(saisonActive === 'toutes' ? styles.saisonActive : {}) }}
            onClick={() => setSaisonActive('toutes')}
          >
            Toutes
          </button>
          {saisons.map(s => (
            <button
              key={s}
              style={{ ...styles.saisonBtn, ...(saisonActive === s ? styles.saisonActive : {}) }}
              onClick={() => setSaisonActive(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Catalogue */}
      <div style={styles.grid}>
        {produitsFiltres.length === 0 && (
          <div style={styles.vide}>Aucun produit trouvé</div>
        )}
        {produitsFiltres.map(p => {
          const ligne = panier.find(l => l.id === p.id)
          const qty = ligne ? Object.values(ligne.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0) : 0
          return (
            <div key={p.id} style={{ ...styles.card, ...(qty > 0 ? styles.cardActive : {}) }} onClick={() => ouvrirProduit(p)}>
              {p.photo_url
                ? <img src={p.photo_url} alt={p.nom} style={styles.photo} />
                : <div style={styles.photoPlaceholder}>👟</div>
              }
              {qty > 0 && <div style={styles.cardBadge}>{qty}</div>}
              <div style={styles.cardRef}>{p.reference}</div>
              <div style={styles.cardNom}>{p.nom}</div>
              <div style={styles.cardColoris}>{p.coloris}</div>
              <div style={styles.cardPrix}>{Number(p.prix).toFixed(2)} €</div>
            </div>
          )
        })}
      </div>

      {/* Barre de navigation */}
      <div style={styles.navbar}>
        <button style={styles.navBtn} onClick={() => navigate('/catalogue')}>📦 Catalogue</button>
        <button style={styles.navBtn} onClick={() => navigate('/scanner')}>📷 Scanner</button>
        <button style={styles.navBtn} onClick={() => navigate('/panier')}>
          🛒 Panier {totalPanier > 0 ? `(${totalPanier})` : ''}
        </button>
        <button style={styles.navBtn} onClick={() => navigate('/historique')}>📋 Historique</button>
        <button style={styles.navBtn} onClick={deconnexion}>🚪</button>
      </div>

      {/* Modal produit */}
      {produitOuvert && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setProduitOuvert(null)}>
          <div style={styles.modal}>
            {produitOuvert.photo_url
              ? <img src={produitOuvert.photo_url} alt={produitOuvert.nom} style={styles.modalPhoto} />
              : <div style={styles.modalPhotoPlaceholder}>👟</div>
            }
            <div style={styles.modalRef}>{produitOuvert.reference}</div>
            <div style={styles.modalNom}>{produitOuvert.nom} — {produitOuvert.coloris}</div>
            <div style={styles.modalPrix}>{Number(produitOuvert.prix).toFixed(2)} € / paire</div>

            <div style={styles.sizesGrid}>
              {produitOuvert.tailles?.map(t => (
                <div key={t} style={styles.sizeItem}>
                  <div style={styles.sizeLabel}>T.{t}</div>
                  <input
                    style={styles.sizeInput}
                    type="number"
                    min="0"
                    placeholder="0"
                    value={qtys[t] || ''}
                    onChange={e => setQtys(p => ({ ...p, [t]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div style={styles.modalFooter}>
              <div style={styles.modalTotal}>
                {Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)} paires —{' '}
                {(Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0) * produitOuvert.prix).toFixed(2)} € HT
              </div>
              <button style={styles.btnValider} onClick={validerProduit}>Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#F5EFE6', paddingBottom: '70px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9B8B7A' },
  header: { background: 'white', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  logo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#1A1209' },
  headerActions: { display: 'flex', gap: '0.5rem' },
  btnPanier: { background: '#F5EFE6', border: 'none', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '1.2rem', cursor: 'pointer', position: 'relative' },
  btnScanner: { background: '#1A1209', border: 'none', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '1.2rem', cursor: 'pointer' },
  badge: { position: 'absolute', top: '-4px', right: '-4px', background: '#C0392B', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  search: { width: '100%', border: '1px solid #E8DDD0', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' },
  saisons: { display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' },
  saisonBtn: { background: '#F5EFE6', border: '1px solid #E8DDD0', borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', color: '#1A1209' },
  saisonActive: { background: '#1A1209', color: 'white', border: '1px solid #1A1209' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '1rem' },
  vide: { gridColumn: '1/-1', textAlign: 'center', color: '#9B8B7A', padding: '3rem' },
  card: { background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', position: 'relative', border: '2px solid transparent' },
  cardActive: { border: '2px solid #8B6F47' },
  photo: { width: '100%', aspectRatio: '1', objectFit: 'cover' },
  photoPlaceholder: { width: '100%', aspectRatio: '1', background: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' },
  cardBadge: { position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#8B6F47', color: 'white', borderRadius: '20px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: '700' },
  cardRef: { fontSize: '0.7rem', color: '#9B8B7A', padding: '0.5rem 0.75rem 0', fontWeight: '600' },
  cardNom: { fontSize: '0.85rem', fontWeight: '600', padding: '0.1rem 0.75rem', color: '#1A1209' },
  cardColoris: { fontSize: '0.8rem', color: '#9B8B7A', padding: '0.1rem 0.75rem' },
  cardPrix: { fontSize: '0.85rem', fontWeight: '700', color: '#8B6F47', padding: '0.25rem 0.75rem 0.75rem' },
  navbar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', borderTop: '1px solid #E8DDD0', zIndex: 10 },
  navBtn: { flex: 1, background: 'none', border: 'none', padding: '0.75rem 0.25rem', fontSize: '0.65rem', cursor: 'pointer', color: '#1A1209', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxHeight: '85vh', overflowY: 'auto' },
  modalPhoto: { width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' },
  modalPhotoPlaceholder: { width: '100%', height: '150px', background: '#F5EFE6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' },
  modalRef: { fontSize: '0.75rem', color: '#9B8B7A', fontWeight: '600' },
  modalNom: { fontSize: '1.1rem', fontWeight: '700', color: '#1A1209', margin: '0.25rem 0' },
  modalPrix: { fontSize: '0.95rem', color: '#8B6F47', fontWeight: '600', marginBottom: '1rem' },
  sizesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' },
  sizeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  sizeLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#9B8B7A' },
  sizeInput: { width: '100%', textAlign: 'center', border: '1px solid #E8DDD0', borderRadius: '6px', padding: '0.5rem 0.25rem', fontSize: '0.9rem', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTotal: { fontSize: '0.9rem', color: '#9B8B7A' },
  btnValider: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
}