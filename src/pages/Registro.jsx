import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function validarNombre(nombre) {
  const limpio = nombre.trim()
  // Tiene números o caracteres raros
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(limpio)) return 'real'
  // Solo una palabra
  const palabras = limpio.split(/\s+/).filter(p => p.length >= 2)
  if (palabras.length < 2) return 'completo'
  return 'ok'
}

export default function Registro() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { registrar } = useAuth()

  const [rol, setRol] = useState(params.get('rol') || '')
  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(false)
  const [exitoso, setExitoso] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errores[e.target.name]) setErrores({ ...errores, [e.target.name]: '' })
  }

  function validar() {
    const e = {}

    const nombreResult = validarNombre(form.nombre)
    if (!form.nombre.trim()) {
      e.nombre = 'El nombre es requerido'
    } else if (nombreResult === 'real') {
      e.nombre = 'Ingresa un nombre real, solo letras y espacios'
    } else if (nombreResult === 'completo') {
      e.nombre = 'Ingresa tu nombre completo (nombre y apellido)'
    }

    if (!form.correo.trim()) {
      e.correo = 'El correo es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
      e.correo = 'Ingresa un correo electronico valido'
    }

    if (!form.contrasena) {
      e.contrasena = 'La contrasena es requerida'
    } else if (form.contrasena.length < 6) {
      e.contrasena = 'La contrasena debe tener al menos 6 caracteres'
    }

    if (!rol) {
      e.rol = 'Selecciona tu rol'
    }

    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nuevosErrores = validar()
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }
    setCargando(true)
    const resultado = await registrar(form.nombre.trim(), form.correo, form.contrasena, rol)
    if (!resultado.ok) {
      setErrores({ general: resultado.mensaje })
      setCargando(false)
      return
    }
    setExitoso(true)
    setTimeout(() => navigate('/'), 2000)
  }

  const estiloBtn = (valor) => ({
    flex: 1, padding: '13px', fontSize: '15px', fontWeight: 'bold',
    cursor: 'pointer',
    border: rol === valor ? '2px solid #303854' : '2px solid #c2cdd5',
    borderRadius: '10px',
    background: rol === valor ? '#303854' : '#fff',
    color: rol === valor ? '#f6f3ea' : '#303854',
    transition: 'all 0.15s',
  })

  const estiloInput = (campo) => ({
    padding: '12px', borderRadius: '8px',
    border: errores[campo] ? '2px solid #dc2626' : '1px solid #c2cdd5',
    fontSize: '15px', width: '100%', boxSizing: 'border-box',
    background: errores[campo] ? '#fef2f2' : '#fff', outline: 'none'
  })

  const errMsg = (campo) => errores[campo] ? (
    <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '2px', display: 'block' }}>
      ⚠ {errores[campo]}
    </span>
  ) : null

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f6f3ea', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '40px', width: '100%', maxWidth: '420px',
        boxShadow: '0 4px 24px rgba(48,56,84,0.12)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>🐾</div>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#303854' }}>Crear cuenta</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>Registrate para empezar</p>
        </div>

        {exitoso && (
          <div style={{
            background: '#dcfce7', color: '#166534', padding: '14px',
            borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold', textAlign: 'center'
          }}>
            ✅ Cuenta creada. Redirigiendo al login...
          </div>
        )}

        {errores.general && (
          <div style={{
            background: '#fef2f2', color: '#dc2626', padding: '12px',
            borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca'
          }}>
            {errores.general}
          </div>
        )}

        {!exitoso && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <button type="button" onClick={() => { setRol('solicitante'); setErrores({ ...errores, rol: '' }) }} style={estiloBtn('solicitante')}>
                🙋 Solicitante
              </button>
              <button type="button" onClick={() => { setRol('voluntario'); setErrores({ ...errores, rol: '' }) }} style={estiloBtn('voluntario')}>
                🤝 Voluntario
              </button>
            </div>
            {errMsg('rol')}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>

              <div>
                <input
                  name="nombre"
                  placeholder="Nombre completo"
                  value={form.nombre}
                  onChange={handleChange}
                  style={estiloInput('nombre')}
                />
                {errMsg('nombre')}
              </div>

              <div>
                <input
                  name="correo"
                  type="email"
                  placeholder="Correo electronico"
                  value={form.correo}
                  onChange={handleChange}
                  style={estiloInput('correo')}
                />
                {errMsg('correo')}
              </div>

              <div>
                <input
                  name="contrasena"
                  type="password"
                  placeholder="Contrasena (minimo 6 caracteres)"
                  value={form.contrasena}
                  onChange={handleChange}
                  style={estiloInput('contrasena')}
                />
                {errMsg('contrasena')}
              </div>

              <button type="submit" disabled={cargando} style={{
                padding: '13px', fontSize: '16px', fontWeight: 'bold',
                cursor: cargando ? 'not-allowed' : 'pointer',
                background: cargando ? '#9ca3af' : '#303854',
                color: '#f6f3ea', border: 'none', borderRadius: '8px', marginTop: '4px'
              }}>
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
              ¿Ya tienes cuenta?{' '}
              <span onClick={() => navigate('/')}
                style={{ color: '#303854', cursor: 'pointer', fontWeight: 'bold' }}>
                Iniciar sesion
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
