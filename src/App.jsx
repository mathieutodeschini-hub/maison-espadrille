import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Inscription from './pages/Inscription'
import Accueil from './pages/Accueil'
import Catalogue from './pages/Catalogue'
import Recherche from './pages/Recherche'
import Panier from './pages/Panier'
import Historique from './pages/Historique'
import Admin from './pages/Admin'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#2C1A0E', color: 'white', fontFamily: 'Georgia, serif', fontSize: '1.2rem' }}>
      La Maison de l'Espadrille
    </div>
  )

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/accueil" />} />
        <Route path="/inscription" element={!session ? <Inscription /> : <Navigate to="/accueil" />} />
        <Route path="/accueil" element={session ? <Accueil /> : <Navigate to="/login" />} />
        <Route path="/catalogue" element={session ? <Catalogue /> : <Navigate to="/login" />} />
        <Route path="/recherche" element={session ? <Recherche /> : <Navigate to="/login" />} />
        <Route path="/panier" element={session ? <Panier /> : <Navigate to="/login" />} />
        <Route path="/historique" element={session ? <Historique /> : <Navigate to="/login" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to={session ? "/accueil" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App