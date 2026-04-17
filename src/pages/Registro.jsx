import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registro() {
  const [params] = useSearchParams()
  const rol = params.get('rol') || 'solicitante'
  const navigate = useNavigate()
  const { registrar } = useAuth()

  const [form, setForm] = useState({ nombre: '', correo: '', contrasena: '' })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre || !form.correo || !form.contrasena) {
      setError('Todos los campos son obligatorios')
      return
    }
    const resultado = await registrar(form.nombre, form.correo, form.contrasena, rol)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navigate('/login')
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <h2>Registro — {rol}</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input name="nombre" placeholder="Nombre completo" value={form.nombre} onChange={handleChange} />
        <input name="correo" placeholder="Correo electrónico" value={form.correo} onChange={handleChange} />
        <input name="contrasena" type="password" placeholder="Contraseña" value={form.contrasena} onChange={handleChange} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Registrarme</button>
      </form>
    </div>
  )
}