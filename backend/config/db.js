import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure correct path to .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/dentalcare'

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    // Set mongoose options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    await mongoose.connect(MONGODB_URI, options)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection error:', error.message)

    // Continue with application instead of exiting process
    console.log('Application will continue without database functionality')
  }
}

export default connectDB
