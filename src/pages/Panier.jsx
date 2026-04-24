import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import NavbarUI from '../components/NavbarUI'

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

  const validerCommande = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const lignes = panier.map(l => {
      const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
      return { reference: l.reference, nom: l.nom, coloris: l.coloris, prix: l.prix, qtys: l.qtys, total_paires: qty, total_ht: qty * l.prix }
    })
    await supabase.from('commandes').insert({ client_id: user.id, lignes, total_ht: totalHT, total_paires: totalPaires })
    setDernierTotal({ paires: totalPaires, ht: totalHT })
    localStorage.removeItem('panier')
    setPanier([])
    setConfirmation(false)
    setCommande(true)
    setLoading(false)
  }

  if (commande) return (
    <div style={styles.succesContainer}>
      <div style={styles.succes}>
        <div style={styles.succesCircle}>✓</div>
        <h2 style={styles.succesTitre}>Commande envoyée</h2>
        <p style={styles.succesMsg}>Votre commande a bien été transmise à votre représentant. Elle sera traitée dans les plus brefs délais.</p>
        <div style={styles.succesInfo}>
          <div style={styles.succesInfoLigne}><span>Total paires</span><span>{dernierTotal.paires}</span></div>
          <div style={styles.succesInfoLigne}><span>Total HT</span><span>{dernierTotal.ht.toFixed(2)} €</span></div>
          <div style={styles.succesInfoLigne}><span>TVA 20%</span><span>{(dernierTotal.ht * 0.2).toFixed(2)} €</span></div>
          <div style={{ ...styles.succesInfoLigne, ...styles.succesInfoTotal }}><span>Total TTC</span><span>{(dernierTotal.ht * 1.2).toFixed(2)} €</span></div>
        </div>
        <button style={styles.btnBlanc} onClick={() => navigate('/accueil')}>Retour à l'accueil</button>
        <button style={styles.btnTransparent} onClick={() => navigate('/historique')}>Voir mes commandes</button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnRetour} onClick={() => navigate('/accueil')}>← Retour</button>
        <h1 style={styles.titre}>Mon panier</h1>
      </div>

      {panier.length === 0 ? (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>🛒</div>
          <p style={styles.videMsg}>Votre panier est vide</p>
          <button style={styles.btn} onClick={() => navigate('/catalogue')}>Parcourir le catalogue</button>
        </div>
      ) : (
        <>
          <div style={styles.lignes}>
            {panier.map(l => {
              const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
              return (
                <div key={l.id} style={styles.ligne}>
                  <div style={styles.ligneHeader}>
                    <div style={styles.ligneInfo}>
                      <div style={styles.ligneNom}>{l.nom} — {l.coloris}</div>
                      <div style={styles.ligneRef}>{l.reference}</div>
                    </div>
                    <button style={styles.btnSupprimer} onClick={() => supprimerLigne(l.id)}>✕</button>
                  </div>
                  <div style={styles.tailles}>
                    {(l.tailles || []).map(t => {
                      const q = parseInt(l.qtys?.[t]) || 0
                      return (
                        <div key={t} style={styles.tailleItem}>
                          <div style={styles.tailleLabel}>T.{t}</div>
                          <div style={styles.tailleControls}>
                            <button style={styles.btnQty} onClick={() => updateQty(l.id, t, -1)}>−</button>
                            <span style={styles.tailleQty}>{q}</span>
                            <button style={styles.btnQty} onClick={() => updateQty(l.id, t, 1)}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={styles.lignePrixRow}>
                    <span style={styles.ligneQtyTotal}>{qty} paires</span>
                    <span style={styles.lignePrix}>{(qty * (l.prix || 0)).toFixed(2)} €</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={styles.recap}>
            <div style={styles.contraintes}>
              <div style={styles.contrainte}>
                <div style={{ ...styles.dot, background: minPairesOk ? '#27AE60' : '#C0392B' }} />
                <span>{totalPaires} / {MIN_PAIRES} paires minimum {minPairesOk ? '✓' : ''}</span>
              </div>
              <div style={styles.contrainte}>
                <div style={{ ...styles.dot, background: francoOk ? '#27AE60' : '#C0392B' }} />
                <span>Franco à {FRANCO} € HT — {totalHT.toFixed(2)} € {francoOk ? '✓ Port offert' : `(manque ${(FRANCO - totalHT).toFixed(2)} €)`}</span>
              </div>
            </div>
            <div style={styles.totaux}>
              <div style={styles.totalLigne}><span>Total paires</span><span>{totalPaires}</span></div>
              <div style={styles.totalLigne}><span>Total HT</span><span>{totalHT.toFixed(2)} €</span></div>
              <div style={styles.totalLigne}><span>TVA 20%</span><span>{(totalHT * 0.2).toFixed(2)} €</span></div>
              <div style={{ ...styles.totalLigne, ...styles.totalTTC }}><span>Total TTC</span><span>{(totalHT * 1.2).toFixed(2)} €</span></div>
            </div>
            <button style={{ ...styles.btn, opacity: !minPairesOk ? 0.4 : 1 }} disabled={!minPairesOk} onClick={() => setConfirmation(true)}>
              Valider la commande
            </button>
          </div>
        </>
      )}

      <NavbarUI navigate={navigate} active="/panier" panierCount={totalPanier} />

      {confirmation && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setConfirmation(false)}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitre}>Bon pour accord</h2>
            <p style={styles.modalMsg}>En confirmant, vous validez votre commande de <strong>{totalPaires} paires</strong> pour un montant de <strong>{totalHT.toFixed(2)} € HT</strong>.</p>
            <p style={styles.modalMsg}>Elle sera transmise immédiatement à votre représentant qui la saisira dans les plus brefs délais.</p>
            <div style={styles.modalBtns}>
              <button style={styles.btnAnnuler} onClick={() => setConfirmation(false)}>Annuler</button>
              <button style={styles.btn} onClick={validerCommande} disabled={loading}>{loading ? 'Envoi...' : 'Je confirme'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#F5EFE6', paddingBottom: '80px' },
  succesContainer: { minHeight: '100vh', background: '#2C1A0E' },
  header: { background: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  btnRetour: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#8B6F47' },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '1rem' },
  videEmoji: { fontSize: '3rem' },
  videMsg: { fontSize: '1.1rem', color: '#9B8B7A' },
  lignes: { padding: '1rem' },
  ligne: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' },
  ligneHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  ligneInfo: { flex: 1 },
  ligneNom: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209' },
  ligneRef: { fontSize: '0.75rem', color: '#9B8B7A', marginTop: '0.1rem' },
  btnSupprimer: { background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: '1rem', padding: '0 0 0 0.5rem' },
  tailles: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' },
  tailleItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  tailleLabel: { fontSize: '0.7rem', fontWeight: '700', color: '#9B8B7A' },
  tailleControls: { display: 'flex', alignItems: 'center', gap: '0.25rem' },
  btnQty: { background: '#F5EFE6', border: 'none', borderRadius: '4px', width: '26px', height: '26px', fontSize: '1rem', cursor: 'pointer', color: '#1A1209', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' },
  tailleQty: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209', minWidth: '20px', textAlign: 'center' },
  lignePrixRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F5EFE6', paddingTop: '0.5rem' },
  ligneQtyTotal: { fontSize: '0.8rem', color: '#9B8B7A' },
  lignePrix: { fontSize: '0.95rem', fontWeight: '700', color: '#1A1209' },
  recap: { padding: '0 1rem 2rem' },
  contraintes: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  contrainte: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1A1209' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  totaux: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  totalLigne: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', color: '#1A1209' },
  totalTTC: { fontWeight: '700', fontSize: '1rem', borderTop: '1px solid #E8DDD0', marginTop: '0.5rem', paddingTop: '0.75rem' },
  btn: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%', marginBottom: '0.5rem' },
  succes: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', gap: '1rem' },
  succesCircle: { width: '80px', height: '80px', borderRadius: '50%', background: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', marginBottom: '0.5rem' },
  succesTitre: { fontFamily: 'Georgia, serif', fontSize: '1.8rem', color: 'white', textAlign: 'center' },
  succesMsg: { fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.7, maxWidth: '320px' },
  succesInfo: { background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', width: '100%', maxWidth: '320px', marginBottom: '0.5rem' },
  succesInfoLigne: { display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', padding: '0.3rem 0' },
  succesInfoTotal: { color: 'white', fontWeight: '700', fontSize: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: '0.3rem', paddingTop: '0.5rem' },
  btnBlanc: { background: 'white', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '320px' },
  btnTransparent: { background: 'none', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer', width: '100%', maxWidth: '320px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%' },
  modalTitre: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#1A1209', marginBottom: '1rem' },
  modalMsg: { fontSize: '0.9rem', color: '#1A1209', lineHeight: 1.6, marginBottom: '0.75rem' },
  modalBtns: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnAnnuler: { flex: 1, background: '#F5EFE6', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer' },
}