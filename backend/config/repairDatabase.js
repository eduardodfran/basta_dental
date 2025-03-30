import { getPool } from './db.js'
import connectDB from './db.js'

/**
 * Comprehensive database repair script to fix various issues
 */
const repairDatabase = async () => {
  try {
    // 1. Connect to database
    console.log('Connecting to database...')
    await connectDB()
    const pool = getPool()
    console.log('Connected successfully')

    // 2. Temporarily disable foreign key checks for the entire repair operation
    console.log('Temporarily disabling foreign key checks...')
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')

    // 3. Check and fix table structures

    // 3.1 Fix dentists table
    console.log('\n=== FIXING DENTISTS TABLE ===')
    await fixDentistsTable(pool)

    // 3.2 Fix availability table
    console.log('\n=== FIXING AVAILABILITY TABLE ===')
    await fixAvailabilityTable(pool)

    // 3.3 Migrate any orphaned records
    console.log('\n=== CHECKING FOR DATA CONSISTENCY ===')
    await checkDataConsistency(pool)

    // 4. Re-enable foreign key checks
    console.log('\nRe-enabling foreign key checks...')
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')

    console.log('\nDatabase repair completed successfully!')
    return true
  } catch (error) {
    console.error('Error during database repair:', error.message)

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
    console.log('Repair process completed. Exiting...')
    setTimeout(() => process.exit(0), 500)
  }
}

// Fix dentists table function
async function fixDentistsTable(pool) {
  try {
    console.log('Checking dentists table...')

    // Check if dentists table exists
    const [tables] = await pool.query(`SHOW TABLES LIKE 'dentists'`)

    if (tables.length === 0) {
      console.log('Dentists table does not exist. Creating it...')
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
      console.log('Dentists table created.')
      return
    }

    // Get current columns
    const [columns] = await pool.query(`DESCRIBE dentists`)
    const columnMap = columns.reduce((map, col) => {
      map[col.Field] = true
      return map
    }, {})

    console.log('Current dentists columns:', Object.keys(columnMap).join(', '))

    // Create backup
    console.log('Creating backup of dentists table...')
    await pool.query(
      `CREATE TABLE IF NOT EXISTS dentists_backup_repair LIKE dentists`
    )
    await pool.query(
      `INSERT INTO dentists_backup_repair SELECT * FROM dentists`
    )

    // Add missing columns if needed
    if (!columnMap.phone) {
      console.log('Adding missing phone column...')
      await pool.query(
        `ALTER TABLE dentists ADD COLUMN phone VARCHAR(20) DEFAULT ''`
      )
    }

    if (!columnMap.user_id) {
      console.log('Adding missing user_id column...')
      await pool.query(`ALTER TABLE dentists ADD COLUMN user_id INT UNIQUE`)
    }

    if (!columnMap.bio) {
      console.log('Adding missing bio column...')
      await pool.query(`ALTER TABLE dentists ADD COLUMN bio TEXT`)
    }

    if (columnMap.name) {
      console.log('Making name column optional...')
      await pool.query(
        `ALTER TABLE dentists MODIFY name VARCHAR(100) DEFAULT ''`
      )
    }

    console.log('Dentists table structure fixed.')
  } catch (error) {
    console.error('Error fixing dentists table:', error.message)
    throw error
  }
}

// Fix availability table function
async function fixAvailabilityTable(pool) {
  try {
    console.log('Checking availability table...')

    // Check if availability table exists
    const [tables] = await pool.query(`SHOW TABLES LIKE 'availability'`)

    if (tables.length === 0) {
      console.log('Availability table does not exist. No action needed.')
      return
    }

    // Create backup
    console.log('Creating backup of availability table...')
    await pool.query(
      `CREATE TABLE IF NOT EXISTS availability_backup_repair LIKE availability`
    )
    await pool.query(
      `INSERT INTO availability_backup_repair SELECT * FROM availability`
    )

    // Check for foreign keys to dentists
    const [foreignKeys] = await pool.query(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE REFERENCED_TABLE_NAME = 'dentists'
      AND TABLE_NAME = 'availability'
      AND TABLE_SCHEMA = DATABASE()
    `)

    if (foreignKeys.length > 0) {
      console.log(
        `Found ${foreignKeys.length} foreign key(s) to dentists table`
      )

      // Drop foreign keys
      for (const fk of foreignKeys) {
        console.log(`Dropping foreign key ${fk.CONSTRAINT_NAME}...`)
        await pool.query(
          `ALTER TABLE availability DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`
        )
      }

      console.log('All foreign keys dropped from availability table')
    } else {
      console.log('No foreign keys from availability to dentists found')
    }

    // Ensure dentist_availability table exists
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

    console.log('Availability table fixed.')
  } catch (error) {
    console.error('Error fixing availability table:', error.message)
    throw error
  }
}

// Check data consistency
async function checkDataConsistency(pool) {
  try {
    console.log('Checking data consistency...')

    // Check if there are users with role='dentist' who don't have dentist records
    const [missingDentists] = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone
      FROM users u
      LEFT JOIN dentists d ON u.id = d.user_id
      WHERE u.role = 'dentist' AND d.id IS NULL
    `)

    if (missingDentists.length > 0) {
      console.log(
        `Found ${missingDentists.length} users with role 'dentist' but no dentist record`
      )
      console.log('Creating dentist records for these users...')

      for (const user of missingDentists) {
        console.log(
          `Creating dentist record for user ${user.id} (${user.name})`
        )
        await pool.query(
          `
          INSERT INTO dentists (user_id, specialization, bio, phone)
          VALUES (?, '', '', ?)
        `,
          [user.id, user.phone || '']
        )
      }

      console.log('Dentist records created successfully')
    } else {
      console.log('No consistency issues found with dentist records')
    }
  } catch (error) {
    console.error('Error checking data consistency:', error.message)
    throw error
  }
}

// Run the repair
repairDatabase()
