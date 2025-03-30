import { getPool } from './db.js'
import connectDB from './db.js'

/**
 * Utility script to fix issues with the dentists table structure
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

    if (foreignKeys.length > 0) {
      console.log(
        `Found ${foreignKeys.length} foreign key constraints pointing to dentists table:`
      )
      for (const fk of foreignKeys) {
        console.log(`- ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`)
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

// Run the function
fixDentistsTable()
