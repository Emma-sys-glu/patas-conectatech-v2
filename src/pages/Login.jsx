import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ correo: '', contrasena: '' })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.correo || !form.contrasena) {
      setError('Completa todos los campos')
      return
    }
    const resultado = await login(form.correo, form.contrasena)
    if (!resultado.ok) {
      setError(resultado.mensaje)
      return
    }
    navigate(`/dashboard/${resultado.rol}`)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input name="correo" placeholder="Correo electrónico" value={form.correo} onChange={handleChange} />
        <input name="contrasena" type="password" placeholder="Contraseña" value={form.contrasena} onChange={handleChange} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  )
}