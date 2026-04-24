import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import NavbarUI from '../components/NavbarUI'

export default function Historique() {
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [commandeOuverte, setCommandeOuverte] = useState(null)
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
    if (data) setCommandes(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={styles.loading}>Chargement...</div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnRetour} onClick={() => navigate('/accueil')}>← Retour</button>
        <h1 style={styles.titre}>Mes commandes</h1>
      </div>

      {commandes.length === 0 ? (
        <div style={styles.vide}>
          <div style={styles.videEmoji}>📋</div>
          <p style={styles.videMsg}>Aucune commande passée</p>
          <button style={styles.btn} onClick={() => navigate('/catalogue')}>Parcourir le catalogue</button>
        </div>
      ) : (
        <div style={styles.liste}>
          {commandes.map(c => (
            <div key={c.id} style={styles.card} onClick={() => setCommandeOuverte(commandeOuverte?.id === c.id ? null : c)}>
              <div style={styles.cardHeader}>
                <div style={styles.cardInfo}>
                  <div style={styles.cardDate}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div style={styles.cardDetail}>{c.total_paires} paires · {Number(c.total_ht).toFixed(2)} € HT</div>
                </div>
                <div style={styles.cardStatut}>Validée ✓</div>
              </div>

              {commandeOuverte?.id === c.id && (
                <div style={styles.detail}>
                  <div style={styles.detailTitre}>Détail de la commande</div>
                  {(c.lignes || []).map((l, i) => {
                    const tailles = Object.entries(l.qtys || {}).filter(([, v]) => parseInt(v) > 0)
                    return (
                      <div key={i} style={styles.detailLigne}>
                        <div style={styles.detailNom}>{l.nom} — {l.coloris}</div>
                        <div style={styles.detailRef}>{l.reference}</div>
                        <div style={styles.detailTailles}>
                          {tailles.map(([t, v]) => `T${t}×${v}`).join('  ')}
                        </div>
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
          ))}
        </div>
      )}

      <NavbarUI navigate={navigate} active="/historique" />
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#F5EFE6', paddingBottom: '80px' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9B8B7A' },
  header: { background: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  btnRetour: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#8B6F47' },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' },
  vide: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem', gap: '1rem' },
  videEmoji: { fontSize: '3rem' },
  videMsg: { fontSize: '1.1rem', color: '#9B8B7A' },
  liste: { padding: '1rem' },
  card: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem', cursor: 'pointer' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardDate: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209' },
  cardDetail: { fontSize: '0.8rem', color: '#9B8B7A', marginTop: '0.2rem' },
  cardStatut: { fontSize: '0.8rem', color: '#27AE60', fontWeight: '600' },
  detail: { marginTop: '1rem', borderTop: '1px solid #F5EFE6', paddingTop: '1rem' },
  detailTitre: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9B8B7A', marginBottom: '0.75rem' },
  detailLigne: { background: '#F5EFE6', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.5rem' },
  detailNom: { fontSize: '0.85rem', fontWeight: '600', color: '#1A1209' },
  detailRef: { fontSize: '0.7rem', color: '#9B8B7A', marginTop: '0.1rem' },
  detailTailles: { fontSize: '0.75rem', color: '#8B6F47', marginTop: '0.25rem' },
  detailPrix: { fontSize: '0.8rem', color: '#1A1209', fontWeight: '600', marginTop: '0.25rem' },
  detailTotaux: { background: 'white', borderRadius: '8px', padding: '0.75rem', marginTop: '0.5rem' },
  detailTotal: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#1A1209', padding: '0.2rem 0' },
  detailTotalTTC: { fontWeight: '700', borderTop: '1px solid #E8DDD0', marginTop: '0.3rem', paddingTop: '0.5rem' },
  btn: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem 1.5rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
}