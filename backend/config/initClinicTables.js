import { getPool } from './db.js'
import connectDB from './db.js'

/**
 * Utility script to ensure clinic availability tables exist and are properly structured
 */
const initClinicTables = async () => {
  try {
    // Connect to database
    await connectDB()
    const pool = getPool()

    console.log('Connected to database. Initializing clinic tables...')

    // Create clinic permanent unavailability table
    console.log('Creating clinic_permanent_unavailability table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinic_permanent_unavailability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        day_of_week TINYINT NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_day_of_week (day_of_week)
      )
    `)

    // Create clinic temporary unavailability table
    console.log('Creating clinic_temporary_unavailability table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinic_temporary_unavailability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('Clinic tables initialized successfully!')
    return true
  } catch (error) {
    console.error('Error initializing clinic tables:', error.message)
    return false
  }
}

// Export for use in other files
export default initClinicTables

// Run the function if this script is executed directly
if (process.argv[1].includes('initClinicTables.js')) {
  initClinicTables().finally(() => {
    console.log('Initialization script completed. Exiting...')
    setTimeout(() => process.exit(0), 500)
  })
}
