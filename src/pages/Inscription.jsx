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
  const navigate = useNavigate()

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const getAdresseMagasin = () => `${form.adresse_voie}, ${form.adresse_cp} ${form.adresse_ville}`
  const getAdresseLiv = () => livIdentique ? getAdresseMagasin() : `${form.liv_voie}, ${form.liv_cp} ${form.liv_ville}`
  const getAdresseFact = () => factIdentique ? getAdresseMagasin() : `${form.fact_voie}, ${form.fact_cp} ${form.fact_ville}`

  const handleInscription = async (e) => {
    e.preventDefault()
    setError('')

    const champsVides = [
      form.prenom, form.nom, form.email, form.password,
      form.magasin, form.adresse_voie, form.adresse_cp, form.adresse_ville,
      form.ref_commerciale,
      ...(!livIdentique ? [form.liv_voie, form.liv_cp, form.liv_ville] : []),
      ...(!factIdentique ? [form.fact_voie, form.fact_cp, form.fact_ville] : []),
    ].some(v => !v || v.trim() === '')

    if (champsVides) {
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

    navigate('/catalogue')
    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Créer mon compte</h1>
        <p style={styles.subtitle}>La Maison de l'Espadrille</p>
        <form onSubmit={handleInscription} style={styles.form}>

          <p style={styles.section}>Informations personnelles</p>
          <input style={styles.input} placeholder="Prénom" value={form.prenom} onChange={e => update('prenom', e.target.value)} />
          <input style={styles.input} placeholder="Nom" value={form.nom} onChange={e => update('nom', e.target.value)} />
          <input style={styles.input} type="email" placeholder="Email" value={form.email} onChange={e => update('email', e.target.value)} />
          <input style={styles.input} type="password" placeholder="Mot de passe" value={form.password} onChange={e => update('password', e.target.value)} />

          <p style={styles.section}>Informations magasin</p>
          <input style={styles.input} placeholder="Nom du magasin" value={form.magasin} onChange={e => update('magasin', e.target.value)} />
          <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.adresse_voie} onChange={e => update('adresse_voie', e.target.value)} />
          <div style={styles.row}>
            <input style={{...styles.input, width:'35%'}} placeholder="Code postal" value={form.adresse_cp} onChange={e => update('adresse_cp', e.target.value)} />
            <input style={{...styles.input, width:'63%'}} placeholder="Ville" value={form.adresse_ville} onChange={e => update('adresse_ville', e.target.value)} />
          </div>

          <p style={styles.section}>Adresse de livraison</p>
          <label style={styles.checkbox}>
            <input type="checkbox" checked={livIdentique} onChange={e => setLivIdentique(e.target.checked)} />
            <span>Identique à l'adresse du magasin</span>
          </label>
          {!livIdentique && (
            <>
              <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.liv_voie} onChange={e => update('liv_voie', e.target.value)} />
              <div style={styles.row}>
                <input style={{...styles.input, width:'35%'}} placeholder="Code postal" value={form.liv_cp} onChange={e => update('liv_cp', e.target.value)} />
                <input style={{...styles.input, width:'63%'}} placeholder="Ville" value={form.liv_ville} onChange={e => update('liv_ville', e.target.value)} />
              </div>
            </>
          )}

          <p style={styles.section}>Adresse de facturation</p>
          <label style={styles.checkbox}>
            <input type="checkbox" checked={factIdentique} onChange={e => setFactIdentique(e.target.checked)} />
            <span>Identique à l'adresse du magasin</span>
          </label>
          {!factIdentique && (
            <>
              <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.fact_voie} onChange={e => update('fact_voie', e.target.value)} />
              <div style={styles.row}>
                <input style={{...styles.input, width:'35%'}} placeholder="Code postal" value={form.fact_cp} onChange={e => update('fact_cp', e.target.value)} />
                <input style={{...styles.input, width:'63%'}} placeholder="Ville" value={form.fact_ville} onChange={e => update('fact_ville', e.target.value)} />
              </div>
            </>
          )}

          <p style={styles.section}>Accès</p>
          <input style={styles.input} placeholder="Code d'accès" value={form.ref_commerciale} onChange={e => update('ref_commerciale', e.target.value)} />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <Link to="/login" style={styles.link}>Déjà un compte ? Se connecter</Link>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#F5EFE6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Georgia, serif',
    fontSize: '1.6rem',
    color: '#1A1209',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#9B8B7A',
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
  section: {
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9B8B7A',
    marginTop: '0.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  row: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    border: '1px solid #E8DDD0',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
    fontSize: '1rem',
    outline: 'none',
    width: '100%',
    textAlign: 'left',
    boxSizing: 'border-box',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    color: '#1A1209',
    textAlign: 'left',
    cursor: 'pointer',
  },
  button: {
    background: '#1A1209',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.85rem',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    color: '#C0392B',
    fontSize: '0.85rem',
    textAlign: 'left',
  },
  link: {
    color: '#8B6F47',
    fontSize: '0.9rem',
    textDecoration: 'none',
  },
}