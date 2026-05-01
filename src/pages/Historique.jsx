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

  useEffect(() => {
    chargerCommandes()
  }, [])

  const chargerCommandes = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('commandes')
      .select('*')
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

  const handleTouchStart = (e, id) => {
    touchStartX.current = e.touches[0].clientX
  }

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
        <h1 style={styles.titre}>Historique</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.onglets}>
        {[
          { key: 'commandes', label: `Commandes (${commandes.length})` },
          { key: 'archives', label: `Archives (${archives.length})` },
          { key: 'brouillons', label: `Brouillons (${brouillons.length})` },
        ].map(o => (
          <button
            key={o.key}
            style={{ ...styles.ongletBtn, ...(onglet === o.key ? styles.ongletActif : {}) }}
            onClick={() => { setOnglet(o.key); setSwipeId(null); setCommandeOuverte(null) }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {listeActive.length === 0 ? (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>
            {onglet === 'brouillons' ? '💾' : onglet === 'archives' ? '📁' : '📋'}
          </div>
          <p style={styles.videMsg}>
            {onglet === 'brouillons' ? 'Aucun brouillon sauvegardé' : onglet === 'archives' ? 'Aucune commande archivée' : 'Aucune commande passée'}
          </p>
          {onglet === 'commandes' && (
            <button style={styles.btn} onClick={() => navigate('/catalogue')}>Parcourir le catalogue</button>
          )}
        </div>
      ) : (
        <div style={styles.liste}>
          {listeActive.map(c => (
            <div key={c.id} style={styles.swipeWrapper}>
              <div style={styles.swipeActions}>
                {onglet === 'commandes' && (
                  <button style={styles.btnArchiver} onClick={() => archiver(c.id)}>
                    <span style={{ fontSize: '1.3rem' }}>📁</span>
                    <span>Archiver</span>
                  </button>
                )}
                <button style={styles.btnSupprimerSwipe} onClick={() => supprimer(c.id)}>
                  <span style={{ fontSize: '1.3rem' }}>🗑️</span>
                  <span>Supprimer</span>
                </button>
              </div>

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
                <div style={styles.cardHeader}>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardDate}>
                      {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {onglet === 'brouillons' ? (
                      <div style={styles.cardDetail}>{(c.lignes || []).length} article(s) — brouillon</div>
                    ) : (
                      <>
                        {c.saison && (
                          <div style={styles.cardSaison}>
                            Saison : <strong>{c.saison}</strong>
                          </div>
                        )}
                        <div style={styles.cardDetail}>
                          {c.total_paires} paires · {Number(c.total_ht).toFixed(2)} € HT
                        </div>
                      </>
                    )}
                  </div>
                  {onglet === 'brouillons' ? (
                    <button style={styles.btnReprendre} onClick={e => { e.stopPropagation(); reprendreBrouillon(c) }}>
                      Reprendre →
                    </button>
                  ) : (
                    <div style={styles.cardStatut}>{onglet === 'archives' ? 'Archivée' : 'Validée ✓'}</div>
                  )}
                </div>

                {commandeOuverte?.id === c.id && onglet !== 'brouillons' && (
                  <div style={styles.detail}>
                    <div style={styles.detailTitre}>Détail de la commande</div>
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
                      <div style={styles.detailTotal}><span>Total HT</span><span>{Number(c.total_ht).toFixed(2)} €</span></div>
                      <div style={styles.detailTotal}><span>TVA 20%</span><span>{(Number(c.total_ht) * 0.2).toFixed(2)} €</span></div>
                      <div style={{ ...styles.detailTotal, ...styles.detailTotalTTC }}>
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

      {alerteBrouillon && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setAlerteBrouillon(null)}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitre}>⚠️ Produits indisponibles</h2>
            <p style={styles.modalMsg}>Certains produits de ce brouillon ne sont plus disponibles :</p>
            {alerteBrouillon.lignesManquantes.map((l, i) => (
              <div key={i} style={styles.ligneManquante}>{l.reference} — {l.coloris}</div>
            ))}
            <p style={styles.modalMsg}>
              Les {alerteBrouillon.lignesValides.length} autre(s) article(s) seront chargés dans votre panier.
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.btnAnnuler} onClick={() => setAlerteBrouillon(null)}>Annuler</button>
              <button style={styles.btn} onClick={confirmerBrouillon}>Continuer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#F5EFE6' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9B8B7A' },
  header: { background: 'white', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' },
  onglets: { display: 'flex', background: 'white', borderBottom: '1px solid #E8DDD0' },
  ongletBtn: { flex: 1, padding: '0.75rem 0.25rem', border: 'none', background: 'none', fontSize: '0.75rem', cursor: 'pointer', color: '#9B8B7A', whiteSpace: 'nowrap' },
  ongletActif: { color: '#1A1209', fontWeight: '700', borderBottom: '2px solid #1A1209' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '1rem' },
  videEmoji: { fontSize: '3rem' },
  videMsg: { fontSize: '1.1rem', color: '#9B8B7A' },
  liste: { padding: '1rem', overflow: 'hidden' },
  swipeWrapper: { position: 'relative', marginBottom: '0.75rem', borderRadius: '12px', overflow: 'hidden' },
  swipeActions: { position: 'absolute', right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', paddingRight: '0.75rem', background: '#F5EFE6' },
  btnArchiver: { background: '#8B6F47', color: 'white', border: 'none', width: '68px', height: '68px', borderRadius: '50%', fontSize: '0.6rem', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' },
  btnSupprimerSwipe: { background: '#C0392B', color: 'white', border: 'none', width: '68px', height: '68px', borderRadius: '50%', fontSize: '0.6rem', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' },
  card: { background: 'white', borderRadius: '12px', padding: '1rem', cursor: 'pointer', position: 'relative', zIndex: 1 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardDate: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209', marginBottom: '0.2rem' },
  cardSaison: { fontSize: '0.8rem', color: '#8B6F47', marginBottom: '0.15rem' },
  cardDetail: { fontSize: '0.8rem', color: '#9B8B7A' },
  cardStatut: { fontSize: '0.8rem', color: '#27AE60', fontWeight: '600' },
  btnReprendre: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  detail: { marginTop: '1rem', borderTop: '1px solid #F5EFE6', paddingTop: '1rem' },
  detailTitre: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9B8B7A', marginBottom: '0.75rem' },
  detailLigne: { background: '#F5EFE6', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' },
  detailNom: { fontSize: '0.85rem', fontWeight: '600', color: '#1A1209' },
  detailTailles: { fontSize: '0.75rem', color: '#8B6F47', marginTop: '0.25rem' },
  detailPrix: { fontSize: '0.8rem', color: '#1A1209', fontWeight: '600', marginTop: '0.25rem' },
  detailTotaux: { background: '#F5EFE6', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' },
  detailTotal: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#1A1209', padding: '0.2rem 0' },
  detailTotalTTC: { fontWeight: '700', borderTop: '1px solid #E8DDD0', marginTop: '0.3rem', paddingTop: '0.5rem' },
  btn: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem 1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%' },
  modalTitre: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#1A1209', marginBottom: '1rem' },
  modalMsg: { fontSize: '0.9rem', color: '#1A1209', lineHeight: 1.6, marginBottom: '0.75rem' },
  ligneManquante: { background: '#FEE2E2', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#C0392B', marginBottom: '0.4rem' },
  modalBtns: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnAnnuler: { flex: 1, background: '#F5EFE6', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer' },
}