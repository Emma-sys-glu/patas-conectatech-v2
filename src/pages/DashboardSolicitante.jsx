import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const TIPOS_APOYO = [
  { value: 'transporte', label: 'Transporte' },
  { value: 'croquetas', label: 'Croquetas / Insumos' },
  { value: 'adopcion', label: 'Adopcion' },
  { value: 'hogar_temporal', label: 'Hogar Temporal' },
  { value: 'donacion', label: 'Donacion' },
  { value: 'atencion_veterinaria', label: 'Atencion Veterinaria' },
  { value: 'rescate', label: 'Rescate' },
]

function estadoColor(estado) {
  if (estado === 'resuelto') return { bg: '#dcfce7', color: '#16a34a', texto: '✅ Resuelto' }
  if (estado === 'en atencion') return { bg: '#dbeafe', color: '#2563eb', texto: '🔵 En atencion' }
  return { bg: '#f3f4f6', color: '#6b7280', texto: '⏳ Activo' }
}

export default function DashboardSolicitante() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ayudasPorCaso, setAyudasPorCaso] = useState({})
  const [resolviendo, setResolviendo] = useState({})

  useEffect(() => {
    if (usuario?.id) cargarTodo()
  }, [usuario])

  async function cargarTodo() {
    setCargando(true)
    try {
      const res = await fetch(`http://localhost:3000/api/casos/usuario/${usuario.id}`)
      const data = await res.json()
      setCasos(data)
      await cargarAyudas(data)
    } catch (err) {
      console.error(err)
    } finally {
      setCargando(false)
    }
  }

  async function cargarAyudas(listaCasos) {
    const mapa = {}
    await Promise.all(listaCasos.map(async (caso) => {
      try {
        const res = await fetch(`http://localhost:3000/api/casos/${caso.id}/detalle-ayudas`)
        const data = await res.json()
        mapa[caso.id] = data
      } catch {
        mapa[caso.id] = []
      }
    }))
    setAyudasPorCaso(mapa)
  }

  async function marcarResuelto(idCaso) {
    setResolviendo(prev => ({ ...prev, [idCaso]: true }))
    try {
      const res = await fetch(`http://localhost:3000/api/casos/${idCaso}/resolver`, {
        method: 'PATCH'
      })
      const data = await res.json()
      if (data.ok) {
        setCasos(prev =>
          prev.map(c => c.id === idCaso ? { ...c, estado: 'resuelto' } : c)
        )
      } else {
        alert(data.mensaje)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setResolviendo(prev => ({ ...prev, [idCaso]: false }))
    }
  }

  // Separar casos activos/en atencion de resueltos
  const casosActivos = casos.filter(c => c.estado !== 'resuelto')
  const casosResueltos = casos.filter(c => c.estado === 'resuelto')

  function renderTarjeta(caso) {
    const ayudas = ayudasPorCaso[caso.id] || []
    const tiposAyudaCubiertos = ayudas.map(a => a.tipo_ayuda)
    const estad = estadoColor(ayudas.length > 0 && caso.estado !== 'resuelto' ? 'en atencion' : caso.estado)
    const estadoReal = ayudas.length > 0 && caso.estado !== 'resuelto' ? 'en atencion' : caso.estado
    const estilo = estadoColor(estadoReal)

    return (
      <div key={caso.id} style={{
        border: '1px solid #e5e7eb', borderRadius: '12px',
        padding: '20px', marginBottom: '16px', background: '#fff',
        opacity: caso.estado === 'resuelto' ? 0.75 : 1
      }}>

        {/* Header tarjeta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '17px', textTransform: 'capitalize' }}>{caso.especie}</strong>
            <span style={{
              padding: '2px 10px', borderRadius: '12px', fontSize: '12px',
              background: caso.condicion === 'critica' ? '#fee2e2' : caso.condicion === 'regular' ? '#fef3c7' : '#dcfce7',
              color: caso.condicion === 'critica' ? '#dc2626' : caso.condicion === 'regular' ? '#d97706' : '#16a34a'
            }}>{caso.condicion}</span>
          </div>
          {/* Badge de estado */}
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
            fontWeight: 'bold', background: estilo.bg, color: estilo.color
          }}>
            {estilo.texto}
          </span>
        </div>

        <p style={{ margin: '10px 0 4px', color: '#374151' }}>📍 {caso.ubicacion}</p>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>{caso.motivo}</p>

        {/* Tipos de apoyo requeridos con indicador de cubierto */}
        <div style={{ marginTop: '14px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 'bold', color: '#374151' }}>
            Tipos de apoyo requeridos:
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {caso.tipo_apoyo.map(t => {
              const cubierto = tiposAyudaCubiertos.includes(t)
              return (
                <span key={t} style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
                  fontWeight: cubierto ? 'bold' : 'normal',
                  background: cubierto ? '#dcfce7' : '#f3f4f6',
                  color: cubierto ? '#16a34a' : '#6b7280',
                  border: cubierto ? '1px solid #86efac' : '1px solid #e5e7eb'
                }}>
                  {cubierto ? '✓ ' : ''}{TIPOS_APOYO.find(x => x.value === t)?.label || t}
                </span>
              )
            })}
          </div>
        </div>

        {/* Detalle de voluntarios */}
        {ayudas.length > 0 && (
          <div style={{
            marginTop: '14px', padding: '12px', borderRadius: '8px',
            background: '#f0f9ff', border: '1px solid #bae6fd'
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 'bold', color: '#0369a1' }}>
              👥 {ayudas.length} voluntario{ayudas.length !== 1 ? 's' : ''} ayudando:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ayudas.map((a, i) => (
                <p key={i} style={{ margin: 0, fontSize: '13px', color: '#0c4a6e' }}>
                  • <strong>{a.nombre_voluntario}</strong> — {TIPOS_APOYO.find(x => x.value === a.tipo_ayuda)?.label || a.tipo_ayuda}
                </p>
              ))}
            </div>
          </div>
        )}

        {ayudas.length === 0 && caso.estado !== 'resuelto' && (
          <p style={{ margin: '14px 0 0', fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
            Aun no hay voluntarios ayudando en este caso.
          </p>
        )}

        {/* Boton marcar resuelto */}
        {caso.estado !== 'resuelto' && (
          <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
            <button
              onClick={() => marcarResuelto(caso.id)}
              disabled={resolviendo[caso.id]}
              style={{
                padding: '8px 20px', fontSize: '13px', cursor: 'pointer',
                background: '#fff', color: '#16a34a',
                border: '1px solid #86efac', borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              {resolviendo[caso.id] ? 'Guardando...' : '✅ Marcar como resuelto'}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '720px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>Hola, {usuario?.nombre} </h2>
        <button onClick={() => { logout(); navigate('/') }}
          style={{
            marginTop: '16px', marginBottom: '32px',
            padding: '12px 24px', fontSize: '15px',
            cursor: 'pointer', background: '#303852',
            color: '#fff', border: 'none', borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Cerrar sesión</button>
      </div>

      <button
        onClick={() => navigate('/nuevo-caso')}
        style={{
          marginTop: '16px', marginBottom: '32px',
          padding: '12px 24px', fontSize: '15px',
          cursor: 'pointer', background: '#303852',
          color: '#fff', border: 'none', borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        + Reportar nuevo caso
      </button>

      {cargando && <p style={{ color: '#888' }}>Cargando tus casos...</p>}

      {/* Casos activos */}
      {!cargando && casosActivos.length === 0 && casosResueltos.length === 0 && (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
          Aun no has reportado ningun caso.
        </p>
      )}

      {casosActivos.length > 0 && (
        <>
          <h3 style={{ color: '#374151', marginBottom: '16px' }}>
            Casos activos ({casosActivos.length})
          </h3>
          {casosActivos.map(renderTarjeta)}
        </>
      )}

      {/* Casos resueltos */}
      {casosResueltos.length > 0 && (
        <>
          <h3 style={{ color: '#6b7280', marginTop: '32px', marginBottom: '16px' }}>
            Casos resueltos ({casosResueltos.length})
          </h3>
          {casosResueltos.map(renderTarjeta)}
        </>
      )}
    </div>
  )
}
