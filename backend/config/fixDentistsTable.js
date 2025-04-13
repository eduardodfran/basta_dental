import { getPool } from './db.js'
import connectDB from './db.js'

/**
 * Utility script to fix issues with the dentists table structure
 * and ensure proper clinic availability functionality
 */
const fixDentistsTable = async () => {
  try {
    // Connect to database
    await connectDB()
    const pool = getPool()

    console.log('Connected to database. Checking dentists table structure...')

    // First, check for foreign key constraints pointing to dentists table
    console.log('Checking for foreign key constraints...')
    const [foreignKeys] = await pool.query(`
      SELECT TABLE_NAME, CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME = 'dentists'
      AND TABLE_SCHEMA = DATABASE()
    `)

    // Store availability related tables for special handling
    const availabilityTables = [
      'dentist_permanent_unavailability',
      'dentist_temporary_unavailability',
      'dentist_availability',
      'clinic_permanent_unavailability',
      'clinic_temporary_unavailability',
    ]
    const availabilityConstraints = []

    // Identify availability-related constraints
    if (foreignKeys.length > 0) {
      console.log(
        `Found ${foreignKeys.length} foreign key constraints pointing to dentists table:`
      )
      for (const fk of foreignKeys) {
        console.log(`- ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`)

        // Store availability-related constraints
        if (availabilityTables.includes(fk.TABLE_NAME)) {
          availabilityConstraints.push(fk)
          console.log(`  (This is an availability-related constraint)`)
        }
      }

      // Temporarily disable foreign key checks to allow the modification
      console.log('Temporarily disabling foreign key checks...')
      await pool.query('SET FOREIGN_KEY_CHECKS = 0')
    }

    // Check if dentists table exists
    const [tables] = await pool.query(`
      SHOW TABLES LIKE 'dentists'
    `)

    if (tables.length === 0) {
      console.log('Dentists table does not exist. Creating table...')

      // Create the table with the correct structure
      await pool.query(`
        CREATE TABLE dentists (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL UNIQUE,
          specialization VARCHAR(100) DEFAULT '',
          bio TEXT,
          phone VARCHAR(20) DEFAULT '',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      console.log('Dentists table created successfully!')
    } else {
      // Table exists, check its structure
      console.log('Checking dentists table structure...')

      // Get current table structure
      const [columns] = await pool.query(`DESCRIBE dentists`)
      const columnNames = columns.map((col) => col.Field)

      console.log('Current columns:', columnNames.join(', '))

      // Check if table has the name column we want to remove
      if (columnNames.includes('name')) {
        console.log('Found name column in dentists table')

        // Create a backup of the dentists table
        console.log('Creating backup of dentists table...')
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dentists_backup LIKE dentists
        `)

        await pool.query(`
          INSERT INTO dentists_backup SELECT * FROM dentists
        `)

        console.log('Backup created successfully at dentists_backup')

        // Modify the table
        // First ensure all required columns exist
        if (!columnNames.includes('phone')) {
          console.log('Adding missing phone column...')
          await pool.query(`
            ALTER TABLE dentists
            ADD COLUMN phone VARCHAR(20) DEFAULT ''
          `)
        }

        if (!columnNames.includes('user_id')) {
          console.log('Adding missing user_id column...')
          await pool.query(`
            ALTER TABLE dentists
            ADD COLUMN user_id INT UNIQUE,
            ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          `)
        }

        // Make name column optional with default value
        console.log('Making name column optional...')
        await pool.query(`
          ALTER TABLE dentists
          MODIFY name VARCHAR(100) DEFAULT ''
        `)

        console.log('Dentists table structure updated successfully!')
      } else {
        // Add missing columns if needed
        if (!columnNames.includes('phone')) {
          console.log('Adding missing phone column...')
          await pool.query(`
            ALTER TABLE dentists
            ADD COLUMN phone VARCHAR(20) DEFAULT ''
          `)
        }

        if (!columnNames.includes('user_id')) {
          console.log('Adding missing user_id column...')
          await pool.query(`
            ALTER TABLE dentists
            ADD COLUMN user_id INT UNIQUE,
            ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          `)
        }

        console.log(
          'Dentists table structure is already correct or has been updated.'
        )
      }
    }

    // Re-enable foreign key checks if we disabled them
    if (foreignKeys.length > 0) {
      console.log('Re-enabling foreign key checks...')
      await pool.query('SET FOREIGN_KEY_CHECKS = 1')
    }

    // After re-enabling foreign keys, check if availability tables exist and are properly connected
    console.log('Verifying clinic availability structures...')
    await ensureAvailabilityTables(pool)

    console.log('Dentists table fix completed successfully!')
    return true
  } catch (error) {
    console.error('Error fixing dentists table:', error.message)

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

/**
 * Ensure that all availability-related tables exist and are properly structured
 */
async function ensureAvailabilityTables(pool) {
  try {
    // Check if clinic_permanent_unavailability table exists
    const [permanentClinicTables] = await pool.query(`
      SHOW TABLES LIKE 'clinic_permanent_unavailability'
    `)

    // If the table exists, check its structure and fix if needed
    if (permanentClinicTables.length > 0) {
      console.log(
        'Checking structure of existing clinic_permanent_unavailability table...'
      )

      try {
        // Test if the unique key is properly set up
        await pool.query(`
          INSERT INTO clinic_permanent_unavailability (day_of_week, reason)
          VALUES (9, 'Test entry') ON DUPLICATE KEY UPDATE reason = 'Test update'
        `)

        // If we get here, the table structure is likely fine, delete our test entry
        await pool.query(
          `DELETE FROM clinic_permanent_unavailability WHERE day_of_week = 9`
        )
        console.log(
          'The clinic_permanent_unavailability table structure appears correct'
        )
      } catch (structureError) {
        console.log(
          'Found issues with clinic_permanent_unavailability table, recreating...'
        )

        // Create backup
        await pool.query(`
          CREATE TABLE IF NOT EXISTS clinic_permanent_unavailability_backup 
          SELECT * FROM clinic_permanent_unavailability
        `)
        console.log('Backup created as clinic_permanent_unavailability_backup')

        // Drop existing table
        await pool.query(`DROP TABLE clinic_permanent_unavailability`)

        // Recreate with correct structure
        await pool.query(`
          CREATE TABLE clinic_permanent_unavailability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            day_of_week TINYINT NOT NULL,
            reason VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_day_of_week (day_of_week)
          )
        `)

        // Restore data from backup
        console.log('Restoring data from backup...')
        await pool.query(`
          INSERT IGNORE INTO clinic_permanent_unavailability (day_of_week, reason, created_at)
          SELECT day_of_week, reason, created_at FROM clinic_permanent_unavailability_backup
        `)
      }
    } else {
      // Table doesn't exist, create it
      console.log('Creating clinic_permanent_unavailability table...')
      await pool.query(`
        CREATE TABLE clinic_permanent_unavailability (
          id INT AUTO_INCREMENT PRIMARY KEY,
          day_of_week TINYINT NOT NULL,
          reason VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_day_of_week (day_of_week)
        )
      `)
    }

    // Check and fix clinic temporary unavailability table
    console.log('Checking clinic_temporary_unavailability table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clinic_temporary_unavailability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check and fix dentist permanent unavailability table
    console.log('Checking dentist_permanent_unavailability table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dentist_permanent_unavailability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dentist_id INT NOT NULL,
        day_of_week TINYINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (dentist_id, day_of_week),
        FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
      )
    `)

    // Check and fix dentist temporary unavailability table
    console.log('Checking dentist_temporary_unavailability table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dentist_temporary_unavailability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dentist_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
      )
    `)

    console.log('All availability tables verified successfully.')
  } catch (error) {
    console.error('Error ensuring availability tables:', error.message)
    throw error
  }
}

// Run the function
fixDentistsTable()
