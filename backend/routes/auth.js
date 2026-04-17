const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const pool = require('../db')

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, correo, contrasena, rol } = req.body

  if (!nombre || !correo || !contrasena || !rol) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' })
  }

  try {
    const existe = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correo])
    if (existe.rows.length > 0) {
      return res.status(400).json({ mensaje: 'Ese correo ya está registrado' })
    }

    const hash = await bcrypt.hash(contrasena, 10)
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo, rol',
      [nombre, correo, hash, rol]
    )

    res.status(201).json({ ok: true, usuario: resultado.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error en el servidor' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { correo, contrasena } = req.body

  if (!correo || !contrasena) {
    return res.status(400).json({ mensaje: 'Completa todos los campos' })
  }

  try {
    const resultado = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo])
    if (resultado.rows.length === 0) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' })
    }

    const usuario = resultado.rows[0]
    const passwordValida = await bcrypt.compare(contrasena, usuario.contrasena)
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos' })
    }

    // No mandamos la contraseña al frontend
    const { contrasena: _, ...usuarioSeguro } = usuario
    res.json({ ok: true, usuario: usuarioSeguro })
  } catch (err) {
    console.error(err)
    res.status(500).json({ mensaje: 'Error en el servidor' })
  }
})

module.exports = router