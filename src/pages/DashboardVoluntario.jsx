import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const TIPOS_APOYO = [
  { value: '', label: 'Todos los casos' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'croquetas', label: 'Croquetas / Insumos' },
  { value: 'adopcion', label: 'Adopcion' },
  { value: 'hogar_temporal', label: 'Hogar Temporal' },
  { value: 'donacion', label: 'Donacion' },
  { value: 'atencion_veterinaria', label: 'Atencion Veterinaria' },
  { value: 'rescate', label: 'Rescate' },
]

const BOTONES_AYUDA = [
  { value: 'donacion', label: '💰 Puedo Donar' },
  { value: 'transporte', label: '🚗 Ofrezco Transporte' },
  { value: 'hogar_temporal', label: '🏠 Puedo Cuidar Temporalmente' },
  { value: 'croquetas', label: '🥣 Ofrezco Alimento' },
  { value: 'atencion_veterinaria', label: '🩺 Ofrezco Atencion Veterinaria' },
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
  return `Hace ${dias} dia${dias > 1 ? 's' : ''}`
}

export default function DashboardVoluntario() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [casos, setCasos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [ayudas, setAyudas] = useState({})
  const [registrando, setRegistrando] = useState({})
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    async function cargarTodo() {
      try {
        // Cargar casos
        const res = await fetch('http://localhost:3000/api/casos')
        const data = await res.json()
        setCasos(data)

        // Cargar ayudas del voluntario para cada caso
        await cargarAyudas(data)

        // Cargar perfil del voluntario
        const resPerfil = await fetch(`http://localhost:3000/api/voluntarios/perfil/${usuario?.id}`)
        const dataPerfil = await resPerfil.json()
        setPerfil(dataPerfil)
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    cargarTodo()
  }, [])

  async function cargarAyudas(listaCasos) {
    const estado = {}
    await Promise.all(listaCasos.map(async (caso) => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/casos/${caso.id}/ayudas?id_voluntario=${usuario?.id}`
        )
        const data = await res.json()
        estado[caso.id] = data
      } catch {
        estado[caso.id] = { total_ayudas: 0, ya_ayudo: null }
      }
    }))
    setAyudas(estado)
  }

  async function registrarAyuda(idCaso, tipoAyuda) {
    setRegistrando(prev => ({ ...prev, [idCaso]: true }))
    try {
      const res = await fetch(`http://localhost:3000/api/casos/${idCaso}/ayuda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_voluntario: usuario?.id,
          tipo_ayuda: tipoAyuda
        })
      })
      const data = await res.json()
      if (data.ok) {
        setAyudas(prev => ({
          ...prev,
          [idCaso]: { total_ayudas: data.total_ayudas, ya_ayudo: tipoAyuda }
        }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRegistrando(prev => ({ ...prev, [idCaso]: false }))
    }
  }

  function esCompatible(caso) {
    if (!perfil || !perfil.actividades) return false
    return caso.tipo_apoyo.some(t => perfil.actividades.includes(t))
  }

  const casosFiltrados = casos
    .filter(c => filtro === '' || c.tipo_apoyo.includes(filtro))
    .sort((a, b) => b.puntaje_urgencia - a.puntaje_urgencia)

  return (
    <div style={{ padding: '40px', maxWidth: '780px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>Hola, {usuario?.nombre} 👋</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/perfil/voluntario')}
            style={{
              padding: '8px 16px', cursor: 'pointer',
              background: '#7c3aed', color: '#fff',
              border: 'none', borderRadius: '6px'
            }}>
            Mi perfil
          </button>
          <button onClick={() => { logout(); navigate('/') }}>
            Cerrar sesion
          </button>
        </div>
      </div>

      <p style={{ color: '#555' }}>Casos activos ordenados por urgencia</p>

      {/* Filtro */}
      <div style={{ marginTop: '16px', marginBottom: '24px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filtrar por tipo de apoyo:</label>
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
          {TIPOS_APOYO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {cargando && <p style={{ color: '#888' }}>Cargando casos...</p>}

      {!cargando && casosFiltrados.length === 0 && (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
          No hay casos activos{filtro ? ' con ese tipo de apoyo' : ''}.
        </p>
      )}

      {/* Tarjetas de casos */}
      {casosFiltrados.map(caso => {
        const badge = badgeUrgencia(caso.puntaje_urgencia)
        const compatible = esCompatible(caso)
        const ayudaCaso = ayudas[caso.id] || { total_ayudas: 0, ya_ayudo: null }
        const yaRegistro = ayudaCaso.ya_ayudo
        const estaRegistrando = registrando[caso.id]

        return (
          <div key={caso.id} style={{
            border: `2px solid ${compatible ? '#a78bfa' : '#e5e7eb'}`,
            borderRadius: '10px', padding: '20px', marginBottom: '20px',
            background: '#fff', position: 'relative'
          }}>

            {compatible && (
              <span style={{
                position: 'absolute', top: '12px', right: '12px',
                background: '#ede9fe', color: '#7c3aed',
                padding: '2px 10px', borderRadius: '12px',
                fontSize: '12px', fontWeight: 'bold'
              }}>
                ⭐ Compatible
              </span>
            )}

            {/* Info principal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '18px', textTransform: 'capitalize' }}>{caso.especie}</strong>
              <span style={{
                padding: '2px 10px', borderRadius: '12px', fontSize: '12px',
                background: caso.condicion === 'critica' ? '#fee2e2' : caso.condicion === 'regular' ? '#fef3c7' : '#dcfce7',
                color: caso.condicion === 'critica' ? '#dc2626' : caso.condicion === 'regular' ? '#d97706' : '#16a34a'
              }}>{caso.condicion}</span>
              <span style={{
                padding: '2px 10px', borderRadius: '12px', fontSize: '13px',
                fontWeight: 'bold', background: badge.fondo, color: badge.color
              }}>{badge.texto}</span>
            </div>

            <p style={{ margin: '10px 0 4px', color: '#374151' }}>📍 {caso.ubicacion}</p>
            <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
              🕐 {tiempoTranscurrido(caso.fecha_reporte)}
            </p>
            <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>
              👥 {ayudaCaso.total_ayudas} voluntario{ayudaCaso.total_ayudas !== 1 ? 's' : ''} ayudando
            </p>

            {/* Tipos de apoyo requerido */}
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {caso.tipo_apoyo.map(t => (
                <span key={t} style={{
                  padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                  background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb'
                }}>
                  {TIPOS_APOYO.find(x => x.value === t)?.label || t}
                </span>
              ))}
            </div>

            <p style={{ margin: '10px 0 0', fontSize: '14px', color: '#4b5563' }}>{caso.motivo}</p>

            {/* Botones de ayuda */}
            <div style={{ marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '14px' }}>
              {yaRegistro ? (
                <div style={{
                  background: '#dcfce7', color: '#16a34a', padding: '10px 16px',
                  borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', textAlign: 'center'
                }}>
                  ✅ Ayuda registrada: {BOTONES_AYUDA.find(b => b.value === yaRegistro)?.label || yaRegistro}
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>
                    ¿Como puedes ayudar?
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {BOTONES_AYUDA.map(btn => (
                      <button
                        key={btn.value}
                        disabled={estaRegistrando}
                        onClick={() => registrarAyuda(caso.id, btn.value)}
                        style={{
                          padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
                          border: '1px solid #d1d5db', borderRadius: '8px',
                          background: estaRegistrando ? '#f3f4f6' : '#fff',
                          color: '#374151', transition: 'all 0.15s'
                        }}
                        onMouseOver={e => { if (!estaRegistrando) e.target.style.background = '#f3f4f6' }}
                        onMouseOut={e => { if (!estaRegistrando) e.target.style.background = '#fff' }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )
      })}
    </div>
  )
}
