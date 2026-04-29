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
      client_id: user.id,
      lignes: panier,
      total_ht: totalHT,
      total_paires: totalPaires,
      statut: 'brouillon',
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

    await supabase.from('commandes').insert({
      client_id: user.id, lignes, total_ht: totalHT, total_paires: totalPaires, statut: 'validée'
    })

    try {
      await supabase.functions.invoke('send-order-email', {
        body: {
          client: {
            nom: profile.nom,
            email: profile.email,
            magasin: profile.magasin,
            adresse_livraison: profile.adresse_livraison,
            adresse_facturation: profile.adresse_facturation,
          },
          lignes,
          totalHT,
          totalPaires,
        }
      })
    } catch (err) {
      console.error('Erreur envoi email:', err)
    }

    setDernierTotal({ paires: totalPaires, ht: totalHT })
    localStorage.removeItem('panier')
    setPanier([])
    setConfirmation(false)
    setCommande(true)
    setLoading(false)
  }

  if (commande) return (
    <div style={{ minHeight: '100vh', background: '#2C1A0E', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', gap: '1rem' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#27AE60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white' }}>✓</div>
      <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', color: 'white', textAlign: 'center' }}>Commande envoyée</h2>
      <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.7, maxWidth: '320px' }}>
        Votre commande a bien été transmise. Un email de confirmation vous a été envoyé.
      </p>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem', width: '100%', maxWidth: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', padding: '0.3rem 0' }}><span>Total paires</span><span>{dernierTotal.paires}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', padding: '0.3rem 0' }}><span>Total HT</span><span>{dernierTotal.ht.toFixed(2)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', padding: '0.3rem 0' }}><span>TVA 20%</span><span>{(dernierTotal.ht * 0.2).toFixed(2)} €</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: '700', fontSize: '1rem', padding: '0.5rem 0 0.3rem', borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: '0.3rem' }}><span>Total TTC</span><span>{(dernierTotal.ht * 1.2).toFixed(2)} €</span></div>
      </div>
      <button style={{ background: 'white', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '320px' }} onClick={() => navigate('/accueil')}>Retour à l'accueil</button>
      <button style={{ background: 'none', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer', width: '100%', maxWidth: '320px' }} onClick={() => navigate('/historique')}>Voir mes commandes</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', paddingBottom: '2rem' }}>
      <div style={{ background: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#8B6F47' }}>← Retour</button>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' }}>Mon panier</h1>
        <div style={{ width: 60 }} />
      </div>

      {panier.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '1rem' }}>
          <div style={{ fontSize: '3rem' }}>🛒</div>
          <p style={{ fontSize: '1.1rem', color: '#9B8B7A' }}>Votre panier est vide</p>
          <button style={{ background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem 1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate('/catalogue')}>Parcourir le catalogue</button>
        </div>
      ) : (
        <>
          <div style={{ padding: '1rem' }}>
            {panier.map(l => {
              const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
              return (
                <div key={l.id} style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1A1209' }}>{l.reference} — {l.coloris}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9B8B7A', marginTop: '0.1rem' }}>{l.prix} € / paire</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', fontSize: '1rem' }} onClick={() => supprimerLigne(l.id)}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {(l.tailles || []).map(t => {
                      const q = parseInt(l.qtys?.[t]) || 0
                      return (
                        <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9B8B7A' }}>T.{t}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button style={{ background: '#F5EFE6', border: 'none', borderRadius: '4px', width: '26px', height: '26px', fontSize: '1rem', cursor: 'pointer', color: '#1A1209', fontWeight: '600' }} onClick={() => updateQty(l.id, t, -1)}>−</button>
                            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1A1209', minWidth: '20px', textAlign: 'center' }}>{q}</span>
                            <button style={{ background: '#F5EFE6', border: 'none', borderRadius: '4px', width: '26px', height: '26px', fontSize: '1rem', cursor: 'pointer', color: '#1A1209', fontWeight: '600' }} onClick={() => updateQty(l.id, t, 1)}>+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F5EFE6', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#9B8B7A' }}>{qty} paires</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1A1209' }}>{(qty * (l.prix || 0)).toFixed(2)} €</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '0 1rem 2rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1A1209', marginBottom: '0.5rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: minPairesOk ? '#27AE60' : '#C0392B', flexShrink: 0 }} />
                <span>{totalPaires} / {MIN_PAIRES} paires minimum {minPairesOk ? '✓' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#1A1209' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: francoOk ? '#27AE60' : '#C0392B', flexShrink: 0 }} />
                <span>Franco à {FRANCO} € — {totalHT.toFixed(2)} € {francoOk ? '✓ Port offert' : `(manque ${(FRANCO - totalHT).toFixed(2)} €)`}</span>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', color: '#1A1209' }}><span>Total paires</span><span>{totalPaires}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', color: '#1A1209' }}><span>Total HT</span><span>{totalHT.toFixed(2)} €</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.3rem 0', color: '#1A1209' }}><span>TVA 20%</span><span>{(totalHT * 0.2).toFixed(2)} €</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', padding: '0.75rem 0 0.3rem', borderTop: '1px solid #E8DDD0', marginTop: '0.5rem', color: '#1A1209' }}><span>Total TTC</span><span>{(totalHT * 1.2).toFixed(2)} €</span></div>
            </div>

            <button style={{ background: 'white', color: '#1A1209', border: '1px solid #E8DDD0', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer', width: '100%', marginBottom: '0.5rem' }} onClick={sauvegarderBrouillon}>
              💾 Sauvegarder en brouillon
            </button>
            <button style={{ background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%', opacity: !minPairesOk ? 0.4 : 1 }} disabled={!minPairesOk} onClick={() => setConfirmation(true)}>
              Valider la commande
            </button>
          </div>
        </>
      )}

      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && setConfirmation(false)}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#1A1209', marginBottom: '1rem' }}>Bon pour accord</h2>
            <p style={{ fontSize: '0.9rem', color: '#1A1209', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              En confirmant, vous validez votre commande de <strong>{totalPaires} paires</strong> pour un montant de <strong>{totalHT.toFixed(2)} € HT</strong>.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#1A1209', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Elle sera transmise immédiatement à votre représentant. Un email de confirmation vous sera envoyé.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button style={{ flex: 1, background: '#F5EFE6', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer' }} onClick={() => setConfirmation(false)}>Annuler</button>
              <button style={{ flex: 1, background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }} onClick={validerCommande} disabled={loading}>{loading ? 'Envoi...' : 'Je confirme'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}