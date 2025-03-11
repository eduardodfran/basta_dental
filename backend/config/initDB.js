import { getPool } from './db.js'

/**
 * Create database tables if they don't exist
 */
export const initializeTables = async () => {
  const pool = getPool()

  if (!pool) {
    console.error('Database pool not initialized')
    return false
  }

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        phone VARCHAR(20),
        gender ENUM('male', 'female', 'other', ''),
        address TEXT,
        role ENUM('patient', 'admin', 'staff') DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Ensure the existing users table has the correct ENUM definition for the role column
    await pool.query(`
      ALTER TABLE users
      MODIFY role ENUM('patient', 'admin', 'staff') DEFAULT 'patient'
    `)

    console.log('Database tables initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing database tables:', error.message)
    return false
  }
}
