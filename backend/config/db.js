import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure correct path to .env
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'basta_dental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

let pool

/**
 * Connect to MySQL database and create a connection pool
 */
const connectDB = async () => {
  try {
    pool = mysql.createPool(dbConfig)

    // Verify connection by getting a connection from the pool
    const connection = await pool.getConnection()
    connection.release()

    console.log('MySQL connected successfully')
    return pool
  } catch (error) {
    console.error('MySQL connection error:', error.message)
    console.log('Application will continue without database functionality')
    return null
  }
}

/**
 * Get the MySQL connection pool
 * @returns {Object} MySQL connection pool
 */
export const getPool = () => pool

export default connectDB
