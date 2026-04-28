import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Menu from '../components/Menu'

export default function Profil() {
  const [form, setForm] = useState({
    nom: '', prenom: '', magasin: '',
    adresse_voie: '', adresse_cp: '', adresse_ville: '',
    liv_voie: '', liv_cp: '', liv_ville: '',
    fact_voie: '', fact_cp: '', fact_ville: '',
  })
  const [livIdentique, setLivIdentique] = useState(true)
  const [factIdentique, setFactIdentique] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    chargerProfil()
  }, [])

  const chargerProfil = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setEmail(user.email)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      const nomParts = (data.nom || '').split(' ')
      const prenom = nomParts[0] || ''
      const nom = nomParts.slice(1).join(' ') || ''

      const adresseMagasin = (data.adresse_magasin || '').split(',')
      const voie = adresseMagasin[0]?.trim() || ''
      const cpVille = adresseMagasin[1]?.trim() || ''
      const cp = cpVille.split(' ')[0] || ''
      const ville = cpVille.split(' ').slice(1).join(' ') || ''

      const adresseLiv = data.adresse_livraison || ''
      const adresseFact = data.adresse_facturation || ''
      const livSame = adresseLiv === data.adresse_magasin
      const factSame = adresseFact === data.adresse_magasin

      setLivIdentique(livSame)
      setFactIdentique(factSame)

      const parseLiv = adresseLiv.split(',')
      const livVoie = parseLiv[0]?.trim() || ''
      const livCpVille = parseLiv[1]?.trim() || ''
      const livCp = livCpVille.split(' ')[0] || ''
      const livVille = livCpVille.split(' ').slice(1).join(' ') || ''

      const parseFact = adresseFact.split(',')
      const factVoie = parseFact[0]?.trim() || ''
      const factCpVille = parseFact[1]?.trim() || ''
      const factCp = factCpVille.split(' ')[0] || ''
      const factVille = factCpVille.split(' ').slice(1).join(' ') || ''

      setForm({
        nom, prenom, magasin: data.magasin || '',
        adresse_voie: voie, adresse_cp: cp, adresse_ville: ville,
        liv_voie: livVoie, liv_cp: livCp, liv_ville: livVille,
        fact_voie: factVoie, fact_cp: factCp, fact_ville: factVille,
      })
    }
    setLoading(false)
  }

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const getAdresseMagasin = () => `${form.adresse_voie}, ${form.adresse_cp} ${form.adresse_ville}`
  const getAdresseLiv = () => livIdentique ? getAdresseMagasin() : `${form.liv_voie}, ${form.liv_cp} ${form.liv_ville}`
  const getAdresseFact = () => factIdentique ? getAdresseMagasin() : `${form.fact_voie}, ${form.fact_cp} ${form.fact_ville}`

  const sauvegarder = async () => {
    setError('')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('profiles').update({
      nom: `${form.prenom} ${form.nom}`,
      magasin: form.magasin,
      adresse_magasin: getAdresseMagasin(),
      adresse_livraison: getAdresseLiv(),
      adresse_facturation: getAdresseFact(),
    }).eq('id', user.id)

    if (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } else {
      setSucces(true)
      setTimeout(() => setSucces(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Menu navigate={navigate} />
        <h1 style={styles.titre}>Mon profil</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.content}>
        <div style={styles.emailBox}>
          <div style={styles.emailLabel}>Email</div>
          <div style={styles.emailValue}>{email}</div>
        </div>

        <div style={styles.section}>Informations personnelles</div>
        <input style={styles.input} placeholder="Prénom" value={form.prenom} onChange={e => update('prenom', e.target.value)} />
        <input style={styles.input} placeholder="Nom" value={form.nom} onChange={e => update('nom', e.target.value)} />

        <div style={styles.section}>Magasin</div>
        <input style={styles.input} placeholder="Nom du magasin" value={form.magasin} onChange={e => update('magasin', e.target.value)} />
        <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.adresse_voie} onChange={e => update('adresse_voie', e.target.value)} />
        <div style={styles.row}>
          <input style={{ ...styles.input, width: '35%' }} placeholder="Code postal" value={form.adresse_cp} onChange={e => update('adresse_cp', e.target.value)} />
          <input style={{ ...styles.input, width: '63%' }} placeholder="Ville" value={form.adresse_ville} onChange={e => update('adresse_ville', e.target.value)} />
        </div>

        <div style={styles.section}>Adresse de livraison</div>
        <label style={styles.checkbox}>
          <input type="checkbox" checked={livIdentique} onChange={e => setLivIdentique(e.target.checked)} />
          <span>Identique à l'adresse du magasin</span>
        </label>
        {!livIdentique && (
          <>
            <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.liv_voie} onChange={e => update('liv_voie', e.target.value)} />
            <div style={styles.row}>
              <input style={{ ...styles.input, width: '35%' }} placeholder="Code postal" value={form.liv_cp} onChange={e => update('liv_cp', e.target.value)} />
              <input style={{ ...styles.input, width: '63%' }} placeholder="Ville" value={form.liv_ville} onChange={e => update('liv_ville', e.target.value)} />
            </div>
          </>
        )}

        <div style={styles.section}>Adresse de facturation</div>
        <label style={styles.checkbox}>
          <input type="checkbox" checked={factIdentique} onChange={e => setFactIdentique(e.target.checked)} />
          <span>Identique à l'adresse du magasin</span>
        </label>
        {!factIdentique && (
          <>
            <input style={styles.input} placeholder="Numéro et nom de la voie" value={form.fact_voie} onChange={e => update('fact_voie', e.target.value)} />
            <div style={styles.row}>
              <input style={{ ...styles.input, width: '35%' }} placeholder="Code postal" value={form.fact_cp} onChange={e => update('fact_cp', e.target.value)} />
              <input style={{ ...styles.input, width: '63%' }} placeholder="Ville" value={form.fact_ville} onChange={e => update('fact_ville', e.target.value)} />
            </div>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}

        {succes && (
          <div style={styles.succesBox}>
            ✓ Profil mis à jour — vos prochains bons de commande utiliseront ces informations.
          </div>
        )}

        <button style={styles.btn} onClick={sauvegarder} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#F5EFE6', paddingBottom: '2rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9B8B7A' },
  header: { background: 'white', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10 },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' },
  content: { padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  emailBox: { background: 'white', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.5rem' },
  emailLabel: { fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9B8B7A', marginBottom: '0.25rem' },
  emailValue: { fontSize: '0.95rem', color: '#1A1209' },
  section: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9B8B7A', marginTop: '0.5rem' },
  input: { border: '1px solid #E8DDD0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box', background: 'white', color: '#1A1209' },
  row: { display: 'flex', gap: '0.5rem' },
  checkbox: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#1A1209', cursor: 'pointer' },
  error: { color: '#C0392B', fontSize: '0.85rem' },
  succesBox: { background: '#D4EDDA', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#27AE60', lineHeight: 1.5 },
  btn: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '0.5rem' },
}