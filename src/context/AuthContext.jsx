import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)

  async function registrar(nombre, correo, contrasena, rol) {
    const res = await fetch('http://localhost:3000/api/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, contrasena, rol })
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, mensaje: data.mensaje }
    return { ok: true }
  }

  async function login(correo, contrasena) {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, mensaje: data.mensaje }
    setUsuario(data.usuario)
    return { ok: true, rol: data.usuario.rol }
  }

  function logout() {
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, registrar, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}