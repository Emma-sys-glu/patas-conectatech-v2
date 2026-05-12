import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registro() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { registrar } = useAuth()

  const [rol, setRol] = useState(params.get('rol') || '')
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exitoso, setExitoso] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rol) { setError('Selecciona tu rol'); return }
    if (!form.nombre || !form.correo || !form.contrasena) {
      setError('Todos los campos son obligatorios')
      return
    }
    setCargando(true)
    const resultado = await registrar(form.nombre, form.correo, form.contrasena, rol)
    if (!resultado.ok) { setError(resultado.mensaje); setCargando(false); return }
    setExitoso(true)
    setTimeout(() => navigate('/'), 2000)
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
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>Crear cuenta</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Registrate para empezar</p>
        </div>

        {exitoso && (
          <div style={{
            background: '#dcfce7', color: '#16a34a', padding: '14px',
            borderRadius: '8px', marginBottom: '16px',
            fontWeight: 'bold', textAlign: 'center'
          }}>
            ✅ Cuenta creada. Redirigiendo al login...
          </div>
        )}

        {!exitoso && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button type="button" onClick={() => { setRol('solicitante'); setError('') }} style={estiloBtn('solicitante')}>
                🙋 Solicitante
              </button>
              <button type="button" onClick={() => { setRol('voluntario'); setError('') }} style={estiloBtn('voluntario')}>
                🤝 Voluntario
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input name="nombre" placeholder="Nombre completo"
                value={form.nombre} onChange={handleChange} style={estiloInput} />
              <input name="correo" type="email" placeholder="Correo electronico"
                value={form.correo} onChange={handleChange} style={estiloInput} />
              <input name="contrasena" type="password" placeholder="Contrasena"
                value={form.contrasena} onChange={handleChange} style={estiloInput} />

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
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
              ¿Ya tienes cuenta?{' '}
              <span onClick={() => navigate('/')}
                style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 'bold' }}>
                Iniciar sesion
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
