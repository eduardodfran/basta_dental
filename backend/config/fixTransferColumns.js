/**
 * Migration script to add transfer-related columns to the appointments table
 */
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'basta_dental',
  port: process.env.DB_PORT || 3306,
}

async function fixTransferColumns() {
  console.log('Starting transfer columns migration...')

  let connection
  try {
    // Create a connection
    connection = await mysql.createConnection(dbConfig)
    console.log('Connected to database.')

    // Check if the transfer_status column exists
    const [transferStatusCheck] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'transfer_status'
    `,
      [dbConfig.database]
    )

    // Check if the original_dentist column exists
    const [originalDentistCheck] = await connection.execute(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'original_dentist'
    `,
      [dbConfig.database]
    )

    // Add transfer_status column if it doesn't exist
    if (transferStatusCheck.length === 0) {
      console.log('Adding transfer_status column...')
      await connection.execute(`
        ALTER TABLE appointments 
        ADD COLUMN transfer_status ENUM('pending', 'available', 'accepted', 'completed') 
        DEFAULT 'pending'
      `)
      console.log('Added transfer_status column.')
    } else {
      console.log('transfer_status column already exists.')
    }

    // Add original_dentist column if it doesn't exist
    if (originalDentistCheck.length === 0) {
      console.log('Adding original_dentist column...')
      await connection.execute(`
        ALTER TABLE appointments 
        ADD COLUMN original_dentist VARCHAR(255)
      `)
      console.log('Added original_dentist column.')
    } else {
      console.log('original_dentist column already exists.')
    }

    // Update existing rows to have default transfer_status
    await connection.execute(`
      UPDATE appointments 
      SET transfer_status = 'pending' 
      WHERE transfer_status IS NULL
    `)

    console.log('Migration completed successfully!')
    return true
  } catch (error) {
    console.error('Error during migration:', error)
    return false
  } finally {
    if (connection) {
      await connection.end()
      console.log('Database connection closed.')
    }

    console.log('Exiting migration script...')
    setTimeout(() => process.exit(0), 500)
  }
}

// Run the function
fixTransferColumns()
