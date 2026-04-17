import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function DashboardSolicitante() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    async function cargarCasos() {
      try {
        const res = await fetch(`http://localhost:3000/api/casos/usuario/${usuario?.id}`)
        const data = await res.json()
        setCasos(data)
      } catch (err) {
        console.error('Error al cargar casos:', err)
      } finally {
        setCargando(false)
      }
    }
    if (usuario?.id) cargarCasos()
  }, [usuario])

  return (
    <div style={{ padding: '40px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Hola, {usuario?.nombre} 👋</h2>
        <button onClick={() => { logout(); navigate('/') }}>Cerrar sesión</button>
      </div>

      <button
        onClick={() => navigate('/nuevo-caso')}
        style={{ marginTop: '20px', padding: '12px 24px', fontSize: '16px', cursor: 'pointer' }}
      >
        + Reportar nuevo caso
      </button>

      <h3 style={{ marginTop: '40px' }}>Mis reportes ({casos.length})</h3>

      {cargando && <p style={{ color: '#888' }}>Cargando casos...</p>}

      {!cargando && casos.length === 0 && (
        <p style={{ color: '#888' }}>Aún no has reportado ningún caso.</p>
      )}

      {casos.map(caso => (
        <div key={caso.id} style={{
          border: '1px solid #ddd', borderRadius: '8px',
          padding: '16px', marginTop: '12px'
        }}>
          <strong style={{ textTransform: 'capitalize' }}>{caso.especie}</strong> — {caso.ubicacion}
          <span style={{
            marginLeft: '10px', padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
            background: caso.condicion === 'critica' ? '#fee2e2' : caso.condicion === 'regular' ? '#fef3c7' : '#dcfce7',
            color: caso.condicion === 'critica' ? '#dc2626' : caso.condicion === 'regular' ? '#d97706' : '#16a34a'
          }}>
            {caso.condicion}
          </span>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#555' }}>{caso.motivo}</p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>
            Estado: {caso.estado} · Puntaje de urgencia: {caso.puntaje_urgencia} pts
          </p>
        </div>
      ))}
    </div>
  )
}