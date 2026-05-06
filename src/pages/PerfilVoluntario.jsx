import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ESPECIALIDADES = [
  { value: 'ciudadano',             label: 'Ciudadano en general' },
  { value: 'estudiante_veterinaria',label: 'Estudiante de Veterinaria' },
  { value: 'veterinario',           label: 'Veterinario titulado' },
  { value: 'estudiante_medicina',   label: 'Estudiante de Medicina' },
  { value: 'medico',                label: 'Medico' },
  { value: 'otro_profesional',      label: 'Otro profesional de salud' },
]

const DISPONIBILIDAD = [
  { value: 'mananas',   label: 'Mañanas' },
  { value: 'tardes',    label: 'Tardes' },
  { value: 'noches',    label: 'Noches' },
  { value: 'fines',     label: 'Fines de semana' },
  { value: 'cualquier', label: 'Cualquier horario' },
]

const ACTIVIDADES = [
  { value: 'transporte',           label: '🚗 Transporte' },
  { value: 'croquetas',            label: '🥣 Alimento / Croquetas' },
  { value: 'adopcion',             label: '🏡 Adopcion' },
  { value: 'hogar_temporal',       label: '🛏️ Hogar temporal' },
  { value: 'donacion',             label: '💰 Donacion economica' },
  { value: 'atencion_veterinaria', label: '🩺 Atencion veterinaria' },
  { value: 'rescate',              label: '🆘 Rescate' },
]

// Que actividades se recomiendan por especialidad
const ACTIVIDADES_POR_ESPECIALIDAD = {
  ciudadano:              ['transporte','croquetas','adopcion','hogar_temporal','donacion','rescate'],
  estudiante_veterinaria: ['atencion_veterinaria','rescate','transporte','croquetas'],
  veterinario:            ['atencion_veterinaria','rescate'],
  estudiante_medicina:    ['atencion_veterinaria','rescate','croquetas'],
  medico:                 ['atencion_veterinaria','rescate'],
  otro_profesional:       ['atencion_veterinaria','rescate','croquetas'],
}

export default function PerfilVoluntario() {
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    especialidad: '',
    disponibilidad: '',
    actividades: [],
  })
  const [guardado, setGuardado] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Cargar perfil existente si ya tiene uno
  useEffect(() => {
    async function cargarPerfil() {
      try {
        const res = await fetch(`http://localhost:3000/api/voluntarios/perfil/${usuario?.id}`)
        const data = await res.json()
        if (data) {
          setForm({
            especialidad: data.especialidad || '',
            disponibilidad: data.disponibilidad || '',
            actividades: data.actividades || [],
          })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCargando(false)
      }
    }
    if (usuario?.id) cargarPerfil()
  }, [usuario])

  // Al cambiar especialidad, pre-seleccionar actividades recomendadas
  function handleEspecialidad(e) {
    const esp = e.target.value
    const recomendadas = ACTIVIDADES_POR_ESPECIALIDAD[esp] || []
    setForm({ ...form, especialidad: esp, actividades: recomendadas })
  }

  function handleActividad(value) {
    const ya = form.actividades.includes(value)
    setForm({
      ...form,
      actividades: ya
        ? form.actividades.filter(a => a !== value)
        : [...form.actividades, value]
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.especialidad) {
      setError('Selecciona tu especialidad')
      return
    }
    if (form.actividades.length === 0) {
      setError('Selecciona al menos una actividad de interes')
      return
    }
    setError('')

    const res = await fetch('http://localhost:3000/api/voluntarios/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_usuario: usuario?.id,
        especialidad: form.especialidad,
        disponibilidad: form.disponibilidad,
        actividades: form.actividades,
      })
    })

    const data = await res.json()
    if (data.ok) {
      setGuardado(true)
      setTimeout(() => navigate('/dashboard/voluntario'), 1500)
    } else {
      setError(data.mensaje)
    }
  }

  const inp = {
    padding: '8px', borderRadius: '4px',
    border: '1px solid #ccc', width: '100%', boxSizing: 'border-box'
  }

  if (cargando) return <p style={{ padding: '40px' }}>Cargando...</p>

  return (
    <div style={{ maxWidth: '560px', margin: '40px auto', padding: '0 20px' }}>
      <h2>🙋 Mi perfil de voluntario</h2>
      <p style={{ color: '#555', marginBottom: '24px' }}>
        Completa tu perfil para que el sistema identifique los casos donde puedes ser mas util.
      </p>

      {guardado && (
        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>
          ✅ Perfil guardado. Redirigiendo...
        </div>
      )}

      {error && (
        <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
            Especialidad *
          </label>
          <select value={form.especialidad} onChange={handleEspecialidad} style={inp}>
            <option value="">Selecciona tu perfil</option>
            {ESPECIALIDADES.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          {form.especialidad && (
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Las actividades recomendadas para tu perfil fueron pre-seleccionadas. Puedes ajustarlas.
            </p>
          )}
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
            Disponibilidad
          </label>
          <select value={form.disponibilidad} onChange={e => setForm({ ...form, disponibilidad: e.target.value })} style={inp}>
            <option value="">Selecciona tu disponibilidad</option>
            {DISPONIBILIDAD.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
            Actividades en las que puedes ayudar *
          </label>
          {ACTIVIDADES.map(act => (
            <label key={act.value} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', marginBottom: '6px',
              border: form.actividades.includes(act.value) ? '2px solid #7c3aed' : '1px solid #e5e7eb',
              borderRadius: '8px', cursor: 'pointer',
              background: form.actividades.includes(act.value) ? '#ede9fe' : '#fff'
            }}>
              <input
                type="checkbox"
                checked={form.actividades.includes(act.value)}
                onChange={() => handleActividad(act.value)}
              />
              {act.label}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            flex: 1, padding: '12px', fontSize: '16px',
            cursor: 'pointer', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: '8px'
          }}>
            Guardar perfil
          </button>
          <button type="button" onClick={() => navigate('/dashboard/voluntario')} style={{
            padding: '12px 20px', cursor: 'pointer',
            border: '1px solid #ccc', borderRadius: '8px', background: '#fff'
          }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}