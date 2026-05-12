import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Menu from '../components/Menu'

export default function Accueil() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ commandes: 0, totalHT: 0, dernieres: [] })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    chargerDonnees()
  }, [])

  const chargerDonnees = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data: cmds } = await supabase
      .from('commandes')
      .select('*')
      .eq('client_id', user.id)
      .eq('statut', 'validée')
      .order('created_at', { ascending: false })

    if (prof) setProfile(prof)
    if (cmds) {
      const totalHT = cmds.reduce((sum, c) => sum + Number(c.total_ht || 0), 0)
      setStats({
        commandes: cmds.length,
        totalHT,
        dernieres: cmds.slice(0, 3),
      })
    }
    setLoading(false)
  }

  const totalPanier = (() => {
    try {
      const p = JSON.parse(localStorage.getItem('panier') || '[]')
      return p.reduce((sum, l) => sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)
    } catch { return 0 }
  })()

  if (loading) return <div style={styles.loading}>Chargement...</div>

  const prenom = profile?.nom?.split(' ')[0] || 'Bonjour'

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Menu navigate={navigate} panierCount={totalPanier} hamburgerColor="white" />
        <img src="/logo.png" alt="LME" style={styles.logoImg} onError={e => e.target.style.display = 'none'} />
        <button style={styles.btnPanier} onClick={() => navigate('/panier')}>
          {/* Icône panier SVG blanc */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {totalPanier > 0 && <span style={styles.badge}>{totalPanier}</span>}
        </button>
      </div>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <p style={styles.heroBonjour}>Bonjour,</p>
          <h1 style={styles.heroNom}>{profile?.magasin || prenom}</h1>
          <p style={styles.heroSub}>Prêt pour de nouvelles ventes ensoleillées ?</p>
          <button style={styles.heroBtn} onClick={() => navigate('/catalogue')}>
            Découvrir le catalogue
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {/* Indicateurs */}
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitre}>Vos indicateurs</div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Commandes</div>
            <div style={styles.statValue}>{stats.commandes}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Montant total</div>
            <div style={styles.statValue}>{stats.totalHT.toFixed(0)} €</div>
          </div>
        </div>

        {/* Panier en cours */}
        {totalPanier > 0 && (
          <div style={styles.panierAlert} onClick={() => navigate('/panier')}>
            <div>
              <div style={styles.panierAlertTitre}>Panier en cours</div>
              <div style={styles.panierAlertSub}>{totalPanier} paires — Finaliser ma commande</div>
            </div>
            <span style={styles.panierAlertArrow}>→</span>
          </div>
        )}

        {/* Dernières commandes */}
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitre}>Vos dernières commandes</div>
          <button style={styles.voirTout} onClick={() => navigate('/historique')}>Voir tout</button>
        </div>

        {stats.dernieres.length === 0 ? (
          <div style={styles.vide}>
            <p style={styles.videMsg}>Aucune commande pour l'instant</p>
            <button style={styles.btnPrimary} onClick={() => navigate('/catalogue')}>
              Passer ma première commande
            </button>
          </div>
        ) : (
          stats.dernieres.map(c => (
            <div key={c.id} style={styles.commandeCard} onClick={() => navigate('/historique')}>
              <div style={styles.commandeInfo}>
                <div style={styles.commandeNum}>
                  {new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={styles.commandeDetail}>
                  {c.saison && <span style={styles.saisonTag}>{c.saison}</span>}
                  {c.total_paires} paires · {Number(c.total_ht).toFixed(2)} € HT
                </div>
              </div>
              <div style={styles.commandeStatut}>Validée ✓</div>
            </div>
          ))
        )}

        {/* Actions rapides */}
        <div style={styles.sectionHeader}>
          <div style={styles.sectionTitre}>Actions rapides</div>
        </div>
        <div style={styles.actionsGrid}>
          <button style={styles.actionCard} onClick={() => navigate('/catalogue')}>
            <span style={styles.actionIcon}>📦</span>
            <span style={styles.actionLabel}>Catalogue</span>
          </button>
          <button style={styles.actionCard} onClick={() => navigate('/recherche')}>
            <span style={styles.actionIcon}>🔍</span>
            <span style={styles.actionLabel}>Recherche</span>
          </button>
          <button style={styles.actionCard} onClick={() => navigate('/historique')}>
            <span style={styles.actionIcon}>📋</span>
            <span style={styles.actionLabel}>Commandes</span>
          </button>
          <button style={styles.actionCard} onClick={() => navigate('/profil')}>
            <span style={styles.actionIcon}>👤</span>
            <span style={styles.actionLabel}>Mon profil</span>
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', paddingBottom: '2rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)', fontFamily: 'Playfair Display, serif' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.25rem', zIndex: 20,
  },
  logoImg: { height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' },
  btnPanier: {
    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
    width: '38px', height: '38px', cursor: 'pointer', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  badge: {
    position: 'absolute', top: '-3px', right: '-3px',
    background: 'var(--red)', color: 'white', borderRadius: '50%',
    width: '16px', height: '16px', fontSize: '0.65rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700',
  },

  hero: {
    position: 'relative', height: '280px',
    background: 'linear-gradient(135deg, #2C1A0E 0%, #8B6F47 50%, #C4A882 100%)',
    overflow: 'hidden',
  },
  heroOverlay: { position: 'absolute', inset: 0, background: 'rgba(44,26,14,0.3)' },
  heroContent: { position: 'relative', zIndex: 1, padding: '5rem 1.5rem 2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' },
  heroBonjour: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', letterSpacing: '0.05em', marginBottom: '0.25rem' },
  heroNom: { color: 'white', fontSize: '1.8rem', fontFamily: 'Playfair Display, serif', fontWeight: '600', marginBottom: '0.4rem', lineHeight: 1.2 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 },
  heroBtn: {
    alignSelf: 'flex-start',
    background: 'white', color: 'var(--brown-dark)',
    border: 'none', borderRadius: '25px',
    padding: '0.6rem 1.25rem', fontSize: '0.85rem',
    fontWeight: '600', cursor: 'pointer',
  },

  content: { padding: '1.5rem 1.25rem' },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', marginTop: '1.5rem' },
  sectionTitre: { fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' },
  voirTout: { background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--brown-mid)', cursor: 'pointer', fontWeight: '500' },

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' },
  statCard: { background: 'var(--beige-card)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid var(--border)' },
  statLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '500' },
  statValue: { fontSize: '1.6rem', fontWeight: '700', color: 'var(--brown-dark)', fontFamily: 'Playfair Display, serif' },

  panierAlert: {
    background: 'var(--brown-dark)', borderRadius: '14px',
    padding: '1rem 1.25rem', marginTop: '1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer',
  },
  panierAlertTitre: { color: 'white', fontWeight: '600', fontSize: '0.9rem', marginBottom: '0.2rem' },
  panierAlertSub: { color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' },
  panierAlertArrow: { color: 'white', fontSize: '1.2rem' },

  commandeCard: {
    background: 'var(--beige-card)', borderRadius: '12px',
    padding: '0.9rem 1.1rem', marginBottom: '0.6rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    border: '1px solid var(--border)', cursor: 'pointer',
  },
  commandeInfo: { flex: 1 },
  commandeNum: { fontSize: '0.88rem', fontWeight: '600', color: 'var(--brown-dark)', marginBottom: '0.25rem' },
  commandeDetail: { fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' },
  commandeStatut: { fontSize: '0.75rem', color: 'var(--green)', fontWeight: '600', whiteSpace: 'nowrap' },
  saisonTag: { background: 'var(--brown-dark)', color: 'white', borderRadius: '4px', padding: '1px 5px', fontSize: '0.68rem', fontWeight: '600' },

  vide: { textAlign: 'center', padding: '2rem 1rem' },
  videMsg: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' },

  actionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.6rem' },
  actionCard: {
    background: 'var(--beige-card)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '0.85rem 0.5rem',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
    cursor: 'pointer',
  },
  actionIcon: { fontSize: '1.3rem' },
  actionLabel: { fontSize: '0.65rem', fontWeight: '500', color: 'var(--brown-dark)', textAlign: 'center' },

  btnPrimary: {
    background: 'var(--brown-dark)', color: 'white',
    border: 'none', borderRadius: '25px',
    padding: '0.75rem 1.5rem', fontSize: '0.9rem',
    fontWeight: '600', cursor: 'pointer',
  },
}
