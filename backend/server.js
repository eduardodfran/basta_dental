import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// --- Load Environment Variables FIRST ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.resolve(__dirname, '../.env')

// Cleaner loading message
console.log(`🔧 Loading configuration from ${envPath}`)
const configResult = dotenv.config({ path: envPath })

if (configResult.error) {
  console.error('❌ Error loading .env file:', configResult.error)
} else {
  console.log('✅ Configuration loaded successfully')

  // Simplify environment variable logging
  const envVars = {
    PORT: process.env.PORT || '3050',
    DB_USER: process.env.DB_USER || 'Not Set',
    MAIL_USER: process.env.MAIL_USER ? 'Set' : 'Not Set',
    DB_PASSWORD: process.env.DB_PASSWORD
      ? `Set (${process.env.DB_PASSWORD.length} chars)`
      : 'Not Set',
  }

  console.table(envVars)

  // Check if DB_PASSWORD is empty/whitespace
  if (process.env.DB_PASSWORD?.trim() === '') {
    console.warn('⚠️ WARNING: DB_PASSWORD is set but empty or whitespace only!')
  }
}
// --- End Load Environment Variables ---

import express from 'express'
import contactsRoutes from './contacts/contactsRoutes.js'
import userRoutes from './user/userRoutes.js'
import appointmentRoutes from './appointments/appointmentsRoutes.js'
import analyticsRoutes from './analytics/analyticsRoutes.js'
import dentistRoutes from './dentist/dentistRoutes.js'
import clinicRoutes from './clinic/clinicRoutes.js'
import connectDB from './config/db.js'
import { initializeTables } from './config/initDB.js'
import cors from 'cors'
import { createAdminUser } from './config/seedAdmin.js'
import initClinicTables from './config/initClinicTables.js' // Import the initialization function

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

// Serve the main HTML file for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'))
})

// Serve specific HTML files for these routes
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/reset-password.html'))
})

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/forgot-password.html'))
})

// Wildcard route to handle client-side routing
app.get('*', (req, res) => {
  // Exclude API routes and file extensions
  if (!req.path.startsWith('/api/') && !path.extname(req.path)) {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'))
  } else {
    res.status(404).send('Not found')
  }
})

// --- Start Server Function ---
async function startServer() {
  try {
    console.log('🏁 Starting BastaDental server...')

    // Initialize Database Connection AFTER dotenv config
    console.log('📊 Connecting to database...')
    const pool = await connectDB()

    if (pool) {
      console.log('✅ Database connected successfully')
    } else {
      console.warn(
        '⚠️ Database connection failed! Some features may not work properly'
      )
    }

    // Initialize clinic tables AFTER DB connection attempt
    try {
      console.log('📋 Initializing clinic tables...')
      await initClinicTables() // This now uses the pool potentially initialized by connectDB
      console.log('✅ Clinic tables ready')
    } catch (error) {
      console.error(
        '❌ Error during clinic tables initialization:',
        error.message
      )
    }

    // Mail service transporter is initialized lazily on first use, no explicit call needed here.

    // Start the server even if DB fails - it may still handle some requests
    const server = app.listen(PORT, HOST, () => {
      console.log(`\n🚀 Server running at http://${HOST}:${PORT}\n`)

      // Additional information after startup - cleaner format
      console.log('📊 STATUS SUMMARY')
      console.log('────────────────────────────────────')
      console.log(`📁 Database:     ${pool ? '✓ Connected' : '✗ Failed'}`)
      console.log(`📧 Email:        Will initialize on first request`)
      console.log(`🌐 Server port:  ${PORT}`)
      console.log('────────────────────────────────────')
    })

    // Add specific error handling for the server instance
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error
      }

      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ Port ${PORT} requires elevated privileges`)
          process.exit(1)
          break
        case 'EADDRINUSE':
          console.error(`❌ Port ${PORT} is already in use.`)
          console.error(`💡 Is another instance of the server running?`)
          console.error(
            `💡 You might need to find and stop the process using port ${PORT}.`
          )
          process.exit(1)
          break
        default:
          throw error
      }
    })
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
  }
}

// --- Run the Server Start ---
startServer()

// Optional: Add unhandled rejection/exception handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  // Application specific logging, throwing an error, or other logic here
})
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  // Application specific logging, shutdown, etc.
  process.exit(1) // Mandatory shutdown after uncaught exception
})
