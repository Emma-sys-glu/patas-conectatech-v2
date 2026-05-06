const express = require('express')
const router = express.Router()
const pool = require('../db')

// POST /api/voluntarios/perfil — guardar o actualizar perfil
router.post('/perfil', async (req, res) => {
  const { id_usuario, especialidad, disponibilidad, actividades } = req.body

  if (!id_usuario || !especialidad) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios' })
  }

  try {
    // Upsert: si ya tiene perfil lo actualiza, si no lo crea
    await pool.query(
      `INSERT INTO perfiles_voluntario (id_usuario, especialidad, disponibilidad, actividades)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id_usuario)
       DO UPDATE SET especialidad = $2, disponibilidad = $3, actividades = $4`,
      [id_usuario, especialidad, disponibilidad, actividades]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al guardar el perfil' })
  }
})

// GET /api/voluntarios/perfil/:id — obtener perfil
router.get('/perfil/:id', async (req, res) => {
  const { id } = req.params
  try {
    const resultado = await pool.query(
      'SELECT * FROM perfiles_voluntario WHERE id_usuario = $1',
      [id]
    )
    res.json(resultado.rows[0] || null)
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error al obtener el perfil' })
  }
})

module.exports = router