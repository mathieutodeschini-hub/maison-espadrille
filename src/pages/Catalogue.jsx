import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import Menu from '../components/Menu'

const FAVORIS_KEY = 'lme_favoris'

const loadFavoris = () => {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORIS_KEY) || '[]')) }
  catch { return new Set() }
}

const saveFavoris = (set) => {
  localStorage.setItem(FAVORIS_KEY, JSON.stringify([...set]))
}

export default function Catalogue() {
  const [modeles, setModeles] = useState([])
  const [saisons, setSaisons] = useState([])
  const [saisonActive, setSaisonActive] = useState('toutes')
  const [afficherFavoris, setAfficherFavoris] = useState(false)
  const [favoris, setFavoris] = useState(loadFavoris())
  const [recherche, setRecherche] = useState('')
  const [panier, setPanier] = useState([])
  const [modeleOuvert, setModeleOuvert] = useState(null)
  const [varianteOuverte, setVarianteOuverte] = useState(null)
  const [qtys, setQtys] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    chargerModeles()
    const panierSauvegarde = localStorage.getItem('panier')
    if (panierSauvegarde) setPanier(JSON.parse(panierSauvegarde))
  }, [])

  const chargerModeles = async () => {
    const { data: m } = await supabase.from('modeles').select('*').eq('actif', true).order('reference')
    if (m) {
      const modelesAvecVariantes = await Promise.all(
        m.map(async (modele) => {
          const { data: variantes } = await supabase.from('variantes').select('*').eq('modele_id', modele.id).eq('actif', true)
          return { ...modele, variantes: variantes || [] }
        })
      )
      setModeles(modelesAvecVariantes)
      const s = [...new Set(modelesAvecVariantes.map(m => m.saison))].filter(Boolean)
      setSaisons(s)
    }
    setLoading(false)
  }

  const sauvegarderPanier = (nouveauPanier) => {
    setPanier(nouveauPanier)
    localStorage.setItem('panier', JSON.stringify(nouveauPanier))
  }

  const toggleFavori = (e, modeleId) => {
    e.stopPropagation()
    setFavoris(prev => {
      const next = new Set(prev)
      if (next.has(modeleId)) { next.delete(modeleId) } else { next.add(modeleId) }
      saveFavoris(next)
      return next
    })
  }

  const ouvrirModele = (m) => {
    setModeleOuvert(m)
    setVarianteOuverte(null)
    setQtys({})
  }

  const ouvrirVariante = (v) => {
    setVarianteOuverte(v)
    const ligne = panier.find(l => l.varianteId === v.id)
    setQtys(ligne ? { ...ligne.qtys } : {})
  }

  const updateQty = (taille, delta) => {
    setQtys(prev => {
      const current = parseInt(prev[taille]) || 0
      const next = Math.max(0, current + delta)
      return { ...prev, [taille]: next }
    })
  }

  const validerVariante = () => {
    if (!varianteOuverte || !modeleOuvert) return
    const totalQty = Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
    const key = varianteOuverte.id
    let nouveauPanier
    if (totalQty === 0) {
      nouveauPanier = panier.filter(l => l.varianteId !== key)
    } else {
      const ligne = {
        id: key, varianteId: key, modeleId: modeleOuvert.id,
        reference: modeleOuvert.reference, nom: modeleOuvert.reference,
        coloris: varianteOuverte.coloris, prix: varianteOuverte.prix,
        tailles: varianteOuverte.tailles, photo_url: varianteOuverte.photo_url,
        saison: modeleOuvert.saison, qtys,
      }
      const existe = panier.find(l => l.varianteId === key)
      nouveauPanier = existe ? panier.map(l => l.varianteId === key ? ligne : l) : [...panier, ligne]
    }
    sauvegarderPanier(nouveauPanier)
    setVarianteOuverte(null)
    setModeleOuvert(null)
    setQtys({})
  }

  const totalPanier = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const getPanierQtyForModele = (modele) =>
    panier.filter(l => l.modeleId === modele.id)
      .reduce((sum, l) => sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const getPanierQtyForVariante = (varianteId) => {
    const ligne = panier.find(l => l.varianteId === varianteId)
    return ligne ? Object.values(ligne.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0) : 0
  }

  const modelesFiltres = modeles.filter(m => {
    const matchSaison = saisonActive === 'toutes' || m.saison === saisonActive
    const matchFavoris = !afficherFavoris || favoris.has(m.id)
    const matchRecherche = !recherche ||
      m.reference?.toLowerCase().includes(recherche.toLowerCase()) ||
      m.variantes?.some(v => v.coloris?.toLowerCase().includes(recherche.toLowerCase()))
    return matchSaison && matchFavoris && matchRecherche && m.variantes?.length > 0
  })

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Menu navigate={navigate} panierCount={totalPanier} hamburgerColor="var(--brown-dark)" />
        <h1 style={styles.headerTitre}>Catalogue</h1>
        <button style={styles.btnPanier} onClick={() => navigate('/panier')}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brown-dark)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {totalPanier > 0 && <span style={styles.badge}>{totalPanier}</span>}
        </button>
      </div>

      {/* Recherche */}
      <div style={styles.searchWrap}>
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          {recherche && (
            <button style={styles.searchClear} onClick={() => setRecherche('')}>✕</button>
          )}
        </div>
      </div>

      {/* Filtres saisons + Favoris */}
      <div style={styles.filtresWrap}>
        {/* Bouton Favoris */}
        <button
          style={{ ...styles.filtreBtn, ...styles.filtreFavoris, ...(afficherFavoris ? styles.filtreFavorisActif : {}) }}
          onClick={() => { setAfficherFavoris(f => !f); setSaisonActive('toutes') }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill={afficherFavoris ? 'white' : 'none'} stroke={afficherFavoris ? 'white' : '#8B6F47'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle' }}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
          Favoris {favoris.size > 0 && `(${favoris.size})`}
        </button>

        {/* Séparateur */}
        <div style={styles.filtreSep} />

        <button
          style={{ ...styles.filtreBtn, ...(!afficherFavoris && saisonActive === 'toutes' ? styles.filtreActif : {}) }}
          onClick={() => { setSaisonActive('toutes'); setAfficherFavoris(false) }}
        >
          Toutes
        </button>
        {saisons.map(s => (
          <button
            key={s}
            style={{ ...styles.filtreBtn, ...(!afficherFavoris && saisonActive === s ? styles.filtreActif : {}) }}
            onClick={() => { setSaisonActive(s); setAfficherFavoris(false) }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grille produits */}
      <div style={styles.content}>
        {afficherFavoris && favoris.size === 0 ? (
          <div style={styles.vide}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤍</div>
            <div>Aucun favori pour l'instant</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
              Appuyez sur le ❤️ d'un produit pour l'ajouter
            </div>
          </div>
        ) : modelesFiltres.length === 0 ? (
          <div style={styles.vide}>Aucun produit trouvé</div>
        ) : (
          <div style={styles.grid}>
            {modelesFiltres.map(m => {
              const qty = getPanierQtyForModele(m)
              const photoUrl = m.variantes?.[0]?.photo_url
              const prixMin = Math.min(...m.variantes.map(v => v.prix))
              const estFavori = favoris.has(m.id)
              return (
                <div key={m.id} style={{ ...styles.card, ...(qty > 0 ? styles.cardActive : {}) }} onClick={() => ouvrirModele(m)}>
                  <div style={styles.cardImgWrap}>
                    {photoUrl
                      ? <img src={photoUrl} alt={m.reference} style={styles.cardImg} />
                      : <div style={styles.cardImgPlaceholder}>👟</div>
                    }
                    {qty > 0 && <div style={styles.cardBadge}>{qty}</div>}
                    <div style={styles.cardSaison}>{m.saison}</div>
                    {/* Bouton favori */}
                    <button
                      style={{ ...styles.btnFavori, ...(estFavori ? styles.btnFavoriActif : {}) }}
                      onClick={(e) => toggleFavori(e, m.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={estFavori ? 'white' : 'none'} stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.cardRef}>{m.reference}</div>
                    <div style={styles.cardColoris}>{m.variantes?.length} coloris</div>
                    <div style={styles.cardPrix}>{prixMin.toFixed(2)} €</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal coloris */}
      {modeleOuvert && !varianteOuverte && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setModeleOuvert(null)}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalSaison}>{modeleOuvert.saison}</div>
                <div style={styles.modalTitre}>{modeleOuvert.reference}</div>
                <div style={styles.modalSub}>Choisir un coloris</div>
              </div>
              <button style={styles.modalClose} onClick={() => setModeleOuvert(null)}>✕</button>
            </div>
            <div style={styles.colorisGrid}>
              {modeleOuvert.variantes?.map(v => {
                const qty = getPanierQtyForVariante(v.id)
                return (
                  <div key={v.id} style={{ ...styles.colorisCard, ...(qty > 0 ? styles.colorisActif : {}) }} onClick={() => ouvrirVariante(v)}>
                    {v.photo_url
                      ? <img src={v.photo_url} alt={v.coloris} style={styles.colorisImg} />
                      : <div style={styles.colorisImgPlaceholder}>👟</div>
                    }
                    {qty > 0 && <div style={styles.colorisBadge}>{qty}</div>}
                    <div style={styles.colorisNom}>{v.coloris}</div>
                    <div style={styles.colorisPrix}>{Number(v.prix).toFixed(2)} €</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal tailles */}
      {varianteOuverte && modeleOuvert && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setVarianteOuverte(null)}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {varianteOuverte.photo_url && (
                  <img src={varianteOuverte.photo_url} alt={varianteOuverte.coloris} style={styles.modalThumb} />
                )}
                <div>
                  <div style={styles.modalTitre}>{modeleOuvert.reference}</div>
                  <div style={styles.modalSub}>Coloris : {varianteOuverte.coloris}</div>
                  <div style={styles.modalPrix}>{Number(varianteOuverte.prix).toFixed(2)} € / paire</div>
                </div>
              </div>
              <button style={styles.modalClose} onClick={() => setVarianteOuverte(null)}>←</button>
            </div>

            <div style={styles.sizesLabel}>Sélectionner les quantités par taille</div>
            <div style={styles.sizesGrid}>
              {varianteOuverte.tailles?.map(t => (
                <div key={t} style={styles.sizeItem}>
                  <div style={styles.sizeLabel}>T.{t}</div>
                  <div style={styles.sizeControls}>
                    <button style={styles.btnQty} onClick={() => updateQty(t, -1)}>−</button>
                    <span style={{ ...styles.sizeQty, ...(parseInt(qtys[t]) > 0 ? styles.sizeQtyActive : {}) }}>
                      {parseInt(qtys[t]) || 0}
                    </span>
                    <button style={styles.btnQty} onClick={() => updateQty(t, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.modalFooter}>
              <div style={styles.modalTotal}>
                <span style={styles.modalTotalLabel}>Total</span>
                <span style={styles.modalTotalVal}>
                  {Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)} paires —{' '}
                  {(Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0) * varianteOuverte.prix).toFixed(2)} €
                </span>
              </div>
              <button style={styles.btnAjouter} onClick={validerVariante}>
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', paddingBottom: '2rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' },

  header: {
    background: 'var(--beige-card)', padding: '1rem 1.25rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10,
  },
  headerTitre: { fontSize: '1.1rem', fontFamily: 'Playfair Display, serif', color: 'var(--brown-dark)', fontWeight: '600' },
  btnPanier: {
    background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
    width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: '-2px', right: '-2px',
    background: 'var(--red)', color: 'white', borderRadius: '50%',
    width: '16px', height: '16px', fontSize: '0.65rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700',
  },

  searchWrap: { padding: '1rem 1.25rem 0.5rem' },
  searchBox: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.5rem' },
  searchIcon: { fontSize: '0.9rem', color: 'var(--text-muted)' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', padding: '0.75rem 0', fontSize: '0.9rem', outline: 'none', color: 'var(--brown-dark)' },
  searchClear: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' },

  filtresWrap: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem 1rem', overflowX: 'auto' },
  filtreBtn: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.4rem 1rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontWeight: '500', flexShrink: 0 },
  filtreActif: { background: 'var(--brown-dark)', color: 'white', border: '1px solid var(--brown-dark)' },
  filtreFavoris: { display: 'flex', alignItems: 'center', color: 'var(--brown-mid)', border: '1px solid var(--brown-mid)', fontWeight: '600' },
  filtreFavorisActif: { background: '#C0392B', color: 'white', border: '1px solid #C0392B' },
  filtreSep: { width: '1px', height: '20px', background: 'var(--border)', flexShrink: 0 },

  content: { padding: '0 1.25rem' },
  vide: { textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', fontSize: '0.9rem' },

  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  card: { background: 'var(--beige-card)', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid var(--border)', cursor: 'pointer', transition: 'transform 0.15s' },
  cardActive: { border: '1.5px solid var(--brown-mid)' },
  cardImgWrap: { position: 'relative', aspectRatio: '1', background: 'var(--beige-dark)' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' },
  cardBadge: { position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--brown-mid)', color: 'white', borderRadius: '20px', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: '700' },
  cardSaison: { position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(44,26,14,0.7)', color: 'white', borderRadius: '6px', padding: '0.1rem 0.4rem', fontSize: '0.65rem', fontWeight: '600', backdropFilter: 'blur(4px)' },

  btnFavori: {
    position: 'absolute', top: '0.5rem', left: '0.5rem',
    background: 'rgba(44,26,14,0.35)', border: 'none', borderRadius: '50%',
    width: '28px', height: '28px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)', transition: 'background 0.2s',
  },
  btnFavoriActif: { background: '#C0392B' },

  cardBody: { padding: '0.75rem' },
  cardRef: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--brown-dark)', marginBottom: '0.2rem' },
  cardColoris: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' },
  cardPrix: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--brown-mid)' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(2px)' },
  modal: { background: 'var(--beige-card)', borderRadius: '24px 24px 0 0', padding: '0 1.5rem 2rem', width: '100%', maxHeight: '88vh', overflowY: 'auto' },
  modalHandle: { width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0.75rem auto 0' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 0 1rem' },
  modalSaison: { fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.2rem' },
  modalTitre: { fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', color: 'var(--brown-dark)' },
  modalSub: { fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' },
  modalPrix: { fontSize: '0.95rem', color: 'var(--brown-mid)', fontWeight: '600', marginTop: '0.2rem' },
  modalClose: { background: 'var(--beige)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--brown-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalThumb: { width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' },

  colorisGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', paddingBottom: '1rem' },
  colorisCard: { background: 'var(--beige)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1.5px solid transparent', position: 'relative' },
  colorisActif: { border: '1.5px solid var(--brown-mid)' },
  colorisImg: { width: '100%', aspectRatio: '1', objectFit: 'cover' },
  colorisImgPlaceholder: { width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: 'var(--beige-dark)' },
  colorisBadge: { position: 'absolute', top: '0.3rem', right: '0.3rem', background: 'var(--brown-mid)', color: 'white', borderRadius: '20px', padding: '0.1rem 0.4rem', fontSize: '0.6rem', fontWeight: '700' },
  colorisNom: { fontSize: '0.75rem', fontWeight: '600', padding: '0.4rem 0.5rem 0.1rem', color: 'var(--brown-dark)' },
  colorisPrix: { fontSize: '0.72rem', color: 'var(--brown-mid)', fontWeight: '600', padding: '0 0.5rem 0.5rem' },

  sizesLabel: { fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' },
  sizesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.5rem' },
  sizeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' },
  sizeLabel: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)' },
  sizeControls: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
  btnQty: { background: 'var(--beige)', border: '1px solid var(--border)', borderRadius: '8px', width: '28px', height: '28px', fontSize: '1rem', cursor: 'pointer', color: 'var(--brown-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' },
  sizeQty: { fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-muted)', minWidth: '20px', textAlign: 'center' },
  sizeQtyActive: { color: 'var(--brown-dark)' },

  modalFooter: { borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTotal: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  modalTotalLabel: { fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' },
  modalTotalVal: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--brown-dark)' },
  btnAjouter: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
}
