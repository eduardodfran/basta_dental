import mysql from 'mysql2/promise'
import dotenv from 'dotenv' // Keep import if needed, but remove config call
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure correct path to .env
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // REMOVE THIS LINE

// MySQL connection configuration - Reads from process.env populated by server.js
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // This seems to be the issue - check how it's accessed
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
  // Log connection attempt with cleaner format
  console.log(`Connecting to MySQL at ${dbConfig.host}/${dbConfig.database}`)

  try {
    // If password is empty string or undefined despite being set in .env,
    // let's explicitly try to get it again before creating the pool
    if (!dbConfig.password && process.env.DB_PASSWORD) {
      console.log('Using DB password from environment variables')
      dbConfig.password = process.env.DB_PASSWORD
    }

    pool = mysql.createPool(dbConfig)

    // Verify connection by getting a connection from the pool
    const connection = await pool.getConnection()
    console.log(`MySQL connected (Thread ID: ${connection.threadId})`)
    connection.release()

    return pool
  } catch (error) {
    console.error('❌ MySQL connection error:', error.message)
    // Provide more specific feedback based on common errors
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Check database credentials:')
      console.error(`- User: ${dbConfig.user}`)
      console.error(`- Password provided: ${dbConfig.password ? 'Yes' : 'No'}`)
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(
        `Database '${dbConfig.database}' not found. Create it first.`
      )
    } else if (error.code === 'ECONNREFUSED') {
      console.error(
        `Connection refused. Is the MySQL server running on ${dbConfig.host}?`
      )
    }
    return null
  }
}

/**
 * Get the MySQL connection pool
 * @returns {Object} MySQL connection pool
 */
export const getPool = () => {
  if (!pool) {
    console.warn('Attempted to get DB pool before it was initialized!')
  }
  return pool
}

export default connectDB
