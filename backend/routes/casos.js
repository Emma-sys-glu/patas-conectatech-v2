const express = require('express')
const router = express.Router()
const pool = require('../db')

function calcularUrgencia(condicion, tiempoEnCalle, tipoApoyo) {
  let puntaje = 0

  if (condicion === 'critica') puntaje += 40
  else if (condicion === 'regular') puntaje += 20
  else puntaje += 5

  if (tiempoEnCalle === 'mas_48h') puntaje += 30
  else if (tiempoEnCalle === 'entre_24_48h') puntaje += 20
  else puntaje += 10

  // Nuevo caso, sin voluntarios aún
  puntaje += 20

  if (tipoApoyo.includes('atencion_veterinaria')) puntaje += 15
  else if (tipoApoyo.includes('rescate')) puntaje += 10
  else if (tipoApoyo.includes('transporte')) puntaje += 5

  return puntaje
}

// POST /api/casos
router.post('/', async (req, res) => {
  const {
    id_usuario, nombre_solicitante, telefono, correo_solicitante,
    especie, edad_aprox, sexo, condicion, comportamiento,
    ubicacion, foto, motivo, situacion_actual, tiempo_en_calle, tipo_apoyo
  } = req.body

  // Validaciones básicas en backend (segunda línea de defensa)
  if (!telefono || !especie || !condicion || !ubicacion || !motivo || !situacion_actual || !tipo_apoyo?.length) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' })
  }

  const puntaje = calcularUrgencia(condicion, tiempo_en_calle, tipo_apoyo)

  try {
    const resultado = await pool.query(
      `INSERT INTO casos 
        (id_usuario, nombre_solicitante, telefono, correo_solicitante,
         especie, edad_aprox, sexo, condicion, comportamiento,
         ubicacion, foto, motivo, situacion_actual, tiempo_en_calle, tipo_apoyo, puntaje_urgencia)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [id_usuario, nombre_solicitante, telefono, correo_solicitante,
       especie, edad_aprox, sexo, condicion, comportamiento,
       ubicacion, foto, motivo, situacion_actual, tiempo_en_calle, tipo_apoyo, puntaje]
    )
    res.status(201).json({ ok: true, caso: resultado.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al guardar el caso' })
  }
})

// GET /api/casos
router.get('/', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM casos WHERE estado = $1 ORDER BY puntaje_urgencia DESC',
      ['activo']
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al obtener los casos' })
  }
})

// GET /api/casos/usuario/:id
router.get('/usuario/:id', async (req, res) => {
  const { id } = req.params
  try {
    const resultado = await pool.query(
      'SELECT * FROM casos WHERE id_usuario = $1 ORDER BY fecha_reporte DESC',
      [id]
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al obtener los casos' })
  }
})

module.exports = router
