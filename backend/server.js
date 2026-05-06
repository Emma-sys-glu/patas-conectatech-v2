const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const casosRoutes = require('./routes/casos')
const voluntariosRoutes = require('./routes/voluntarios')


const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/casos', casosRoutes)
app.use('/api/voluntarios', voluntariosRoutes)

app.get('/', (req, res) => res.send('Servidor Patas ConectaTech corriendo'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`))