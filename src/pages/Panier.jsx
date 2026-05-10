import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const FRANCO = 1500
const MIN_PAIRES = 10

export default function Panier() {
  const [panier, setPanier] = useState(() => {
    try {
      const s = localStorage.getItem('panier')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const [confirmation, setConfirmation] = useState(false)
  const [commande, setCommande] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dernierTotal, setDernierTotal] = useState({ paires: 0, ht: 0 })
  const navigate = useNavigate()

  const totalPaires = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const totalHT = panier.reduce((sum, l) => {
    const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
    return sum + qty * (l.prix || 0)
  }, 0)

  const francoOk = totalHT >= FRANCO
  const minPairesOk = totalPaires >= MIN_PAIRES

  const supprimerLigne = (id) => {
    const nouveau = panier.filter(l => l.id !== id)
    setPanier(nouveau)
    localStorage.setItem('panier', JSON.stringify(nouveau))
  }

  const updateQty = (id, taille, delta) => {
    const nouveau = panier.map(l => {
      if (l.id !== id) return l
      const current = parseInt(l.qtys[taille]) || 0
      const next = Math.max(0, current + delta)
      return { ...l, qtys: { ...l.qtys, [taille]: next } }
    }).filter(l => Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0) > 0)
    setPanier(nouveau)
    localStorage.setItem('panier', JSON.stringify(nouveau))
  }

  const sauvegarderBrouillon = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('commandes').insert({
      client_id: user.id, lignes: panier,
      total_ht: totalHT, total_paires: totalPaires, statut: 'brouillon',
    })
    localStorage.removeItem('panier')
    setPanier([])
    navigate('/historique')
  }

  const validerCommande = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    const lignes = panier.map(l => {
      const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
      return { reference: l.reference, nom: l.nom, coloris: l.coloris, prix: l.prix, qtys: l.qtys, total_paires: qty, total_ht: qty * l.prix }
    })

    const saisons = [...new Set(panier.map(l => l.saison).filter(Boolean))]
    const saisonLabel = saisons.length === 1 ? saisons[0] : saisons.join(', ')

    await supabase.from('commandes').insert({
      client_id: user.id, lignes, total_ht: totalHT, total_paires: totalPaires, statut: 'validée', saison: saisonLabel
    })

    try {
      await supabase.functions.invoke('send-order-email', {
        body: {
          client: { nom: profile.nom, email: profile.email, magasin: profile.magasin, adresse_livraison: profile.adresse_livraison, adresse_facturation: profile.adresse_facturation },
          lignes, totalHT, totalPaires,
        }
      })
    } catch (err) { console.error('Erreur email:', err) }

    setDernierTotal({ paires: totalPaires, ht: totalHT })
    localStorage.removeItem('panier')
    setPanier([])
    setConfirmation(false)
    setCommande(true)
    setLoading(false)
  }

  // Page confirmation
  if (commande) return (
    <div style={styles.confirmContainer}>
      <div style={styles.confirmContent}>
        <div style={styles.confirmCircle}>✓</div>
        <h2 style={styles.confirmTitre}>Merci pour votre commande</h2>
        <p style={styles.confirmSub}>Votre commande a bien été enregistrée. Un email de confirmation vous a été envoyé.</p>

        <div style={styles.confirmCard}>
          <div style={styles.confirmRow}>
            <span style={styles.confirmLabel}>Date</span>
            <span style={styles.confirmVal}>{new Date().toLocaleDateString('fr-FR')}</span>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmLabel}>Total HT</span>
            <span style={styles.confirmVal}>{dernierTotal.ht.toFixed(2)} €</span>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmLabel}>TVA 20%</span>
            <span style={styles.confirmVal}>{(dernierTotal.ht * 0.2).toFixed(2)} €</span>
          </div>
          <div style={styles.confirmRow}>
            <span style={styles.confirmLabel}>Total TTC</span>
            <span style={styles.confirmVal}>{(dernierTotal.ht * 1.2).toFixed(2)} €</span>
          </div>
          <div style={{ ...styles.confirmRow, borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <span style={styles.confirmLabel}>Nombre de paires</span>
            <span style={{ ...styles.confirmVal, fontWeight: '700', fontSize: '1.1rem' }}>{dernierTotal.paires}</span>
          </div>
        </div>

        <button style={styles.btnPrimary} onClick={() => navigate('/accueil')}>
          Retour à l'accueil
        </button>
        <button style={styles.btnSecondary} onClick={() => navigate('/historique')}>
          Voir mes commandes
        </button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.btnBack}>‹</button>
        <h1 style={styles.headerTitre}>Mon panier ({totalPaires})</h1>
        <div style={{ width: 32 }} />
      </div>

      {panier.length === 0 ? (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>🛒</div>
          <p style={styles.videMsg}>Votre panier est vide</p>
          <p style={styles.videHint}>Parcourez le catalogue pour ajouter des produits</p>
          <button style={styles.btnPrimary} onClick={() => navigate('/catalogue')}>
            Voir le catalogue
          </button>
        </div>
      ) : (
        <>
          {/* Lignes */}
          <div style={styles.lignes}>
            <div style={styles.lignesLabel}>{panier.length} article{panier.length > 1 ? 's' : ''}</div>
            {panier.map(l => {
              const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
              return (
                <div key={l.id} style={styles.ligne}>
                  <div style={styles.ligneTop}>
                    {l.photo_url
                      ? <img src={l.photo_url} alt={l.reference} style={styles.ligneImg} />
                      : <div style={styles.ligneImgPlaceholder}>👟</div>
                    }
                    <div style={styles.ligneInfo}>
                      <div style={styles.ligneRef}>{l.reference}</div>
                      <div style={styles.ligneColoris}>{l.coloris}</div>
                      <div style={styles.ligneSaison}>{l.saison}</div>
                    </div>
                    <div style={styles.ligneDroite}>
                      <div style={styles.lignePrix}>{(qty * (l.prix || 0)).toFixed(2)} €</div>
                      <button style={styles.btnSupprimer} onClick={() => supprimerLigne(l.id)}>✕</button>
                    </div>
                  </div>

                  {/* Tailles */}
                  <div style={styles.tailles}>
                    {(l.tailles || []).map(t => {
                      const q = parseInt(l.qtys?.[t]) || 0
                      return (
                        <div key={t} style={styles.tailleItem}>
                          <div style={styles.tailleLabel}>T.{t}</div>
                          <div style={styles.tailleControls}>
                            <button style={styles.btnQty} onClick={() => updateQty(l.id, t, -1)}>−</button>
                            <span style={{ ...styles.tailleQty, ...(q > 0 ? styles.tailleQtyActive : {}) }}>{q}</span>
                            <button style={styles.btnQty} onClick={() => updateQty(l.id, t, 1)}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={styles.ligneFooter}>
                    <span style={styles.ligneQtyTotal}>{qty} paire{qty > 1 ? 's' : ''}</span>
                    <span style={styles.lignePrixUnit}>{l.prix} € / paire</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Récap */}
          <div style={styles.recap}>
            {/* Contraintes */}
            <div style={styles.contraintes}>
              <div style={styles.contrainte}>
                <div style={{ ...styles.dot, background: minPairesOk ? 'var(--green)' : 'var(--red)' }} />
                <span style={styles.contrainteText}>
                  {totalPaires} / {MIN_PAIRES} paires minimum {minPairesOk ? '✓' : ''}
                </span>
              </div>
              <div style={styles.contrainte}>
                <div style={{ ...styles.dot, background: francoOk ? 'var(--green)' : 'var(--red)' }} />
                <span style={styles.contrainteText}>
                  Franco à {FRANCO} € HT — {totalHT.toFixed(2)} €
                  {francoOk ? ' ✓ Port offert' : ` (manque ${(FRANCO - totalHT).toFixed(2)} €)`}
                </span>
              </div>
            </div>

            {/* Totaux */}
            <div style={styles.totaux}>
              <div style={styles.totalRow}><span>Sous-total HT</span><span>{totalHT.toFixed(2)} €</span></div>
              <div style={styles.totalRow}><span>TVA 20%</span><span>{(totalHT * 0.2).toFixed(2)} €</span></div>
              <div style={{ ...styles.totalRow, ...styles.totalRowBig }}>
                <span>Total TTC</span><span>{(totalHT * 1.2).toFixed(2)} €</span>
              </div>
            </div>

            {/* Boutons */}
            <button style={styles.btnBrouillon} onClick={sauvegarderBrouillon}>
              💾 Sauvegarder en brouillon
            </button>
            <button
              style={{ ...styles.btnCommande, opacity: !minPairesOk ? 0.4 : 1 }}
              disabled={!minPairesOk}
              onClick={() => setConfirmation(true)}
            >
              Passer la commande
            </button>
          </div>
        </>
      )}

      {/* Modal confirmation */}
      {confirmation && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setConfirmation(false)}>
          <div style={styles.modal}>
            <div style={styles.modalHandle} />
            <h2 style={styles.modalTitre}>Confirmer la commande</h2>
            <p style={styles.modalMsg}>
              En confirmant, vous donnez votre <strong>bon pour accord</strong> pour cette commande de{' '}
              <strong>{totalPaires} paires</strong> d'un montant de <strong>{totalHT.toFixed(2)} € HT</strong>.
            </p>
            <p style={styles.modalMsg}>
              Elle sera transmise immédiatement à votre représentant qui la saisira dans les plus brefs délais.
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.btnAnnuler} onClick={() => setConfirmation(false)}>Annuler</button>
              <button style={styles.btnConfirmer} onClick={validerCommande} disabled={loading}>
                {loading ? 'Envoi...' : 'Je confirme'}
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
  confirmContainer: { minHeight: '100vh', background: 'var(--beige)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' },
  confirmContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '380px' },
  confirmCircle: { width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--brown-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: 'var(--brown-dark)' },
  confirmTitre: { fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: 'var(--brown-dark)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' },
  confirmSub: { fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 },
  confirmCard: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem', width: '100%' },
  confirmRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.9rem' },
  confirmLabel: { color: 'var(--text-muted)' },
  confirmVal: { color: 'var(--brown-dark)', fontWeight: '500' },

  header: { background: 'var(--beige-card)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 },
  btnBack: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--brown-dark)', lineHeight: 1, width: '32px' },
  headerTitre: { fontSize: '1rem', fontFamily: 'Playfair Display, serif', color: 'var(--brown-dark)', fontWeight: '600' },

  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '0.75rem' },
  videEmoji: { fontSize: '3rem' },
  videMsg: { fontSize: '1.1rem', fontWeight: '600', color: 'var(--brown-dark)', fontFamily: 'Playfair Display, serif' },
  videHint: { fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' },

  lignes: { padding: '1.25rem' },
  lignesLabel: { fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem' },
  ligne: { background: 'var(--beige-card)', borderRadius: '16px', padding: '1rem', marginBottom: '0.85rem', border: '1px solid var(--border)' },
  ligneTop: { display: 'flex', gap: '0.85rem', marginBottom: '0.75rem' },
  ligneImg: { width: '56px', height: '56px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 },
  ligneImgPlaceholder: { width: '56px', height: '56px', background: 'var(--beige)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 },
  ligneInfo: { flex: 1 },
  ligneRef: { fontSize: '0.9rem', fontWeight: '600', color: 'var(--brown-dark)' },
  ligneColoris: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' },
  ligneSaison: { fontSize: '0.72rem', color: 'var(--brown-mid)', fontWeight: '600', marginTop: '0.15rem' },
  ligneDroite: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' },
  lignePrix: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--brown-dark)' },
  btnSupprimer: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: '0' },

  tailles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' },
  tailleItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
  tailleLabel: { fontSize: '0.68rem', fontWeight: '600', color: 'var(--text-muted)' },
  tailleControls: { display: 'flex', alignItems: 'center', gap: '0.2rem' },
  btnQty: { background: 'var(--beige)', border: '1px solid var(--border)', borderRadius: '6px', width: '24px', height: '24px', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--brown-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' },
  tailleQty: { fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', minWidth: '18px', textAlign: 'center' },
  tailleQtyActive: { color: 'var(--brown-dark)' },

  ligneFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' },
  ligneQtyTotal: { fontSize: '0.8rem', fontWeight: '600', color: 'var(--brown-dark)' },
  lignePrixUnit: { fontSize: '0.75rem', color: 'var(--text-muted)' },

  recap: { padding: '0 1.25rem 2rem' },
  contraintes: { background: 'var(--beige-card)', borderRadius: '14px', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  contrainte: { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  contrainteText: { fontSize: '0.82rem', color: 'var(--brown-dark)' },

  totaux: { background: 'var(--beige-card)', borderRadius: '14px', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--border)' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--brown-dark)', padding: '0.35rem 0' },
  totalRowBig: { fontWeight: '700', fontSize: '1rem', borderTop: '1px solid var(--border)', marginTop: '0.4rem', paddingTop: '0.75rem' },

  btnBrouillon: { background: 'var(--beige-card)', color: 'var(--brown-dark)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', width: '100%', marginBottom: '0.6rem' },
  btnCommande: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.9rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', width: '100%' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(2px)' },
  modal: { background: 'var(--beige-card)', borderRadius: '24px 24px 0 0', padding: '0 1.5rem 2rem', width: '100%' },
  modalHandle: { width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', margin: '0.75rem auto 1rem' },
  modalTitre: { fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', color: 'var(--brown-dark)', marginBottom: '0.85rem' },
  modalMsg: { fontSize: '0.88rem', color: 'var(--brown-dark)', lineHeight: 1.6, marginBottom: '0.75rem' },
  modalBtns: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnAnnuler: { flex: 1, background: 'var(--beige)', color: 'var(--brown-dark)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.9rem', fontSize: '0.9rem', cursor: 'pointer' },
  btnConfirmer: { flex: 1, background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },

  btnPrimary: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.9rem 1.5rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '320px' },
  btnSecondary: { background: 'none', color: 'var(--brown-mid)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.9rem 1.5rem', fontSize: '0.9rem', cursor: 'pointer', width: '100%', maxWidth: '320px' },
}