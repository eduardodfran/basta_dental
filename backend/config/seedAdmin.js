import { getPool } from './db.js'
import bcrypt from 'bcrypt'

/**
 * Creates an admin user in the database
 */
export const createAdminUser = async () => {
  const pool = getPool()

  if (!pool) {
    console.error('Database pool not initialized')
    return false
  }

  try {
    // Check if admin already exists
    const [existingAdmins] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR role = "admin" LIMIT 1',
      ['admin@bastadental.com']
    )

    if (existingAdmins.length > 0) {
      console.log('Admin user already exists!')
      return true
    }

    // Generate hashed password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('admin123', salt)

    // Insert admin user
    await pool.query(
      `INSERT INTO users (name, email, password, dob, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        'Admin User',
        'admin@bastadental.com',
        hashedPassword,
        '1990-01-01',
        'admin',
      ]
    )

    console.log('Admin user created successfully!')
    console.log('Email: admin@bastadental.com')
    console.log('Password: admin123')

    return true
  } catch (error) {
    console.error('Error creating admin user:', error.message)
    return false
  }
}

// Run this function directly when script is executed
if (process.argv[1].includes('seedAdmin')) {
  import('../config/db.js').then(async () => {
    await createAdminUser()
    process.exit(0)
  })
}
