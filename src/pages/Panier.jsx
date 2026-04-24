import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const FRANCO = 1500
const MIN_PAIRES = 10

export default function Panier() {
  const [panier] = useState(() => {
    try {
      const s = localStorage.getItem('panier')
      return s ? JSON.parse(s) : []
    } catch { return [] }
  })
  const navigate = useNavigate()

  const totalPaires = panier.reduce((sum, l) =>
    sum + Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0), 0)

  const totalHT = panier.reduce((sum, l) => {
    const qty = Object.values(l.qtys || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)
    return sum + qty * (l.prix || 0)
  }, 0)

  return (
    <div style={{ minHeight: '100vh', background: '#F5EFE6', paddingBottom: '100px' }}>
      <div style={{ background: 'white', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate('/accueil')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8B6F47', fontSize: '1rem' }}>← Retour</button>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#1A1209' }}>Mon panier</h1>
      </div>

      <div style={{ padding: '1rem' }}>
        <p style={{ color: '#1A1209', marginBottom: '1rem' }}>{panier.length} article(s) — {totalPaires} paires — {totalHT.toFixed(2)} € HT</p>

        {panier.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9B8B7A' }}>
            <p style={{ fontSize: '3rem' }}>🛒</p>
            <p>Votre panier est vide</p>
            <button onClick={() => navigate('/catalogue')} style={{ marginTop: '1rem', background: '#1A1209', color: 'white', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
              Parcourir le catalogue
            </button>
          </div>
        )}

        {panier.map(l => (
          <div key={l.id} style={{ background: 'white', borderRadius: '12px', padding: '1rem', marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: '600', color: '#1A1209' }}>{l.nom} — {l.coloris}</p>
            <p style={{ fontSize: '0.8rem', color: '#9B8B7A' }}>{l.reference}</p>
          </div>
        ))}
      </div>

      {/* Navbar manuelle temporaire */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', display: 'flex', borderTop: '1px solid #E8DDD0', zIndex: 10 }}>
        <button onClick={() => navigate('/accueil')} style={{ flex: 1, background: 'none', border: 'none', padding: '0.75rem', fontSize: '0.65rem', cursor: 'pointer', color: '#9B8B7A' }}>🏠 Accueil</button>
        <button onClick={() => navigate('/catalogue')} style={{ flex: 1, background: 'none', border: 'none', padding: '0.75rem', fontSize: '0.65rem', cursor: 'pointer', color: '#9B8B7A' }}>📦 Catalogue</button>
        <button onClick={() => navigate('/recherche')} style={{ flex: 1, background: 'none', border: 'none', padding: '0.75rem', fontSize: '0.65rem', cursor: 'pointer', color: '#9B8B7A' }}>🔍 Recherche</button>
        <button style={{ flex: 1, background: 'none', border: 'none', padding: '0.75rem', fontSize: '0.65rem', cursor: 'pointer', color: '#1A1209', fontWeight: '700' }}>🛒 Panier</button>
        <button onClick={() => navigate('/historique')} style={{ flex: 1, background: 'none', border: 'none', padding: '0.75rem', fontSize: '0.65rem', cursor: 'pointer', color: '#9B8B7A' }}>📋 Historique</button>
      </div>
    </div>
  )
}