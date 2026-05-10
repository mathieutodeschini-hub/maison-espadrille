import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Menu from '../components/Menu'

export default function Historique() {
  const [commandes, setCommandes] = useState([])
  const [archives, setArchives] = useState([])
  const [brouillons, setBrouillons] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('commandes')
  const [commandeOuverte, setCommandeOuverte] = useState(null)
  const [swipeId, setSwipeId] = useState(null)
  const [alerteBrouillon, setAlerteBrouillon] = useState(null)
  const touchStartX = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { chargerCommandes() }, [])

  const chargerCommandes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('commandes').select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
    if (data) {
      setCommandes(data.filter(c => c.statut === 'validée'))
      setArchives(data.filter(c => c.statut === 'archivée'))
      setBrouillons(data.filter(c => c.statut === 'brouillon'))
    }
    setLoading(false)
  }

  const archiver = async (id) => {
    await supabase.from('commandes').update({ statut: 'archivée' }).eq('id', id)
    setSwipeId(null)
    chargerCommandes()
  }

  const supprimer = async (id) => {
    await supabase.from('commandes').delete().eq('id', id)
    setSwipeId(null)
    chargerCommandes()
  }

  const reprendreBrouillon = async (brouillon) => {
    const ids = (brouillon.lignes || []).map(l => l.id).filter(Boolean)
    if (ids.length === 0) {
      localStorage.setItem('panier', JSON.stringify(brouillon.lignes || []))
      await supabase.from('commandes').delete().eq('id', brouillon.id)
      navigate('/panier')
      return
    }
    const { data: produits } = await supabase.from('variantes').select('id, actif').in('id', ids)
    const produitsActifs = new Set((produits || []).filter(p => p.actif).map(p => p.id))
    const lignesValides = (brouillon.lignes || []).filter(l => produitsActifs.has(l.id))
    const lignesManquantes = (brouillon.lignes || []).filter(l => !produitsActifs.has(l.id))
    if (lignesManquantes.length > 0) {
      setAlerteBrouillon({ brouillon, lignesValides, lignesManquantes })
    } else {
      localStorage.setItem('panier', JSON.stringify(lignesValides))
      await supabase.from('commandes').delete().eq('id', brouillon.id)
      navigate('/panier')
    }
  }

  const confirmerBrouillon = async () => {
    const { brouillon, lignesValides } = alerteBrouillon
    localStorage.setItem('panier', JSON.stringify(lignesValides))
    await supabase.from('commandes').delete().eq('id', brouillon.id)
    setAlerteBrouillon(null)
    navigate('/panier')
  }

  const handleTouchStart = (e, id) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e, id) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 50) setSwipeId(id)
    else if (diff < -20) setSwipeId(null)
    touchStartX.current = null
  }

  const listeActive = onglet === 'commandes' ? commandes : onglet === 'archives' ? archives : brouillons

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Menu navigate={navigate} />
        <h1 style={styles.headerTitre}>Historique commandes</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Onglets */}
      <div style={styles.onglets}>
        {[
          { key: 'commandes', label: 'Toutes' },
          { key: 'archives', label: 'Archivées' },
          { key: 'brouillons', label: 'Brouillons' },
        ].map(o => (
          <button
            key={o.key}
            style={{ ...styles.ongletBtn, ...(onglet === o.key ? styles.ongletActif : {}) }}
            onClick={() => { setOnglet(o.key); setSwipeId(null); setCommandeOuverte(null) }}
          >
            {o.label}
            {o.key === 'commandes' && commandes.length > 0 && <span style={styles.ongletBadge}>{commandes.length}</span>}
            {o.key === 'brouillons' && brouillons.length > 0 && <span style={styles.ongletBadge}>{brouillons.length}</span>}
          </button>
        ))}
      </div>

      {listeActive.length === 0 ? (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>{onglet === 'brouillons' ? '💾' : onglet === 'archives' ? '📁' : '📋'}</div>
          <p style={styles.videMsg}>
            {onglet === 'brouillons' ? 'Aucun brouillon' : onglet === 'archives' ? 'Aucune commande archivée' : 'Aucune commande'}
          </p>
          {onglet === 'commandes' && (
            <button style={styles.btnPrimary} onClick={() => navigate('/catalogue')}>Parcourir le catalogue</button>
          )}
        </div>
      ) : (
        <div style={styles.liste}>
          {listeActive.map(c => (
            <div key={c.id} style={styles.swipeWrapper}>
              {/* Actions swipe */}
              <div style={styles.swipeActions}>
                {onglet === 'commandes' && (
                  <button style={styles.btnArchiver} onClick={() => archiver(c.id)}>
                    <span style={{ fontSize: '1.2rem' }}>📁</span>
                    <span>Archiver</span>
                  </button>
                )}
                <button style={styles.btnSupprimerSwipe} onClick={() => supprimer(c.id)}>
                  <span style={{ fontSize: '1.2rem' }}>🗑️</span>
                  <span>Suppr.</span>
                </button>
              </div>

              {/* Carte */}
              <div
                style={{
                  ...styles.card,
                  transform: swipeId === c.id ? 'translateX(-160px)' : 'translateX(0)',
                  transition: 'transform 0.25s ease',
                }}
                onTouchStart={e => handleTouchStart(e, c.id)}
                onTouchEnd={e => handleTouchEnd(e, c.id)}
                onClick={() => swipeId === c.id
                  ? setSwipeId(null)
                  : setCommandeOuverte(commandeOuverte?.id === c.id ? null : c)
                }
              >
                <div style={styles.cardTop}>
                  <div style={styles.cardLeft}>
                    <div style={styles.cardDate}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {onglet === 'brouillons' ? (
                      <div style={styles.cardDetail}>{(c.lignes || []).length} article(s) — brouillon</div>
                    ) : (
                      <>
                        {c.saison && <div style={styles.cardSaison}>Saison : <strong>{c.saison}</strong></div>}
                        <div style={styles.cardDetail}>{c.total_paires} paires · {Number(c.total_ht).toFixed(2)} € HT</div>
                      </>
                    )}
                  </div>
                  <div style={styles.cardRight}>
                    {onglet === 'brouillons' ? (
                      <button style={styles.btnReprendre} onClick={e => { e.stopPropagation(); reprendreBrouillon(c) }}>
                        Reprendre
                      </button>
                    ) : (
                      <>
                        <div style={styles.cardStatut}>Validée ✓</div>
                        <div style={styles.cardArrow}>›</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Détail déplié */}
                {commandeOuverte?.id === c.id && onglet !== 'brouillons' && (
                  <div style={styles.detail}>
                    <div style={styles.detailTitre}>Détail</div>
                    {(c.lignes || []).map((l, i) => {
                      const tailles = Object.entries(l.qtys || {}).filter(([, v]) => parseInt(v) > 0)
                      return (
                        <div key={i} style={styles.detailLigne}>
                          <div style={styles.detailNom}>{l.reference} — {l.coloris}</div>
                          <div style={styles.detailTailles}>{tailles.map(([t, v]) => `T${t}×${v}`).join('  ')}</div>
                          <div style={styles.detailPrix}>{l.total_paires} paires · {Number(l.total_ht).toFixed(2)} €</div>
                        </div>
                      )
                    })}
                    <div style={styles.detailTotaux}>
                      <div style={styles.detailTotalRow}><span>Total HT</span><span>{Number(c.total_ht).toFixed(2)} €</span></div>
                      <div style={styles.detailTotalRow}><span>TVA 20%</span><span>{(Number(c.total_ht) * 0.2).toFixed(2)} €</span></div>
                      <div style={{ ...styles.detailTotalRow, ...styles.detailTotalTTC }}>
                        <span>Total TTC</span><span>{(Number(c.total_ht) * 1.2).toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerte brouillon */}
      {alerteBrouillon && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setAlerteBrouillon(null)}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <h2 style={styles.modalTitre}>⚠️ Produits indisponibles</h2>
            <p style={styles.modalMsg}>Certains produits de ce brouillon ne sont plus disponibles :</p>
            {alerteBrouillon.lignesManquantes.map((l, i) => (
              <div key={i} style={styles.ligneManquante}>{l.reference} — {l.coloris}</div>
            ))}
            <p style={styles.modalMsg}>Les {alerteBrouillon.lignesValides.length} autre(s) article(s) seront chargés dans votre panier.</p>
            <div style={styles.modalBtns}>
              <button style={styles.btnAnnuler} onClick={() => setAlerteBrouillon(null)}>Annuler</button>
              <button style={styles.btnConfirmer} onClick={confirmerBrouillon}>Continuer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' },
  header: { background: 'var(--beige-card)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 },
  headerTitre: { fontSize: '1rem', fontFamily: 'Playfair Display, serif', color: 'var(--brown-dark)', fontWeight: '600' },
  onglets: { display: 'flex', background: 'var(--beige-card)', borderBottom: '1px solid var(--border)' },
  ongletBtn: { flex: 1, padding: '0.85rem 0.25rem', border: 'none', background: 'none', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontWeight: '500' },
  ongletActif: { color: 'var(--brown-dark)', fontWeight: '700', borderBottom: '2px solid var(--brown-dark)' },
  ongletBadge: { background: 'var(--brown-mid)', color: 'white', borderRadius: '10px', padding: '0.05rem 0.4rem', fontSize: '0.65rem', fontWeight: '700' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '0.75rem' },
  videEmoji: { fontSize: '2.5rem' },
  videMsg: { fontSize: '1rem', color: 'var(--text-muted)' },
  liste: { padding: '1rem 1.25rem', overflow: 'hidden' },
  swipeWrapper: { position: 'relative', marginBottom: '0.75rem', borderRadius: '16px', overflow: 'hidden' },
  swipeActions: { position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.75rem', background: 'var(--beige)' },
  btnArchiver: { background: 'var(--brown-mid)', color: 'white', border: 'none', width: '64px', height: '64px', borderRadius: '50%', fontSize: '0.58rem', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' },
  btnSupprimerSwipe: { background: 'var(--red)', color: 'white', border: 'none', width: '64px', height: '64px', borderRadius: '50%', fontSize: '0.58rem', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' },
  card: { background: 'var(--beige-card)', borderRadius: '16px', padding: '1rem 1.1rem', cursor: 'pointer', position: 'relative', zIndex: 1, border: '1px solid var(--border)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardDate: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--brown-dark)', marginBottom: '0.2rem' },
  cardSaison: { fontSize: '0.78rem', color: 'var(--brown-mid)', marginBottom: '0.15rem' },
  cardDetail: { fontSize: '0.78rem', color: 'var(--text-muted)' },
  cardRight: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  cardStatut: { fontSize: '0.75rem', color: 'var(--green)', fontWeight: '600' },
  cardArrow: { color: 'var(--text-muted)', fontSize: '1.2rem' },
  btnReprendre: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '20px', padding: '0.4rem 0.85rem', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },
  detail: { marginTop: '0.85rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' },
  detailTitre: { fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem' },
  detailLigne: { background: 'var(--beige)', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '0.4rem' },
  detailNom: { fontSize: '0.85rem', fontWeight: '600', color: 'var(--brown-dark)' },
  detailTailles: { fontSize: '0.75rem', color: 'var(--brown-mid)', marginTop: '0.2rem' },
  detailPrix: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' },
  detailTotaux: { background: 'var(--beige)', borderRadius: '10px', padding: '0.65rem 0.85rem', marginTop: '0.4rem' },
  detailTotalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--brown-dark)', padding: '0.2rem 0' },
  detailTotalTTC: { fontWeight: '700', borderTop: '1px solid var(--border)', marginTop: '0.25rem', paddingTop: '0.4rem' },
  btnPrimary: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.85rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(2px)' },
  modal: { background: 'var(--beige-card)', borderRadius: '24px 24px 0 0', padding: '0 1.5rem 2rem', width: '100%' },
  modalHandle: { width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0.75rem auto 1rem' },
  modalTitre: { fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--brown-dark)', marginBottom: '0.85rem' },
  modalMsg: { fontSize: '0.88rem', color: 'var(--brown-dark)', lineHeight: 1.6, marginBottom: '0.6rem' },
  ligneManquante: { background: '#FEE2E2', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.82rem', color: 'var(--red)', marginBottom: '0.35rem' },
  modalBtns: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnAnnuler: { flex: 1, background: 'var(--beige)', color: 'var(--brown-dark)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.85rem', fontSize: '0.9rem', cursor: 'pointer' },
  btnConfirmer: { flex: 1, background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.85rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
}