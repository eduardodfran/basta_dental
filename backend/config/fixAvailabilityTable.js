import { getPool } from './db.js'
import connectDB from './db.js'

/**
 * Utility script to fix issues with the availability table structure
 * and its relation to the dentists table
 */
const fixAvailabilityTable = async () => {
  try {
    // Connect to database
    await connectDB()
    const pool = getPool()

    console.log(
      'Connected to database. Checking availability table structure...'
    )

    // Check if availability table exists
    const [tables] = await pool.query(`
      SHOW TABLES LIKE 'availability'
    `)

    if (tables.length === 0) {
      console.log('Availability table does not exist. No action needed.')
      return true
    }

    // Table exists, check its structure and foreign keys
    console.log('Availability table exists. Checking its structure...')

    // Get foreign keys
    const [foreignKeys] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME = 'dentists'
      AND TABLE_NAME = 'availability'
      AND TABLE_SCHEMA = DATABASE()
    `)

    if (foreignKeys.length > 0) {
      console.log(
        `Found ${foreignKeys.length} foreign key(s) pointing to dentists table:`
      )
      for (const fk of foreignKeys) {
        console.log(`- ${fk.CONSTRAINT_NAME}`)
      }

      // Create a backup
      console.log('Creating backup of availability table...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS availability_backup LIKE availability
      `)

      await pool.query(`
        INSERT INTO availability_backup SELECT * FROM availability
      `)

      console.log('Backup created successfully at availability_backup')

      // Temporarily disable foreign key checks
      console.log('Temporarily disabling foreign key checks...')
      await pool.query('SET FOREIGN_KEY_CHECKS = 0')

      // Drop the foreign keys
      for (const fk of foreignKeys) {
        console.log(`Dropping foreign key ${fk.CONSTRAINT_NAME}...`)
        await pool.query(`
          ALTER TABLE availability
          DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
        `)
      }

      // Map foreign key to dentist_availability table
      console.log('Ensuring dentist_availability table exists...')
      await pool.query(`
        CREATE TABLE IF NOT EXISTS dentist_availability (
          id INT AUTO_INCREMENT PRIMARY KEY,
          dentist_id INT NOT NULL,
          date DATE NOT NULL,
          time_start TIME NOT NULL,
          time_end TIME NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
        )
      `)

      console.log('Migrating data from availability to dentist_availability...')

      // Check the structure of availability table to determine migration strategy
      const [availabilityColumns] = await pool.query(`DESCRIBE availability`)
      const columnMap = availabilityColumns.reduce((map, col) => {
        map[col.Field] = true
        return map
      }, {})

      if (columnMap.dentist_id && columnMap.date && columnMap.time) {
        // Assuming availability has dentist_id, date, time columns
        await pool.query(`
          INSERT IGNORE INTO dentist_availability (dentist_id, date, time_start, time_end)
          SELECT dentist_id, date, time, ADDTIME(time, '01:00:00')
          FROM availability
          WHERE status = 'available' OR status IS NULL
        `)
        console.log('Data migration completed')
      }

      console.log(
        'Would you like to drop the old availability table? (Keeping for now)'
      )

      // Re-enable foreign key checks
      console.log('Re-enabling foreign key checks...')
      await pool.query('SET FOREIGN_KEY_CHECKS = 1')
    } else {
      console.log('No foreign keys from availability to dentists found.')
    }

    console.log('Availability table fix completed successfully!')
    return true
  } catch (error) {
    console.error('Error fixing availability table:', error.message)

    // Make sure to re-enable foreign key checks even if there was an error
    try {
      const pool = getPool()
      await pool.query('SET FOREIGN_KEY_CHECKS = 1')
      console.log('Foreign key checks re-enabled')
    } catch (fkError) {
      console.error('Error re-enabling foreign key checks:', fkError.message)
    }

    return false
  } finally {
    console.log('Fix process completed. Exiting...')
    setTimeout(() => process.exit(0), 500)
  }
}

// Run the function
fixAvailabilityTable()
