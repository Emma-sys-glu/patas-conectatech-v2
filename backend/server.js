const express = require('express')
const cors = require('cors')
const path = require('path')
const multer = require('multer')
const authRoutes = require('./routes/auth')
const casosRoutes = require('./routes/casos')
const voluntariosRoutes = require('./routes/voluntarios')

const app = express()

app.use(cors())
app.use(express.json())

// Servir archivos estaticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Configuracion de multer para guardar fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: (req, file, cb) => {
    const unico = `${Date.now()}_${file.originalname}`
    cb(null, unico)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const tipos = ['image/jpeg', 'image/png', 'image/jpg']
    if (tipos.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imagenes JPG y PNG'))
    }
  }
})

// Endpoint para subir foto
app.post('/api/upload', upload.single('foto'), (req, res) => {
  if (!req.file) return res.status(400).json({ mensaje: 'No se recibio archivo' })
  res.json({ nombreArchivo: req.file.filename })
})

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/casos', casosRoutes)
app.use('/api/voluntarios', voluntariosRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`))
