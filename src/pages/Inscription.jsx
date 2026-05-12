import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, Link } from 'react-router-dom'

const REF_COMMERCIALE = 'TodeschiniLME1'

export default function Inscription() {
  const [form, setForm] = useState({
    email: '', password: '', nom: '', prenom: '',
    magasin: '',
    adresse_voie: '', adresse_cp: '', adresse_ville: '',
    liv_voie: '', liv_cp: '', liv_ville: '',
    fact_voie: '', fact_cp: '', fact_ville: '',
    ref_commerciale: ''
  })
  const [livIdentique, setLivIdentique] = useState(true)
  const [factIdentique, setFactIdentique] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [etape, setEtape] = useState(1)
  const navigate = useNavigate()

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const getAdresseMagasin = () => `${form.adresse_voie}, ${form.adresse_cp} ${form.adresse_ville}`
  const getAdresseLiv = () => livIdentique ? getAdresseMagasin() : `${form.liv_voie}, ${form.liv_cp} ${form.liv_ville}`
  const getAdresseFact = () => factIdentique ? getAdresseMagasin() : `${form.fact_voie}, ${form.fact_cp} ${form.fact_ville}`

  const passerEtape2 = () => {
    if (!form.prenom || !form.nom || !form.email || !form.password || !form.magasin || !form.adresse_voie || !form.adresse_cp || !form.adresse_ville) {
      setError('Hop, hop, hop pas si vite... Veuillez remplir tous les champs.')
      return
    }
    setError('')
    setEtape(2)
  }

  const handleInscription = async (e) => {
    e.preventDefault()
    setError('')

    const champsLivVides = !livIdentique && (!form.liv_voie || !form.liv_cp || !form.liv_ville)
    const champsFactVides = !factIdentique && (!form.fact_voie || !form.fact_cp || !form.fact_ville)

    if (champsLivVides || champsFactVides || !form.ref_commerciale) {
      setError('Hop, hop, hop pas si vite... Veuillez remplir tous les champs.')
      return
    }

    if (form.ref_commerciale !== REF_COMMERCIALE) {
      setError("Merci de vous rapprocher de votre super représentant pour obtenir le code d'accès.")
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: form.email,
      nom: `${form.prenom} ${form.nom}`,
      magasin: form.magasin,
      adresse_magasin: getAdresseMagasin(),
      adresse_livraison: getAdresseLiv(),
      adresse_facturation: getAdresseFact(),
    })

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    navigate('/accueil')
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <Link to="/login" style={styles.btnBack}>‹</Link>
        <h1 style={styles.headerTitre}>Créer mon compte</h1>
        <div style={{ width: 32 }} />
      </div>

      {/* Progress */}
      <div style={styles.progress}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: etape === 1 ? '50%' : '100%' }} />
        </div>
        <div style={styles.progressLabel}>Étape {etape} / 2</div>
      </div>

      <div style={styles.content}>
        {etape === 1 && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitre}>Informations générales</h2>
            <p style={styles.formSub}>Vos coordonnées personnelles et magasin</p>

            <div style={styles.sectionLabel}>Informations personnelles</div>
            <div style={styles.row}>
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Prénom</label>
                <input style={styles.input} placeholder="Prénom" value={form.prenom} onChange={e => update('prenom', e.target.value)} />
              </div>
              <div style={styles.fieldWrap}>
                <label style={styles.fieldLabel}>Nom</label>
                <input style={styles.input} placeholder="Nom" value={form.nom} onChange={e => update('nom', e.target.value)} />
              </div>
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Email</label>
              <input style={styles.input} type="email" placeholder="votre@email.com" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Mot de passe</label>
              <input style={styles.input} type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
            </div>

            <div style={styles.sectionLabel}>Magasin</div>
            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Nom du magasin</label>
              <input style={styles.input} placeholder="Nom du magasin" value={form.magasin} onChange={e => update('magasin', e.target.value)} />
            </div>
            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Adresse</label>
              <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.adresse_voie} onChange={e => update('adresse_voie', e.target.value)} />
            </div>
            <div style={styles.rowSmall}>
              <div style={{ ...styles.fieldWrap, width: '35%' }}>
                <label style={styles.fieldLabel}>CP</label>
                <input style={styles.input} placeholder="CP" value={form.adresse_cp} onChange={e => update('adresse_cp', e.target.value)} />
              </div>
              <div style={{ ...styles.fieldWrap, width: '63%' }}>
                <label style={styles.fieldLabel}>Ville</label>
                <input style={styles.input} placeholder="Ville" value={form.adresse_ville} onChange={e => update('adresse_ville', e.target.value)} />
              </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button style={styles.btnPrimary} onClick={passerEtape2}>
              Continuer →
            </button>
          </div>
        )}

        {etape === 2 && (
          <form onSubmit={handleInscription} style={styles.formCard}>
            <h2 style={styles.formTitre}>Adresses & accès</h2>
            <p style={styles.formSub}>Livraison, facturation et code d'accès</p>

            <div style={styles.sectionLabel}>Adresse de livraison</div>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={livIdentique} onChange={e => setLivIdentique(e.target.checked)} style={styles.checkbox} />
              <span>Identique à l'adresse du magasin</span>
            </label>
            {!livIdentique && (
              <>
                <div style={styles.fieldWrap}>
                  <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.liv_voie} onChange={e => update('liv_voie', e.target.value)} />
                </div>
                <div style={styles.rowSmall}>
                  <div style={{ ...styles.fieldWrap, width: '35%' }}>
                    <input style={styles.input} placeholder="CP" value={form.liv_cp} onChange={e => update('liv_cp', e.target.value)} />
                  </div>
                  <div style={{ ...styles.fieldWrap, width: '63%' }}>
                    <input style={styles.input} placeholder="Ville" value={form.liv_ville} onChange={e => update('liv_ville', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div style={styles.sectionLabel}>Adresse de facturation</div>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={factIdentique} onChange={e => setFactIdentique(e.target.checked)} style={styles.checkbox} />
              <span>Identique à l'adresse du magasin</span>
            </label>
            {!factIdentique && (
              <>
                <div style={styles.fieldWrap}>
                  <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.fact_voie} onChange={e => update('fact_voie', e.target.value)} />
                </div>
                <div style={styles.rowSmall}>
                  <div style={{ ...styles.fieldWrap, width: '35%' }}>
                    <input style={styles.input} placeholder="CP" value={form.fact_cp} onChange={e => update('fact_cp', e.target.value)} />
                  </div>
                  <div style={{ ...styles.fieldWrap, width: '63%' }}>
                    <input style={styles.input} placeholder="Ville" value={form.fact_ville} onChange={e => update('fact_ville', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div style={styles.sectionLabel}>Code d'accès</div>
            <div style={styles.fieldWrap}>
              <label style={styles.fieldLabel}>Code communiqué par votre représentant</label>
              <input style={styles.input} placeholder="Code d'accès" value={form.ref_commerciale} onChange={e => update('ref_commerciale', e.target.value)} />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.btnGroup}>
              <button type="button" style={styles.btnSecondary} onClick={() => { setEtape(1); setError('') }}>
                ← Retour
              </button>
              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </div>
          </form>
        )}

        <p style={styles.loginLink}>
          Déjà un compte ?{' '}
          <Link to="/login" style={styles.loginLinkA}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', paddingBottom: '2rem' },
  header: { background: 'var(--beige-card)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 },
  btnBack: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--brown-dark)', lineHeight: 1, textDecoration: 'none', width: '32px', display: 'flex', alignItems: 'center' },
  headerTitre: { fontSize: '1rem', fontFamily: 'Playfair Display, serif', color: 'var(--brown-dark)', fontWeight: '600' },
  progress: { padding: '1rem 1.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' },
  progressBar: { flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'var(--brown-dark)', borderRadius: '2px', transition: 'width 0.3s ease' },
  progressLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' },
  content: { padding: '1rem 1.25rem' },
  formCard: { background: 'var(--beige-card)', borderRadius: '20px', padding: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  formTitre: { fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', color: 'var(--brown-dark)' },
  formSub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '-0.25rem' },
  sectionLabel: { fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '0.5rem' },
  row: { display: 'flex', gap: '0.75rem' },
  rowSmall: { display: 'flex', gap: '0.5rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  fieldLabel: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)' },
  input: { border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', background: 'var(--beige)', color: 'var(--brown-dark)', width: '100%', boxSizing: 'border-box' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--brown-dark)', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', accentColor: 'var(--brown-dark)' },
  error: { background: '#FEE2E2', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--red)' },
  btnGroup: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem' },
  btnPrimary: { flex: 1, background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { flex: 1, background: 'none', color: 'var(--brown-dark)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.9rem', fontSize: '0.9rem', cursor: 'pointer' },
  loginLink: { textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1.25rem' },
  loginLinkA: { color: 'var(--brown-dark)', fontWeight: '600', textDecoration: 'none' },
}