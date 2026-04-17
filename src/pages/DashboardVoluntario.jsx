import { useAuth } from '../context/AuthContext'
import { useCasos } from '../context/CasosContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const TIPOS_APOYO = [
  { value: '', label: 'Todos los casos' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'croquetas', label: 'Croquetas / Insumos' },
  { value: 'adopcion', label: 'Adopción' },
  { value: 'hogar_temporal', label: 'Hogar Temporal' },
  { value: 'donacion', label: 'Donación' },
  { value: 'atencion_veterinaria', label: 'Atención Veterinaria' },
  { value: 'rescate', label: 'Rescate' },
]

function badgeUrgencia(puntaje) {
  if (puntaje >= 70) return { color: '#dc2626', fondo: '#fee2e2', texto: `🔴 ${puntaje} pts` }
  if (puntaje >= 40) return { color: '#d97706', fondo: '#fef3c7', texto: `🟠 ${puntaje} pts` }
  return { color: '#16a34a', fondo: '#dcfce7', texto: `🟢 ${puntaje} pts` }
}

function tiempoTranscurrido(fechaISO) {
  const diff = Date.now() - new Date(fechaISO).getTime()
  const horas = Math.floor(diff / 1000 / 60 / 60)
  if (horas < 1) return 'Hace menos de 1 hora'
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`
  const dias = Math.floor(horas / 24)
  return `Hace ${dias} día${dias > 1 ? 's' : ''}`
}

export default function DashboardVoluntario() {
  const { usuario, logout } = useAuth()
  const { casos } = useCasos()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('')

  // Filtrar y ordenar por urgencia de mayor a menor
  const casosFiltrados = casos
    .filter(c => c.estado === 'activo')
    .filter(c => filtro === '' || c.tipoApoyo.includes(filtro))
    .sort((a, b) => b.puntajeUrgencia - a.puntajeUrgencia)

  // Match: tipos de apoyo del voluntario — por ahora usamos todos como interés
  // Cuando agregues perfil de voluntario, aquí comparas con usuario.intereses
  const interesesVoluntario = usuario?.intereses || TIPOS_APOYO.slice(1).map(t => t.value)

  function esCompatible(caso) {
    return caso.tipoApoyo.some(t => interesesVoluntario.includes(t))
  }

  return (
    <div style={{ padding: '40px', maxWidth: '750px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Hola, {usuario?.nombre} 👋</h2>
        <button onClick={() => { logout(); navigate('/') }}>Cerrar sesión</button>
      </div>
      <p style={{ color: '#555' }}>Casos activos ordenados por urgencia</p>

      {/* Filtro */}
      <div style={{ marginTop: '16px', marginBottom: '24px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filtrar por tipo de apoyo:</label>
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {TIPOS_APOYO.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Lista de casos */}
      {casosFiltrados.length === 0 && (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
          No hay casos activos{filtro ? ' con ese tipo de apoyo' : ''}.
        </p>
      )}

      {casosFiltrados.map(caso => {
        const badge = badgeUrgencia(caso.puntajeUrgencia)
        const compatible = esCompatible(caso)

        return (
          <div key={caso.id} style={{
            border: `2px solid ${compatible ? '#a78bfa' : '#e5e7eb'}`,
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '16px',
            background: '#fff',
            position: 'relative'
          }}>

            {/* Badge compatible */}
            {compatible && (
              <span style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#ede9fe', color: '#7c3aed',
                padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
              }}>
                ⭐ Compatible
              </span>
            )}

            {/* Fila superior */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '18px', textTransform: 'capitalize' }}>
                {caso.especie}
              </strong>

              {/* Badge condición */}
              <span style={{
                padding: '2px 10px', borderRadius: '12px', fontSize: '12px',
                background: caso.condicion === 'critica' ? '#fee2e2' : caso.condicion === 'regular' ? '#fef3c7' : '#dcfce7',
                color: caso.condicion === 'critica' ? '#dc2626' : caso.condicion === 'regular' ? '#d97706' : '#16a34a'
              }}>
                {caso.condicion}
              </span>

              {/* Badge urgencia */}
              <span style={{
                padding: '2px 10px', borderRadius: '12px', fontSize: '13px',
                fontWeight: 'bold', background: badge.fondo, color: badge.color
              }}>
                {badge.texto}
              </span>
            </div>

            {/* Info */}
            <p style={{ margin: '10px 0 4px', color: '#374151' }}>
              📍 {caso.ubicacion}
            </p>
            <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
              🕐 {tiempoTranscurrido(caso.fechaReporte)}
            </p>
            <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
              👥 {caso.voluntariosAyudando.length} voluntario{caso.voluntariosAyudando.length !== 1 ? 's' : ''} ayudando
            </p>

            {/* Tipos de apoyo */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {caso.tipoApoyo.map(t => (
                <span key={t} style={{
                  padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                  background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb'
                }}>
                  {TIPOS_APOYO.find(x => x.value === t)?.label || t}
                </span>
              ))}
            </div>

            {/* Descripción */}
            <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#4b5563' }}>
              {caso.motivo}
            </p>

          </div>
        )
      })}
    </div>
  )
}