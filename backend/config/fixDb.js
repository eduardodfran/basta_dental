import { getPool } from './db.js'
import connectDB from './db.js'

/**
 * Script to add missing columns to the database
 * Run this script directly with: node backend/config/fixDb.js
 */
const fixDatabase = async () => {
  try {
    await connectDB()
    const pool = getPool()

    if (!pool) {
      console.error('Database connection failed')
      return false
    }

    console.log('Checking database structure...')

    // Check if updated_at column exists in users table
    const [userColumns] = await pool.query(`
      SHOW COLUMNS FROM users LIKE 'updated_at'
    `)

    if (userColumns.length === 0) {
      console.log('Adding updated_at column to users table')
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `)
      console.log('✅ Added updated_at column to users table')
    } else {
      console.log('✓ users table already has updated_at column')
    }

    // Check if appointments table exists
    try {
      const [tables] = await pool.query(`
        SHOW TABLES LIKE 'appointments'
      `)

      if (tables.length > 0) {
        const [appointmentColumns] = await pool.query(`
          SHOW COLUMNS FROM appointments LIKE 'updated_at'
        `)

        if (appointmentColumns.length === 0) {
          console.log('Adding updated_at column to appointments table')
          await pool.query(`
            ALTER TABLE appointments 
            ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          `)
          console.log('✅ Added updated_at column to appointments table')
        } else {
          console.log('✓ appointments table already has updated_at column')
        }
      } else {
        console.log('appointments table does not exist yet')
      }
    } catch (error) {
      console.log('appointments table does not exist yet:', error.message)
    }

    console.log('Database structure check completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error fixing database:', error)
    process.exit(1)
  }
}

fixDatabase()
