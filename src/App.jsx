import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CasosProvider } from './context/CasosContext'
import SelectRol from './pages/SelectRol'
import Registro from './pages/Registro'
import Login from './pages/Login'
import DashboardSolicitante from './pages/DashboardSolicitante'
import DashboardVoluntario from './pages/DashboardVoluntario'
import NuevoCaso from './pages/NuevoCaso'
import PerfilVoluntario from './pages/PerfilVoluntario'

function RutaProtegida({ children, rolRequerido }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/" />
  if (rolRequerido && usuario.rol !== rolRequerido) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <CasosProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<SelectRol />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard/solicitante" element={
              <RutaProtegida rolRequerido="solicitante">
                <DashboardSolicitante />
              </RutaProtegida>
            } />
            <Route path="/dashboard/voluntario" element={
              <RutaProtegida rolRequerido="voluntario">
                <DashboardVoluntario />
              </RutaProtegida>
            } />
            <Route path="/nuevo-caso" element={
              <RutaProtegida rolRequerido="solicitante">
                <NuevoCaso />
              </RutaProtegida>
            } />
            <Route path="/perfil/voluntario" element={
              <RutaProtegida rolRequerido="voluntario">
                <PerfilVoluntario />
              </RutaProtegida>
            } />
          </Routes>
        </BrowserRouter>
      </CasosProvider>
    </AuthProvider>
  )
}