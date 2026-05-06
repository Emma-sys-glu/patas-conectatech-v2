import { useNavigate } from 'react-router-dom'

export default function SelectRol() {
  const navigate = useNavigate()

  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      <h1>🐾 Patas ConectaTech</h1>
      <p>¿Cómo quieres ingresar?</p>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
        <button onClick={() => navigate('/registro?rol=solicitante')}>
          Soy Solicitante
        </button>
        <button onClick={() => navigate('/registro?rol=voluntario')}>
          Soy Voluntario
        </button>
      </div>
      <p style={{ marginTop: '20px' }}>
        ¿Ya tienes cuenta? <span style={{ cursor: 'pointer', color: 'blue' }} onClick={() => navigate('/login')}>Inicia sesión</span>
      </p>
    </div>
  )
}




