import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const FRANCO = 1500
const MIN_PAIRES = 10

export default function Panier() {
  const [panier, setPanier] = useState(() => {
    const s = localStorage.getItem('panier')
    return s ? JSON.parse(s) : []
  })
  const [confirmation, setConfirmation] = useState(false)
  const [commande, setCommande] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const totalPaires = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const totalHT = panier.reduce((sum, l) => {
    const qty = Object.values(l.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
    return sum + qty * l.prix
  }, 0)

  const francoOk = totalHT >= FRANCO
  const minPairesOk = totalPaires >= MIN_PAIRES

  const supprimerLigne = (id) => {
    const nouveau = panier.filter(l => l.id !== id)
    setPanier(nouveau)
    localStorage.setItem('panier', JSON.stringify(nouveau))
  }

  const validerCommande = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    const lignes = panier.map(l => {
      const qty = Object.values(l.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
      return {
        reference: l.reference,
        nom: l.nom,
        coloris: l.coloris,
        prix: l.prix,
        qtys: l.qtys,
        total_paires: qty,
        total_ht: qty * l.prix,
      }
    })

    await supabase.from('commandes').insert({
      client_id: user.id,
      lignes,
      total_ht: totalHT,
      total_paires: totalPaires,
    })

    localStorage.removeItem('panier')
    setPanier([])
    setConfirmation(false)
    setCommande(true)
    setLoading(false)
  }

  if (commande) return (
    <div style={styles.container}>
      <div style={styles.succes}>
        <div style={styles.succesEmoji}>✅</div>
        <h2 style={styles.succesTitre}>Commande envoyée !</h2>
        <p style={styles.succesMsg}>Votre commande a bien été transmise. Votre représentant la traitera dans les plus brefs délais.</p>
        <button style={styles.btn} onClick={() => navigate('/catalogue')}>Retour au catalogue</button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnRetour} onClick={() => navigate('/catalogue')}>← Retour</button>
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
              const qty = Object.values(l.qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
              return (
                <div key={l.id} style={styles.ligne}>
                  <div style={styles.ligneInfo}>
                    <div style={styles.ligneNom}>{l.nom} — {l.coloris}</div>
                    <div style={styles.ligneRef}>{l.reference}</div>
                    <div style={styles.ligneTailles}>
                      {Object.entries(l.qtys).filter(([, v]) => parseInt(v) > 0).map(([t, v]) => `T${t}×${v}`).join('  ')}
                    </div>
                  </div>
                  <div style={styles.ligneDroite}>
                    <div style={styles.ligneQty}>{qty} paires</div>
                    <div style={styles.lignePrix}>{(qty * l.prix).toFixed(2)} €</div>
                    <button style={styles.btnSupprimer} onClick={() => supprimerLigne(l.id)}>✕</button>
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
                <span>
                  Franco à {FRANCO} € HT — {totalHT.toFixed(2)} €
                  {francoOk ? ' ✓ Port offert' : ` (manque ${(FRANCO - totalHT).toFixed(2)} €)`}
                </span>
              </div>
            </div>

            <div style={styles.totaux}>
              <div style={styles.totalLigne}><span>Total paires</span><span>{totalPaires}</span></div>
              <div style={styles.totalLigne}><span>Total HT</span><span>{totalHT.toFixed(2)} €</span></div>
              <div style={styles.totalLigne}><span>TVA 20%</span><span>{(totalHT * 0.2).toFixed(2)} €</span></div>
              <div style={{ ...styles.totalLigne, ...styles.totalTTC }}><span>Total TTC</span><span>{(totalHT * 1.2).toFixed(2)} €</span></div>
            </div>

            <button
              style={{ ...styles.btn, opacity: (!minPairesOk) ? 0.4 : 1 }}
              disabled={!minPairesOk}
              onClick={() => setConfirmation(true)}
            >
              Valider la commande
            </button>
          </div>
        </>
      )}

      {confirmation && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setConfirmation(false)}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitre}>Confirmer la commande</h2>
            <p style={styles.modalMsg}>
              En validant, vous donnez votre <strong>bon pour accord</strong> pour cette commande de <strong>{totalPaires} paires</strong> d'un montant de <strong>{totalHT.toFixed(2)} € HT</strong>.
            </p>
            <p style={styles.modalMsg}>
              Votre commande sera transmise immédiatement à votre représentant qui la saisira dans les plus brefs délais.
            </p>
            <div style={styles.modalBtns}>
              <button style={styles.btnAnnuler} onClick={() => setConfirmation(false)}>Annuler</button>
              <button style={styles.btn} onClick={validerCommande} disabled={loading}>
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
  container: { minHeight: '100vh', background: '#F5EFE6' },
  header: { background: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  btnRetour: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#8B6F47' },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '1rem' },
  videEmoji: { fontSize: '3rem' },
  videMsg: { fontSize: '1.1rem', color: '#9B8B7A' },
  lignes: { padding: '1rem' },
  ligne: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' },
  ligneInfo: { flex: 1 },
  ligneNom: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209' },
  ligneRef: { fontSize: '0.75rem', color: '#9B8B7A', margin: '0.1rem 0' },
  ligneTailles: { fontSize: '0.75rem', color: '#8B6F47', marginTop: '0.25rem' },
  ligneDroite: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' },
  ligneQty: { fontSize: '0.8rem', color: '#9B8B7A' },
  lignePrix: { fontSize: '0.9rem', fontWeight: '700', color: '#1A1209' },
  btnSupprimer: { background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: '0.9rem', padding: '0' },
  recap: { padding: '0 1rem 2rem' },
  contraintes: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  contrainte: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1A1209' },
  dot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  totaux: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  totalLigne: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', color: '#1A1209' },
  totalTTC: { fontWeight: '700', fontSize: '1rem', borderTop: '1px solid #E8DDD0', marginTop: '0.5rem', paddingTop: '0.75rem' },
  btn: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%' },
  succes: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '1rem', minHeight: '100vh' },
  succesEmoji: { fontSize: '4rem' },
  succesTitre: { fontFamily: 'Georgia, serif', fontSize: '1.5rem', color: '#1A1209' },
  succesMsg: { fontSize: '0.95rem', color: '#9B8B7A', textAlign: 'center', lineHeight: 1.6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%' },
  modalTitre: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#1A1209', marginBottom: '1rem' },
  modalMsg: { fontSize: '0.9rem', color: '#1A1209', lineHeight: 1.6, marginBottom: '0.75rem' },
  modalBtns: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnAnnuler: { flex: 1, background: '#F5EFE6', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer' },
}