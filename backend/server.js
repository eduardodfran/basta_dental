import express from 'express'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import contactsRoutes from './contacts/contactsRoutes.js'

// Set up paths and environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Initialize Express app
const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend/public')))

// API Routes
app.use('/api/contacts', contactsRoutes)

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
