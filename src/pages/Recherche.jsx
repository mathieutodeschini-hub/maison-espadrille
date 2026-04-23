import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Navbar from '../components/Navbar'

export default function Recherche() {
  const [query, setQuery] = useState('')
  const [resultats, setResultats] = useState([])
  const [rechercheFaite, setRechercheFaite] = useState(false)
  const [produitOuvert, setProduitOuvert] = useState(null)
  const [qtys, setQtys] = useState({})
  const [panier, setPanier] = useState(() => {
    const s = localStorage.getItem('panier')
    return s ? JSON.parse(s) : []
  })
  const navigate = useNavigate()

  const rechercher = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    const q = query.trim().toLowerCase()
    const { data } = await supabase.from('produits').select('*').eq('actif', true)
    if (data) {
      const filtres = data.filter(p =>
        p.nom?.toLowerCase().includes(q) ||
        p.reference?.toLowerCase().includes(q) ||
        p.coloris?.toLowerCase().includes(q) ||
        p.ean?.some(e => e.includes(q))
      )
      setResultats(filtres)
      setRechercheFaite(true)
    }
  }

  const ouvrirProduit = (p) => {
    setProduitOuvert(p)
    const ligne = panier.find(l => l.id === p.id)
    setQtys(ligne ? { ...ligne.qtys } : {})
  }

  const updateQty = (taille, delta) => {
    setQtys(prev => {
      const current = parseInt(prev[taille]) || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [taille]: next }
    })
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
    localStorage.setItem('panier', JSON.stringify(nouveauPanier))
    setPanier(nouveauPanier)
    setProduitOuvert(null)
    setQtys({})
  }

  const totalPanier = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.logo}>LME</h1>
      </div>

      <div style={styles.searchSection}>
        <form onSubmit={rechercher} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Code EAN, référence ou nom du modèle..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <button style={styles.btnRecherche} type="submit">Rechercher</button>
        </form>
      </div>

      {!rechercheFaite && (
        <div style={styles.aide}>
          <p style={styles.aideTitre}>Vous pouvez rechercher par :</p>
          <div style={styles.aideItems}>
            <div style={styles.aideItem}>📦 Code EAN (ex: 3700000000001)</div>
            <div style={styles.aideItem}>🏷️ Référence (ex: ESP-CAN-001)</div>
            <div style={styles.aideItem}>👟 Nom du modèle (ex: Espadrille)</div>
            <div style={styles.aideItem}>🎨 Coloris (ex: Marine)</div>
          </div>
        </div>
      )}

      {rechercheFaite && resultats.length === 0 && (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>🔍</div>
          <p style={styles.videMsg}>Aucun produit trouvé</p>
          <p style={styles.videHint}>Vérifiez le code ou le nom saisi</p>
        </div>
      )}

      {resultats.length > 0 && (
        <div style={styles.resultats}>
          <p style={styles.nbResultats}>{resultats.length} produit{resultats.length > 1 ? 's' : ''} trouvé{resultats.length > 1 ? 's' : ''}</p>
          {resultats.map(p => {
            const ligne = panier.find(l => l.id === p.id)
            const qty = ligne ? Object.values(ligne.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0) : 0
            return (
              <div key={p.id} style={{ ...styles.card, ...(qty > 0 ? styles.cardActive : {}) }} onClick={() => ouvrirProduit(p)}>
                {p.photo_url
                  ? <img src={p.photo_url} alt={p.nom} style={styles.photo} />
                  : <div style={styles.photoPlaceholder}>👟</div>
                }
                <div style={styles.cardInfo}>
                  <div style={styles.cardRef}>{p.reference} · {p.saison}</div>
                  <div style={styles.cardNom}>{p.nom} — {p.coloris}</div>
                  <div style={styles.cardPrix}>{Number(p.prix).toFixed(2)} € / paire</div>
                </div>
                {qty > 0 && <div style={styles.cardBadge}>{qty} paires</div>}
              </div>
            )
          })}
        </div>
      )}

      <Navbar panierCount={totalPanier} />

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
                  <div style={styles.sizeControls}>
                    <button style={styles.btnQty} onClick={() => updateQty(t, -1)}>−</button>
                    <span style={styles.sizeQty}>{parseInt(qtys[t]) || 0}</span>
                    <button style={styles.btnQty} onClick={() => updateQty(t, 1)}>+</button>
                  </div>
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
  container: { minHeight: '100vh', background: '#F5EFE6', paddingBottom: '80px' },
  header: { background: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', color: '#1A1209' },
  searchSection: { padding: '1.5rem 1rem 1rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { border: '1px solid #E8DDD0', borderRadius: '10px', padding: '0.9rem 1rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white', color: '#1A1209' },
  btnRecherche: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.9rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  aide: { padding: '0 1rem' },
  aideTitre: { fontSize: '0.85rem', color: '#9B8B7A', marginBottom: '0.75rem', fontWeight: '600' },
  aideItems: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  aideItem: { background: 'white', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#1A1209' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', gap: '0.5rem' },
  videEmoji: { fontSize: '3rem' },
  videMsg: { fontSize: '1.1rem', fontWeight: '700', color: '#1A1209' },
  videHint: { fontSize: '0.85rem', color: '#9B8B7A' },
  resultats: { padding: '0 1rem' },
  nbResultats: { fontSize: '0.8rem', color: '#9B8B7A', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' },
  card: { background: 'white', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: '2px solid transparent', position: 'relative' },
  cardActive: { border: '2px solid #8B6F47' },
  photo: { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  photoPlaceholder: { width: '64px', height: '64px', background: '#F5EFE6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardRef: { fontSize: '0.7rem', color: '#9B8B7A', fontWeight: '600' },
  cardNom: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209', margin: '0.1rem 0' },
  cardPrix: { fontSize: '0.85rem', color: '#8B6F47', fontWeight: '600' },
  cardBadge: { background: '#8B6F47', color: 'white', borderRadius: '20px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxHeight: '85vh', overflowY: 'auto' },
  modalPhoto: { width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' },
  modalPhotoPlaceholder: { width: '100%', height: '150px', background: '#F5EFE6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' },
  modalRef: { fontSize: '0.75rem', color: '#9B8B7A', fontWeight: '600' },
  modalNom: { fontSize: '1.1rem', fontWeight: '700', color: '#1A1209', margin: '0.25rem 0' },
  modalPrix: { fontSize: '0.95rem', color: '#8B6F47', fontWeight: '600', marginBottom: '1rem' },
  sizesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' },
  sizeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' },
  sizeLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#9B8B7A' },
  sizeControls: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  btnQty: { background: '#F5EFE6', border: 'none', borderRadius: '6px', width: '28px', height: '28px', fontSize: '1.1rem', cursor: 'pointer', color: '#1A1209', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' },
  sizeQty: { fontSize: '1rem', fontWeight: '600', color: '#1A1209', minWidth: '22px', textAlign: 'center' },
  modalFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTotal: { fontSize: '0.9rem', color: '#9B8B7A' },
  btnValider: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
}