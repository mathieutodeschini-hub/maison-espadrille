import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Scanner() {
  const [statut, setStatut] = useState('scan')
  const [produit, setProduit] = useState(null)
  const [qtys, setQtys] = useState({})
  const [panier, setPanier] = useState([])
  const [eanManuel, setEanManuel] = useState('')
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectingRef = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    const panierSauvegarde = localStorage.getItem('panier')
    if (panierSauvegarde) setPanier(JSON.parse(panierSauvegarde))
    demarrerCamera()
    return () => arreterCamera()
  }, [])

  const demarrerCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
      detectingRef.current = true
      lancerDetection()
    } catch {
      setStatut('erreur')
    }
  }

  const arreterCamera = () => {
    detectingRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
  }

  const lancerDetection = async () => {
    if (!('BarcodeDetector' in window)) return

    const detector = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
    })

    const loop = async () => {
      if (!detectingRef.current || !videoRef.current) return
      if (videoRef.current.readyState === 4) {
        try {
          const codes = await detector.detect(videoRef.current)
          if (codes.length > 0) {
            const ean = codes[0].rawValue
            setEanManuel(ean)
            detectingRef.current = false
            arreterCamera()
            setScanning(false)
            await chercheProduit(ean)
            return
          }
        } catch {}
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  const chercheProduit = async (ean) => {
    setStatut('recherche')
    const { data } = await supabase
      .from('produits')
      .select('*')
      .contains('ean', [ean.trim()])
      .single()

    if (data) {
      setProduit(data)
      const ligne = panier.find(l => l.id === data.id)
      setQtys(ligne ? { ...ligne.qtys } : {})
      setStatut('trouve')
    } else {
      setStatut('introuvable')
    }
  }

  const soumettreEanManuel = (e) => {
    e.preventDefault()
    if (eanManuel.trim()) {
      arreterCamera()
      setScanning(false)
      chercheProduit(eanManuel.trim())
    }
  }

  const validerProduit = () => {
    const totalQty = Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)
    let nouveauPanier
    if (totalQty === 0) {
      nouveauPanier = panier.filter(l => l.id !== produit.id)
    } else {
      const existe = panier.find(l => l.id === produit.id)
      if (existe) {
        nouveauPanier = panier.map(l => l.id === produit.id ? { ...l, qtys } : l)
      } else {
        nouveauPanier = [...panier, { ...produit, qtys }]
      }
    }
    localStorage.setItem('panier', JSON.stringify(nouveauPanier))
    navigate('/catalogue')
  }

  const rescan = () => {
    setProduit(null)
    setQtys({})
    setEanManuel('')
    setStatut('scan')
    setTimeout(demarrerCamera, 300)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnRetour} onClick={() => { arreterCamera(); navigate('/catalogue') }}>← Retour</button>
        <h1 style={styles.titre}>Scanner un produit</h1>
      </div>

      {statut === 'scan' && (
        <div style={styles.scanZone}>
          <div style={styles.videoWrapper}>
            <video ref={videoRef} autoPlay playsInline muted style={styles.video} />
            <div style={styles.viseur} />
            {scanning && <div style={styles.scanLine} />}
          </div>
          <p style={styles.hint}>Pointez la caméra vers le code-barres</p>

          <form onSubmit={soumettreEanManuel} style={styles.formManuel}>
            <div style={styles.inputRow}>
              <input
                style={styles.inputEan}
                type="number"
                placeholder="Ou saisir le code EAN..."
                value={eanManuel}
                onChange={e => setEanManuel(e.target.value)}
              />
              <button style={styles.btnRecherche} type="submit">→</button>
            </div>
          </form>
        </div>
      )}

      {statut === 'recherche' && (
        <div style={styles.centre}>
          <div style={styles.emoji}>🔎</div>
          <p style={styles.message}>Recherche en cours...</p>
        </div>
      )}

      {statut === 'erreur' && (
        <div style={styles.centre}>
          <div style={styles.emoji}>📵</div>
          <p style={styles.message}>Caméra inaccessible</p>
          <p style={styles.hint}>Vérifiez les autorisations dans Réglages → Safari → Caméra</p>
          <form onSubmit={soumettreEanManuel} style={styles.formManuel}>
            <div style={styles.inputRow}>
              <input
                style={styles.inputEan}
                type="number"
                placeholder="Saisir le code EAN manuellement"
                value={eanManuel}
                onChange={e => setEanManuel(e.target.value)}
              />
              <button style={styles.btnRecherche} type="submit">→</button>
            </div>
          </form>
          <button style={styles.btnSecondaire} onClick={() => navigate('/catalogue')}>Retour au catalogue</button>
        </div>
      )}

      {statut === 'introuvable' && (
        <div style={styles.centre}>
          <div style={styles.emoji}>🔍</div>
          <p style={styles.message}>Produit introuvable</p>
          <p style={styles.hint}>Code scanné : <strong>{eanManuel}</strong></p>
          <p style={styles.hint}>Ce code EAN ne correspond à aucun produit du catalogue.</p>
          <button style={styles.btn} onClick={rescan}>Scanner à nouveau</button>
          <button style={styles.btnSecondaire} onClick={() => navigate('/catalogue')}>Retour au catalogue</button>
        </div>
      )}

      {statut === 'trouve' && produit && (
        <div style={styles.produitContainer}>
          {produit.photo_url
            ? <img src={produit.photo_url} alt={produit.nom} style={styles.photo} />
            : <div style={styles.photoPlaceholder}>👟</div>
          }
          <div style={styles.produitInfo}>
            <div style={styles.produitRef}>{produit.reference}</div>
            <div style={styles.produitNom}>{produit.nom} — {produit.coloris}</div>
            <div style={styles.produitPrix}>{Number(produit.prix).toFixed(2)} € / paire</div>
          </div>

          <div style={styles.sizesGrid}>
            {produit.tailles?.map(t => (
              <div key={t} style={styles.sizeItem}>
                <div style={styles.sizeLabel}>T.{t}</div>
                <input
                  style={styles.sizeInput}
                  type="number"
                  min="0"
                  placeholder="0"
                  value={qtys[t] || ''}
                  onChange={e => setQtys(p => ({ ...p, [t]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <div style={styles.footer}>
            <div style={styles.total}>
              {Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0)} paires —{' '}
              {(Object.values(qtys).reduce((a, b) => a + (parseInt(b) || 0), 0) * produit.prix).toFixed(2)} € HT
            </div>
            <div style={styles.footerBtns}>
              <button style={styles.btnSecondaire} onClick={rescan}>Scanner un autre</button>
              <button style={styles.btn} onClick={validerProduit}>Ajouter au panier</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', background: '#F5EFE6' },
  header: { background: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  btnRetour: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#8B6F47' },
  titre: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' },
  scanZone: { padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  videoWrapper: { position: 'relative', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden', background: '#000', aspectRatio: '4/3' },
  video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  viseur: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px', height: '110px', border: '2px solid rgba(255,255,255,0.9)', borderRadius: '8px', boxShadow: '0 0 0 1000px rgba(0,0,0,0.35)' },
  scanLine: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '2px', background: 'rgba(255,100,100,0.8)', animation: 'none' },
  hint: { fontSize: '0.85rem', color: '#9B8B7A', textAlign: 'center' },
  formManuel: { width: '100%', maxWidth: '400px' },
  inputRow: { display: 'flex', gap: '0.5rem' },
  inputEan: { flex: 1, border: '1px solid #E8DDD0', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
  btnRecherche: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0 1.25rem', fontSize: '1.2rem', cursor: 'pointer' },
  centre: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', gap: '1rem' },
  emoji: { fontSize: '3rem' },
  message: { fontSize: '1.1rem', fontWeight: '700', color: '#1A1209' },
  btn: { background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0.85rem 1.5rem', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '400px' },
  btnSecondaire: { background: 'white', color: '#1A1209', border: '1px solid #E8DDD0', borderRadius: '8px', padding: '0.85rem 1.5rem', fontSize: '0.95rem', cursor: 'pointer', width: '100%', maxWidth: '400px' },
  produitContainer: { padding: '1.5rem' },
  photo: { width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '1rem' },
  photoPlaceholder: { width: '100%', height: '150px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', marginBottom: '1rem' },
  produitInfo: { background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' },
  produitRef: { fontSize: '0.75rem', color: '#9B8B7A', fontWeight: '600' },
  produitNom: { fontSize: '1.1rem', fontWeight: '700', color: '#1A1209', margin: '0.25rem 0' },
  produitPrix: { fontSize: '0.95rem', color: '#8B6F47', fontWeight: '600' },
  sizesGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' },
  sizeItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' },
  sizeLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#9B8B7A' },
  sizeInput: { width: '100%', textAlign: 'center', border: '1px solid #E8DDD0', borderRadius: '6px', padding: '0.5rem 0.25rem', fontSize: '0.9rem', outline: 'none' },
  footer: { background: 'white', borderRadius: '12px', padding: '1rem' },
  total: { fontSize: '0.9rem', color: '#9B8B7A', marginBottom: '0.75rem' },
  footerBtns: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
}