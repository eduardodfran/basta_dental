import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import contactsRoutes from './contacts/contactsRoutes.js'
import userRoutes from './user/userRoutes.js'
import appointmentRoutes from './appointments/appointmentsRoutes.js'
import connectDB from './config/db.js'
import { initializeTables } from './config/initDB.js'
import cors from 'cors'
import { createAdminUser } from './config/seedAdmin.js'

// Set up paths and environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3000

// Connect to MySQL and initialize database tables
const initializeApp = async () => {
  await connectDB()
  await initializeTables()
  await createAdminUser()
}
initializeApp()

// Middlewares - update CORS configuration
app.use(
  cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // Add any other origins you need
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/public')))

// API Routes
app.use('/api/contacts', contactsRoutes)
app.use('/api', userRoutes) // This will handle /api/login and /api/signup
app.use('/api/appointments', appointmentRoutes) // Add appointments routes

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
