import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import contactsRoutes from './contacts/contactsRoutes.js'
import userRoutes from './user/userRoutes.js'
import appointmentRoutes from './appointments/appointmentsRoutes.js'
import analyticsRoutes from './analytics/analyticsRoutes.js'
import dentistRoutes from './dentist/dentistRoutes.js'
import clinicRoutes from './clinic/clinicRoutes.js' // Add this line
import connectDB from './config/db.js'
import { initializeTables } from './config/initDB.js'
import cors from 'cors'
import { createAdminUser } from './config/seedAdmin.js'
import initClinicTables from './config/initClinicTables.js' // Import the initialization function

// Set up paths and environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'

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
app.use('/api/users', userRoutes) // Update the route to mount user routes under /api/users
app.use('/api/appointments', appointmentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/dentist', dentistRoutes)
app.use('/api/clinic', clinicRoutes) // Add this line

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'))
})

// Initialize the database connection
connectDB()
  .then(async () => {
    console.log('Database connection established')

    // Initialize clinic tables
    try {
      console.log('Initializing clinic tables...')
      await initClinicTables()
      console.log('Clinic tables initialized successfully')
    } catch (error) {
      console.error('Error initializing clinic tables:', error.message)
      // Continue with server startup anyway
    }

    // Start the server
    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Database connection failed:', err)
    process.exit(1)
  })
