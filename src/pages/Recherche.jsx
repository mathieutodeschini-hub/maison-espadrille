import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Menu from '../components/Menu'

export default function Recherche() {
  const [query, setQuery] = useState('')
  const [resultats, setResultats] = useState([])
  const [rechercheFaite, setRechercheFaite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modeleOuvert, setModeleOuvert] = useState(null)
  const [varianteOuverte, setVarianteOuverte] = useState(null)
  const [qtys, setQtys] = useState({})
  const [panier, setPanier] = useState(() => {
    const s = localStorage.getItem('panier')
    return s ? JSON.parse(s) : []
  })
  const navigate = useNavigate()

  const rechercher = async (e) => {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const q = query.trim().toLowerCase()
    const { data: modeles } = await supabase.from('modeles').select('*').eq('actif', true)
    if (!modeles) { setLoading(false); return }
    const modelesAvecVariantes = await Promise.all(
      modeles.map(async (modele) => {
        const { data: variantes } = await supabase.from('variantes').select('*').eq('modele_id', modele.id).eq('actif', true)
        return { ...modele, variantes: variantes || [] }
      })
    )
    const filtres = modelesAvecVariantes.filter(m =>
      m.reference?.toLowerCase().includes(q) ||
      m.variantes?.some(v =>
        v.coloris?.toLowerCase().includes(q) ||
        v.eans?.some(ean => ean.includes(q))
      )
    )
    setResultats(filtres)
    setRechercheFaite(true)
    setLoading(false)
  }

  const ouvrirModele = (m) => { setModeleOuvert(m); setVarianteOuverte(null); setQtys({}) }
  const ouvrirVariante = (v) => {
    setVarianteOuverte(v)
    const ligne = panier.find(l => l.varianteId === v.id)
    setQtys(ligne ? { ...ligne.qtys } : {})
  }

  const updateQty = (taille, delta) => {
    setQtys(prev => {
      const current = parseInt(prev[taille]) || 0
      return { ...prev, [taille]: Math.max(0, current + delta) }
    })
  }

  const validerVariante = () => {
    if (!varianteOuverte || !modeleOuvert) return
    const totalQty = Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
    const key = varianteOuverte.id
    const ligne = {
      id: key, varianteId: key, modeleId: modeleOuvert.id,
      reference: modeleOuvert.reference, nom: modeleOuvert.reference,
      coloris: varianteOuverte.coloris, prix: varianteOuverte.prix,
      tailles: varianteOuverte.tailles, photo_url: varianteOuverte.photo_url,
      saison: modeleOuvert.saison, qtys,
    }
    let nouveauPanier
    if (totalQty === 0) {
      nouveauPanier = panier.filter(l => l.varianteId !== key)
    } else {
      const existe = panier.find(l => l.varianteId === key)
      nouveauPanier = existe ? panier.map(l => l.varianteId === key ? ligne : l) : [...panier, ligne]
    }
    localStorage.setItem('panier', JSON.stringify(nouveauPanier))
    setPanier(nouveauPanier)
    setVarianteOuverte(null)
    setModeleOuvert(null)
    setQtys({})
  }

  const getPanierQtyForVariante = (varianteId) => {
    const ligne = panier.find(l => l.varianteId === varianteId)
    return ligne ? Object.values(ligne.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0) : 0
  }

  const getPanierQtyForModele = (modele) =>
    panier.filter(l => l.modeleId === modele.id)
      .reduce((sum, l) => sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const totalPanier = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Menu navigate={navigate} panierCount={totalPanier} />
        <h1 style={styles.headerTitre}>Recherche</h1>
        <button style={styles.btnPanier} onClick={() => navigate('/panier')}>
          🛒
          {totalPanier > 0 && <span style={styles.badge}>{totalPanier}</span>}
        </button>
      </div>

      {/* Barre de recherche */}
      <div style={styles.searchWrap}>
        <form onSubmit={rechercher}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="Code EAN, référence ou coloris..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button type="button" style={styles.searchClear} onClick={() => { setQuery(''); setResultats([]); setRechercheFaite(false) }}>✕</button>
            )}
          </div>
        </form>
        {query.trim() && (
          <button style={styles.btnRecherche} onClick={rechercher} disabled={loading}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        )}
      </div>

      {/* Aide */}
      {!rechercheFaite && (
        <div style={styles.content}>
          <p style={styles.aidesTitre}>Vous pouvez rechercher par</p>
          <div style={styles.aides}>
            {[
              { icon: '📦', label: 'Code EAN', ex: 'ex: 3901101981007' },
              { icon: '🏷️', label: 'Référence', ex: 'ex: 3000-0' },
              { icon: '🎨', label: 'Coloris', ex: 'ex: BEIGE' },
            ].map(a => (
              <div key={a.label} style={styles.aideCard}>
                <span style={styles.aideIcon}>{a.icon}</span>
                <div>
                  <div style={styles.aideLabel}>{a.label}</div>
                  <div style={styles.aideEx}>{a.ex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résultats vides */}
      {rechercheFaite && resultats.length === 0 && !loading && (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>🔍</div>
          <p style={styles.videMsg}>Aucun produit trouvé</p>
          <p style={styles.videHint}>Vérifiez le code ou le nom saisi</p>
        </div>
      )}

      {/* Résultats */}
      {resultats.length > 0 && (
        <div style={styles.content}>
          <p style={styles.nbResultats}>{resultats.length} modèle{resultats.length > 1 ? 's' : ''} trouvé{resultats.length > 1 ? 's' : ''}</p>
          {resultats.map(m => {
            const qty = getPanierQtyForModele(m)
            const prixMin = m.variantes?.length > 0 ? Math.min(...m.variantes.map(v => v.prix)) : 0
            return (
              <div key={m.id} style={{ ...styles.resultCard, ...(qty > 0 ? styles.resultCardActive : {}) }} onClick={() => ouvrirModele(m)}>
                {m.variantes?.[0]?.photo_url
                  ? <img src={m.variantes[0].photo_url} alt={m.reference} style={styles.resultImg} />
                  : <div style={styles.resultImgPlaceholder}>👟</div>
                }
                <div style={styles.resultInfo}>
                  <div style={styles.resultRef}>{m.reference}</div>
                  <div style={styles.resultSaison}>{m.saison}</div>
                  <div style={styles.resultColoris}>{m.variantes?.length} coloris disponibles</div>
                  <div style={styles.resultPrix}>à partir de {prixMin.toFixed(2)} € / paire</div>
                </div>
                {qty > 0 && <div style={styles.resultBadge}>{qty}</div>}
                <span style={styles.resultArrow}>›</span>
              </div>
            )
          })}
        </div>
      )}

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
            <div style={styles.sizesLabel}>Quantités par taille</div>
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
              <button style={styles.btnAjouter} onClick={validerVariante}>Ajouter au panier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', paddingBottom: '2rem' },
  header: { background: 'var(--beige-card)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 },
  headerTitre: { fontSize: '1.1rem', fontFamily: 'Playfair Display, serif', color: 'var(--brown-dark)', fontWeight: '600' },
  btnPanier: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', position: 'relative', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: '-2px', right: '-2px', background: 'var(--red)', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' },
  searchWrap: { padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  searchBox: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: '0.5rem' },
  searchIcon: { fontSize: '0.9rem', color: 'var(--text-muted)' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', padding: '0.75rem 0', fontSize: '0.9rem', outline: 'none', color: 'var(--brown-dark)' },
  searchClear: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' },
  btnRecherche: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.75rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  content: { padding: '0 1.25rem' },
  aidesTitre: { fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' },
  aides: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  aideCard: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' },
  aideIcon: { fontSize: '1.2rem' },
  aideLabel: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--brown-dark)' },
  aideEx: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', gap: '0.5rem' },
  videEmoji: { fontSize: '2.5rem' },
  videMsg: { fontSize: '1rem', fontWeight: '600', color: 'var(--brown-dark)' },
  videHint: { fontSize: '0.85rem', color: 'var(--text-muted)' },
  nbResultats: { fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' },
  resultCard: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '0.85rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer', position: 'relative' },
  resultCardActive: { border: '1px solid var(--brown-mid)' },
  resultImg: { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 },
  resultImgPlaceholder: { width: '64px', height: '64px', background: 'var(--beige-dark)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 },
  resultInfo: { flex: 1 },
  resultRef: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--brown-dark)' },
  resultSaison: { fontSize: '0.7rem', color: 'var(--brown-mid)', fontWeight: '600', marginTop: '0.1rem' },
  resultColoris: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' },
  resultPrix: { fontSize: '0.85rem', fontWeight: '700', color: 'var(--brown-mid)', marginTop: '0.2rem' },
  resultBadge: { background: 'var(--brown-mid)', color: 'white', borderRadius: '20px', padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: '700' },
  resultArrow: { color: 'var(--text-muted)', fontSize: '1.2rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(2px)' },
  modal: { background: 'var(--beige-card)', borderRadius: '24px 24px 0 0', padding: '0 1.5rem 2rem', width: '100%', maxHeight: '88vh', overflowY: 'auto' },
  modalHandle: { width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0.75rem auto 0' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 0' },
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