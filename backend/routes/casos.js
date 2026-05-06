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

// GET /api/casos/similares
router.get('/similares', async (req, res) => {
  const { especie, ubicacion } = req.query
  if (!especie || !ubicacion) return res.json([])
  try {
    const zona = ubicacion.trim().substring(0, 10)
    const resultado = await pool.query(
      `SELECT id, especie, condicion, ubicacion, fecha_reporte
       FROM casos
       WHERE estado = 'activo'
         AND LOWER(especie) = LOWER($1)
         AND LOWER(ubicacion) LIKE LOWER($2)
       LIMIT 3`,
      [especie, `%${zona}%`]
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al buscar similares' })
  }
})

// POST /api/casos/:id/ayuda — registrar oferta de ayuda
router.post('/:id/ayuda', async (req, res) => {
  const { id } = req.params
  const { id_voluntario, tipo_ayuda } = req.body

  if (!id_voluntario || !tipo_ayuda) {
    return res.status(400).json({ mensaje: 'Faltan datos' })
  }

  try {
    // Verificar si ya ayudo en este caso
    const existe = await pool.query(
      'SELECT id FROM ayudas WHERE id_caso = $1 AND id_voluntario = $2',
      [id, id_voluntario]
    )
    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: 'Ya registraste una ayuda en este caso' })
    }

    await pool.query(
      'INSERT INTO ayudas (id_caso, id_voluntario, tipo_ayuda) VALUES ($1, $2, $3)',
      [id, id_voluntario, tipo_ayuda]
    )

    // Devolver el nuevo contador de ayudas del caso
    const contador = await pool.query(
      'SELECT COUNT(*) as total FROM ayudas WHERE id_caso = $1',
      [id]
    )

    res.json({ ok: true, total_ayudas: parseInt(contador.rows[0].total) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al registrar la ayuda' })
  }
})

// GET /api/casos/:id/ayudas — obtener ayudas del voluntario en ese caso
router.get('/:id/ayudas', async (req, res) => {
  const { id } = req.params
  const { id_voluntario } = req.query

  try {
    // Total de ayudas del caso
    const total = await pool.query(
      'SELECT COUNT(*) as total FROM ayudas WHERE id_caso = $1',
      [id]
    )
    // Si viene id_voluntario, verificar si ya ayudo
    let ya_ayudo = null
    if (id_voluntario) {
      const mia = await pool.query(
        'SELECT tipo_ayuda FROM ayudas WHERE id_caso = $1 AND id_voluntario = $2',
        [id, id_voluntario]
      )
      ya_ayudo = mia.rows[0]?.tipo_ayuda || null
    }

    res.json({
      total_ayudas: parseInt(total.rows[0].total),
      ya_ayudo
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al obtener ayudas' })
  }
})

// GET /api/casos/:id/detalle-ayudas — tipos de ayuda cubiertos en un caso
router.get('/:id/detalle-ayudas', async (req, res) => {
  const { id } = req.params
  try {
    const resultado = await pool.query(
      `SELECT a.tipo_ayuda, u.nombre as nombre_voluntario
       FROM ayudas a
       JOIN usuarios u ON a.id_voluntario = u.id
       WHERE a.id_caso = $1`,
      [id]
    )
    res.json(resultado.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al obtener detalle de ayudas' })
  }
})

// PATCH /api/casos/:id/resolver — marcar caso como resuelto
router.patch('/:id/resolver', async (req, res) => {
  const { id } = req.params
  try {
    await pool.query(
      `UPDATE casos SET estado = 'resuelto' WHERE id = $1`,
      [id]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al resolver el caso' })
  }
})

module.exports = router
