import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [params] = useSearchParams()

  const [rol, setRol] = useState(params.get('rol') || '')
  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rol) { setError('Selecciona si eres Solicitante o Voluntario'); return }
    if (!form.correo || !form.contrasena) { setError('Ingresa tu correo y contrasena'); return }

    setCargando(true)
    setError('')
    const resultado = await login(form.correo, form.contrasena)

    if (!resultado.ok) {
      setError(resultado.mensaje)
      setCargando(false)
      return
    }
    if (resultado.rol !== rol) {
      setError(`Esta cuenta es de ${resultado.rol === 'solicitante' ? 'Solicitante' : 'Voluntario'}, selecciona el rol correcto`)
      setCargando(false)
      return
    }
    navigate(`/dashboard/${resultado.rol}`)
  }

  const estiloBtn = (valor) => ({
    flex: 1, padding: '13px', fontSize: '15px', fontWeight: 'bold',
    cursor: 'pointer',
    border: rol === valor ? '2px solid #2563eb' : '2px solid #e5e7eb',
    borderRadius: '10px',
    background: rol === valor ? '#eff6ff' : '#fff',
    color: rol === valor ? '#2563eb' : '#374151',
    transition: 'all 0.15s',
  })

  const estiloInput = {
    padding: '12px', borderRadius: '8px',
    border: '1px solid #e2e8f0', fontSize: '15px',
    width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '40px', width: '100%', maxWidth: '420px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>Patas ConectaTech</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            Inicia sesión en tu cuenta
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button type="button" onClick={() => { setRol('solicitante'); setError('') }} style={estiloBtn('solicitante')}>
            🙋 Solicitante
          </button>
          <button type="button" onClick={() => { setRol('voluntario'); setError('') }} style={estiloBtn('voluntario')}>
            🤝 Voluntario
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            name="correo" type="email" placeholder="Correo electronico"
            value={form.correo} onChange={handleChange} style={estiloInput}
          />
          <input
            name="contrasena" type="password" placeholder="Contrasena"
            value={form.contrasena} onChange={handleChange} style={estiloInput}
          />

          {error && (
            <p style={{
              margin: 0, color: '#dc2626', fontSize: '13px',
              background: '#fef2f2', padding: '10px', borderRadius: '8px'
            }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={cargando} style={{
            padding: '13px', fontSize: '16px', fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
            background: cargando ? '#94a3b8' : '#303852',
            color: '#fff', border: 'none', borderRadius: '8px', marginTop: '4px'
          }}>
            {cargando ? 'Cargando...' : 'Entrar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          ¿No tienes cuenta?{' '}
          <span
            onClick={() => navigate(`/registro${rol ? `?rol=${rol}` : ''}`)}
            style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Registrarse
          </span>
        </p>
      </div>
    </div>
  )
}



