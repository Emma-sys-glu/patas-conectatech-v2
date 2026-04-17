import { createContext, useContext, useState } from 'react'

const CasosContext = createContext()

export function CasosProvider({ children }) {
  const [casos, setCasos] = useState([])

  function agregarCaso(nuevoCaso) {
    const casoCompleto = {
      ...nuevoCaso,
      id: Date.now(), // ID único basado en tiempo
      fechaReporte: new Date().toISOString(),
      estado: 'activo',
      voluntariosAyudando: [],
      puntajeUrgencia: calcularUrgencia(nuevoCaso)
    }
    setCasos(prev => [...prev, casoCompleto])
    return casoCompleto
  }

  function calcularUrgencia(caso) {
    let puntaje = 0

    // Condición física
    if (caso.condicion === 'critica') puntaje += 40
    else if (caso.condicion === 'regular') puntaje += 20
    else puntaje += 5

    // Tiempo sin atención (nuevo caso = menos de 24h)
    puntaje += 10

    // Sin voluntarios aún
    puntaje += 20

    // Tipo de apoyo
    if (caso.tipoApoyo.includes('atencion_veterinaria')) puntaje += 15
    else if (caso.tipoApoyo.includes('rescate')) puntaje += 10
    else if (caso.tipoApoyo.includes('transporte')) puntaje += 5

    return puntaje
  }

  return (
    <CasosContext.Provider value={{ casos, agregarCaso }}>
      {children}
    </CasosContext.Provider>
  )
}

export function useCasos() {
  return useContext(CasosContext)
}