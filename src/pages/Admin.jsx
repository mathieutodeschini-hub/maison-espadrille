import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import Papa from 'papaparse'

const ADMIN_PASSWORD = 'C1f18m13p3y04@'

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [produits, setProduits] = useState([])
  const [clients, setClients] = useState([])
  const [commandes, setCommandes] = useState([])
  const [onglet, setOnglet] = useState('produits')
  const [saison, setSaison] = useState('')
  const [saisons, setSaisons] = useState(['SS24', 'FW24', 'SS25', 'FW25', 'SS26', 'FW26'])
  const [nouvelleSaison, setNouvelleSaison] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [confirmSuppr, setConfirmSuppr] = useState(null)

  useEffect(() => {
    if (auth) chargerDonnees()
  }, [auth])

  const chargerDonnees = async () => {
    const { data: p } = await supabase.from('produits').select('*').order('saison')
    const { data: c } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: cmd } = await supabase.from('commandes').select('*').order('created_at', { ascending: false })
    if (p) setProduits(p)
    if (c) setClients(c)
    if (cmd) setCommandes(cmd)
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (pwd === ADMIN_PASSWORD) setAuth(true)
    else setError('Mot de passe incorrect')
  }

  const toggleActif = async (id, actif) => {
    await supabase.from('produits').update({ actif: !actif }).eq('id', id)
    chargerDonnees()
  }

  const supprimerProduit = async (id) => {
    await supabase.from('produits').delete().eq('id', id)
    setConfirmSuppr(null)
    chargerDonnees()
  }

  const supprimerCollection = async (s) => {
    await supabase.from('produits').delete().eq('saison', s)
    setConfirmSuppr(null)
    chargerDonnees()
  }

  const ajouterSaison = () => {
    if (!nouvelleSaison || saisons.includes(nouvelleSaison)) return
    setSaisons(p => [...p, nouvelleSaison])
    setSaison(nouvelleSaison)
    setNouvelleSaison('')
  }

  const importerCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!saison) {
      setImportMsg('⚠️ Veuillez sélectionner ou créer une saison avant d\'importer.')
      return
    }
    setImporting(true)
    setImportMsg('')
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const lignes = results.data
        let succes = 0
        let erreurs = 0
        for (const ligne of lignes) {
          const eans = ligne.EAN ? ligne.EAN.split(',').map(e => e.trim()) : []
          const tailles = ligne.TAILLES ? ligne.TAILLES.split(',').map(t => t.trim()) : []
          const { error } = await supabase.from('produits').upsert({
            reference: ligne.REFERENCE,
            ean: eans,
            nom: ligne.NOM,
            coloris: ligne.COLORIS,
            prix: parseFloat(ligne.PRIX) || 0,
            saison: saison,
            tailles: tailles,
            photo_url: ligne.PHOTO_URL || null,
            actif: true,
          }, { onConflict: 'reference' })
          if (error) erreurs++
          else succes++
        }
        setImportMsg(`✅ ${succes} produits importés${erreurs > 0 ? ` — ⚠️ ${erreurs} erreurs` : ''}`)
        setImporting(false)
        chargerDonnees()
        e.target.value = ''
      }
    })
  }

  const saisonsUniques = [...new Set(produits.map(p => p.saison))].filter(Boolean)

  if (!auth) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Administration</h1>
        <p style={styles.subtitle}>La Maison de l'Espadrille</p>
        <form onSubmit={handleLogin} style={styles.form}>
          <input style={styles.input} type="password" placeholder="Mot de passe admin" value={pwd} onChange={e => setPwd(e.target.value)} />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit">Accéder</button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={styles.adminContainer}>
      <div style={styles.adminHeader}>
        <h1 style={styles.adminTitle}>Admin — LME</h1>
        <button style={styles.btnDeconnexion} onClick={() => setAuth(false)}>Déconnexion</button>
      </div>

      <div style={styles.onglets}>
        {['produits', 'clients', 'commandes'].map(o => (
          <button key={o} style={{ ...styles.ongletBtn, ...(onglet === o ? styles.ongletActif : {}) }} onClick={() => setOnglet(o)}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>

      {/* PRODUITS */}
      {onglet === 'produits' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Importer un catalogue</h2>
          <p style={styles.hint}>Format CSV : REFERENCE, EAN, NOM, COLORIS, PRIX, TAILLES, PHOTO_URL</p>
          <p style={styles.hint}>EAN et TAILLES multiples séparés par des virgules.</p>

          <p style={styles.label}>Saison existante</p>
          <select style={styles.input} value={saison} onChange={e => setSaison(e.target.value)}>
            <option value="">-- Choisir une saison --</option>
            {saisons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <p style={styles.label}>Nouvelle saison</p>
          <div style={styles.row}>
            <input style={{ ...styles.input, marginBottom: 0 }} placeholder="Ex: SS27" value={nouvelleSaison} onChange={e => setNouvelleSaison(e.target.value.toUpperCase())} />
            <button style={styles.btnAjouter} onClick={ajouterSaison}>Ajouter</button>
          </div>

          {saison && <p style={styles.saisonActive}>Saison : <strong>{saison}</strong></p>}

          <p style={styles.label}>Fichier CSV</p>
          <input type="file" accept=".csv" style={styles.fileInput} onChange={importerCSV} disabled={importing} />
          {importing && <p style={styles.hint}>Import en cours...</p>}
          {importMsg && <p style={styles.importMsg}>{importMsg}</p>}

          {/* Suppression par collection */}
          {saisonsUniques.length > 0 && (
            <>
              <h2 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>Supprimer une collection</h2>
              {saisonsUniques.map(s => (
                <div key={s} style={styles.ligneCollection}>
                  <div style={styles.ligneInfo}>
                    <div style={styles.ligneNom}>{s}</div>
                    <div style={styles.ligneDetail}>{produits.filter(p => p.saison === s).length} produits</div>
                  </div>
                  <button style={styles.btnSupprimer} onClick={() => setConfirmSuppr({ type: 'collection', saison: s })}>
                    Supprimer
                  </button>
                </div>
              ))}
            </>
          )}

          <h2 style={{ ...styles.sectionTitle, marginTop: '2rem' }}>Produits ({produits.length})</h2>
          {produits.map(p => (
            <div key={p.id} style={styles.ligne}>
              <div style={styles.ligneInfo}>
                <div style={styles.ligneNom}>{p.nom} — {p.coloris}</div>
                <div style={styles.ligneDetail}>{p.reference} · {p.saison} · {p.prix} €</div>
              </div>
              <div style={styles.ligneBtns}>
                <button style={{ ...styles.btnToggle, background: p.actif ? '#27AE60' : '#ccc' }} onClick={() => toggleActif(p.id, p.actif)}>
                  {p.actif ? 'Actif' : 'Inactif'}
                </button>
                <button style={styles.btnSupprimer} onClick={() => setConfirmSuppr({ type: 'produit', id: p.id, nom: `${p.nom} — ${p.coloris}` })}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CLIENTS */}
      {onglet === 'clients' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Clients ({clients.length})</h2>
          {clients.map(c => (
            <div key={c.id} style={styles.ligne}>
              <div style={styles.ligneInfo}>
                <div style={styles.ligneNom}>{c.magasin}</div>
                <div style={styles.ligneDetail}>{c.nom} · {c.email}</div>
                <div style={styles.ligneDetail}>{c.adresse_magasin}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* COMMANDES */}
      {onglet === 'commandes' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Commandes ({commandes.length})</h2>
          {commandes.map(c => (
            <div key={c.id} style={styles.ligne}>
              <div style={styles.ligneInfo}>
                <div style={styles.ligneNom}>Commande du {new Date(c.created_at).toLocaleDateString('fr-FR')}</div>
                <div style={styles.ligneDetail}>{c.total_paires} paires · {Number(c.total_ht).toFixed(2)} € HT</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CONFIRMATION SUPPRESSION */}
      {confirmSuppr && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setConfirmSuppr(null)}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitre}>Confirmer la suppression</h2>
            {confirmSuppr.type === 'produit' && (
              <p style={styles.modalMsg}>Supprimer définitivement <strong>{confirmSuppr.nom}</strong> ?</p>
            )}
            {confirmSuppr.type === 'collection' && (
              <p style={styles.modalMsg}>Supprimer définitivement toute la collection <strong>{confirmSuppr.saison}</strong> ({produits.filter(p => p.saison === confirmSuppr.saison).length} produits) ?</p>
            )}
            <div style={styles.modalBtns}>
              <button style={styles.btnAnnuler} onClick={() => setConfirmSuppr(null)}>Annuler</button>
              <button style={styles.btnConfirmSuppr} onClick={() =>
                confirmSuppr.type === 'produit'
                  ? supprimerProduit(confirmSuppr.id)
                  : supprimerCollection(confirmSuppr.saison)
              }>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#2C1A0E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  card: { background: 'white', borderRadius: '16px', padding: '2.5rem 2rem', width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: '#1A1209', marginBottom: '0.5rem' },
  subtitle: { color: '#9B8B7A', fontSize: '0.9rem', marginBottom: '2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { border: '1px solid #E8DDD0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box', marginBottom: '0.75rem', color: '#1A1209', background: 'white' },
  button: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0.85rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
  error: { color: '#C0392B', fontSize: '0.85rem' },
  adminContainer: { minHeight: '100vh', background: '#F5EFE6' },
  adminHeader: { background: '#1A1209', color: 'white', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  adminTitle: { fontFamily: 'Georgia, serif', fontSize: '1.2rem' },
  btnDeconnexion: { background: 'none', border: '1px solid white', color: 'white', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' },
  onglets: { display: 'flex', background: 'white', borderBottom: '1px solid #E8DDD0' },
  ongletBtn: { flex: 1, padding: '0.85rem', border: 'none', background: 'none', fontSize: '0.9rem', cursor: 'pointer', color: '#9B8B7A' },
  ongletActif: { color: '#1A1209', fontWeight: '700', borderBottom: '2px solid #1A1209' },
  section: { padding: '1.5rem' },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209', marginBottom: '0.75rem' },
  label: { fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9B8B7A', marginBottom: '0.4rem' },
  hint: { fontSize: '0.8rem', color: '#9B8B7A', marginBottom: '0.5rem' },
  row: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' },
  btnAjouter: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1.25rem', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  saisonActive: { fontSize: '0.85rem', color: '#27AE60', marginBottom: '0.75rem' },
  fileInput: { width: '100%', marginBottom: '0.75rem', fontSize: '0.9rem' },
  importMsg: { marginTop: '0.5rem', fontSize: '0.9rem', color: '#27AE60', marginBottom: '1rem' },
  ligneCollection: { background: 'white', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ligne: { background: 'white', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ligneInfo: { flex: 1 },
  ligneNom: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1209' },
  ligneDetail: { fontSize: '0.78rem', color: '#9B8B7A', marginTop: '0.1rem' },
  ligneBtns: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  btnToggle: { color: 'white', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' },
  btnSupprimer: { background: '#FEE2E2', color: '#C0392B', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end' },
  modal: { background: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%' },
  modalTitre: { fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#1A1209', marginBottom: '1rem' },
  modalMsg: { fontSize: '0.9rem', color: '#1A1209', lineHeight: 1.6, marginBottom: '0.75rem' },
  modalBtns: { display: 'flex', gap: '0.75rem', marginTop: '1.5rem' },
  btnAnnuler: { flex: 1, background: '#F5EFE6', color: '#1A1209', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', cursor: 'pointer' },
  btnConfirmSuppr: { flex: 1, background: '#C0392B', color: 'white', border: 'none', borderRadius: '10px', padding: '0.95rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' },
}