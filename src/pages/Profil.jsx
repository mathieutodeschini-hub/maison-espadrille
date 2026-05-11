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

  useEffect(() => { chargerProfil() }, [])

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
      const livSame = data.adresse_livraison === data.adresse_magasin
      const factSame = data.adresse_facturation === data.adresse_magasin
      setLivIdentique(livSame)
      setFactIdentique(factSame)
      const parseLiv = (data.adresse_livraison || '').split(',')
      const parseFact = (data.adresse_facturation || '').split(',')
      setForm({
        nom, prenom, magasin: data.magasin || '',
        adresse_voie: voie, adresse_cp: cp, adresse_ville: ville,
        liv_voie: parseLiv[0]?.trim() || '', liv_cp: parseLiv[1]?.trim().split(' ')[0] || '', liv_ville: parseLiv[1]?.trim().split(' ').slice(1).join(' ') || '',
        fact_voie: parseFact[0]?.trim() || '', fact_cp: parseFact[1]?.trim().split(' ')[0] || '', fact_ville: parseFact[1]?.trim().split(' ').slice(1).join(' ') || '',
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
    if (err) setError('Une erreur est survenue.')
    else { setSucces(true); setTimeout(() => setSucces(false), 3000) }
    setSaving(false)
  }

  if (loading) return <div style={styles.loading}>Chargement...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Menu navigate={navigate} />
        <h1 style={styles.headerTitre}>Mon profil</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.content}>
        {/* Email */}
        <div style={styles.emailCard}>
          <div style={styles.emailIcon}>✉️</div>
          <div>
            <div style={styles.emailLabel}>Adresse email</div>
            <div style={styles.emailVal}>{email}</div>
          </div>
        </div>

        {/* Infos perso */}
        <div style={styles.sectionTitre}>Informations personnelles</div>
        <div style={styles.row}>
          <div style={styles.fieldWrap}>
            <label style={styles.fieldLabel}>Prénom</label>
            <input style={styles.input} value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Prénom" />
          </div>
          <div style={styles.fieldWrap}>
            <label style={styles.fieldLabel}>Nom</label>
            <input style={styles.input} value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="Nom" />
          </div>
        </div>

        {/* Magasin */}
        <div style={styles.sectionTitre}>Magasin</div>
        <div style={styles.fieldWrap}>
          <label style={styles.fieldLabel}>Nom du magasin</label>
          <input style={styles.input} value={form.magasin} onChange={e => update('magasin', e.target.value)} placeholder="Nom du magasin" />
        </div>
        <div style={styles.fieldWrap}>
          <label style={styles.fieldLabel}>Adresse</label>
          <input style={styles.input} value={form.adresse_voie} onChange={e => update('adresse_voie', e.target.value)} placeholder="Numéro et nom de la voie" />
        </div>
        <div style={styles.rowSmall}>
          <div style={{ ...styles.fieldWrap, width: '35%' }}>
            <label style={styles.fieldLabel}>Code postal</label>
            <input style={styles.input} value={form.adresse_cp} onChange={e => update('adresse_cp', e.target.value)} placeholder="CP" />
          </div>
          <div style={{ ...styles.fieldWrap, width: '63%' }}>
            <label style={styles.fieldLabel}>Ville</label>
            <input style={styles.input} value={form.adresse_ville} onChange={e => update('adresse_ville', e.target.value)} placeholder="Ville" />
          </div>
        </div>

        {/* Livraison */}
        <div style={styles.sectionTitre}>Adresse de livraison</div>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked={livIdentique} onChange={e => setLivIdentique(e.target.checked)} style={styles.checkbox} />
          <span>Identique à l'adresse du magasin</span>
        </label>
        {!livIdentique && (
          <>
            <div style={styles.fieldWrap}>
              <input style={styles.input} value={form.liv_voie} onChange={e => update('liv_voie', e.target.value)} placeholder="Numéro et nom de la voie" />
            </div>
            <div style={styles.rowSmall}>
              <div style={{ ...styles.fieldWrap, width: '35%' }}>
                <input style={styles.input} value={form.liv_cp} onChange={e => update('liv_cp', e.target.value)} placeholder="CP" />
              </div>
              <div style={{ ...styles.fieldWrap, width: '63%' }}>
                <input style={styles.input} value={form.liv_ville} onChange={e => update('liv_ville', e.target.value)} placeholder="Ville" />
              </div>
            </div>
          </>
        )}

        {/* Facturation */}
        <div style={styles.sectionTitre}>Adresse de facturation</div>
        <label style={styles.checkboxLabel}>
          <input type="checkbox" checked={factIdentique} onChange={e => setFactIdentique(e.target.checked)} style={styles.checkbox} />
          <span>Identique à l'adresse du magasin</span>
        </label>
        {!factIdentique && (
          <>
            <div style={styles.fieldWrap}>
              <input style={styles.input} value={form.fact_voie} onChange={e => update('fact_voie', e.target.value)} placeholder="Numéro et nom de la voie" />
            </div>
            <div style={styles.rowSmall}>
              <div style={{ ...styles.fieldWrap, width: '35%' }}>
                <input style={styles.input} value={form.fact_cp} onChange={e => update('fact_cp', e.target.value)} placeholder="CP" />
              </div>
              <div style={{ ...styles.fieldWrap, width: '63%' }}>
                <input style={styles.input} value={form.fact_ville} onChange={e => update('fact_ville', e.target.value)} placeholder="Ville" />
              </div>
            </div>
          </>
        )}

        {error && <p style={styles.error}>{error}</p>}
        {succes && <div style={styles.succesBox}>✓ Profil mis à jour avec succès</div>}

        <button style={styles.btnSave} onClick={sauvegarder} disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
        </button>

        <button style={styles.btnDeconnexion} onClick={() => supabase.auth.signOut()}>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: 'var(--beige)', paddingBottom: '3rem' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' },
  header: { background: 'var(--beige-card)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 },
  headerTitre: { fontSize: '1rem', fontFamily: 'Playfair Display, serif', color: 'var(--brown-dark)', fontWeight: '600' },
  content: { padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  emailCard: { background: 'var(--beige-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.5rem' },
  emailIcon: { fontSize: '1.3rem' },
  emailLabel: { fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.2rem' },
  emailVal: { fontSize: '0.9rem', color: 'var(--brown-dark)', fontWeight: '500' },
  sectionTitre: { fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '0.5rem' },
  row: { display: 'flex', gap: '0.75rem' },
  rowSmall: { display: 'flex', gap: '0.5rem' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  fieldLabel: { fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)' },
  input: { border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', outline: 'none', background: 'var(--beige-card)', color: 'var(--brown-dark)', width: '100%', boxSizing: 'border-box' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--brown-dark)', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', accentColor: 'var(--brown-dark)' },
  error: { color: 'var(--red)', fontSize: '0.85rem' },
  succesBox: { background: '#D4EDDA', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--green)', fontWeight: '500' },
  btnSave: { background: 'var(--brown-dark)', color: 'white', border: 'none', borderRadius: '25px', padding: '0.95rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', width: '100%', marginTop: '0.5rem' },
  btnDeconnexion: { background: 'none', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '25px', padding: '0.85rem', fontSize: '0.88rem', cursor: 'pointer', width: '100%' },
}