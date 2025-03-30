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
    // Create users table - make sure timestamps are optional since we might be running on an existing DB
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
        role ENUM('patient', 'admin', 'staff', 'dentist') DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Check if the updated_at column exists and add it if not using safer approach
    try {
      const [columns] = await pool.query(`
        SHOW COLUMNS FROM users LIKE 'updated_at'
      `)

      if (columns.length === 0) {
        // Column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE users
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `)
        console.log('Added updated_at column to users table')
      }
    } catch (error) {
      console.error(
        'Error checking/adding updated_at column to users:',
        error.message
      )
    }

    // Ensure the existing users table has the correct ENUM definition for the role column
    await pool.query(`
      ALTER TABLE users
      MODIFY role ENUM('patient', 'admin', 'dentist') DEFAULT 'patient'
    `)

    // Create appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        service VARCHAR(100) NOT NULL,
        dentist VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)

    // Check if updated_at column exists in appointments table too
    try {
      const [columns] = await pool.query(`
        SHOW COLUMNS FROM appointments LIKE 'updated_at'
      `)

      if (columns.length === 0) {
        // Column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE appointments
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `)
        console.log('Added updated_at column to appointments table')
      }
    } catch (error) {
      console.error(
        'Error checking/adding updated_at column to appointments:',
        error.message
      )
    }

    // Create dentists table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dentists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        specialization VARCHAR(100) DEFAULT '',
        bio TEXT,
        phone VARCHAR(20) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Check if dentists table has the required columns and add them if not
    try {
      // Check for phone column
      const [phoneColumns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'phone'
      `)

      if (phoneColumns.length === 0) {
        // phone column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE dentists
          ADD COLUMN phone VARCHAR(20) DEFAULT ''
        `)
        console.log('Added phone column to dentists table')
      }

      // Check for user_id column
      const [userIdColumns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'user_id'
      `)

      if (userIdColumns.length === 0) {
        // user_id column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE dentists
          ADD COLUMN user_id INT NOT NULL UNIQUE,
          ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `)
        console.log('Added user_id column to dentists table')
      }

      // Check for bio column
      const [bioColumns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'bio'
      `)

      if (bioColumns.length === 0) {
        // bio column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE dentists
          ADD COLUMN bio TEXT
        `)
        console.log('Added bio column to dentists table')
      }

      // Check if dentists table has a 'name' column and drop it if it exists
      const [nameColumns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'name'
      `)

      if (nameColumns.length > 0) {
        // The 'name' column exists but we don't need it, so drop it
        try {
          await pool.query(`
            ALTER TABLE dentists
            DROP COLUMN name
          `)
          console.log('Dropped unnecessary name column from dentists table')
        } catch (dropError) {
          console.error('Could not drop name column:', dropError.message)
          console.log('Will attempt to keep the column but make it optional')

          // Make the column optional by adding a default value
          await pool.query(`
            ALTER TABLE dentists
            MODIFY name VARCHAR(100) DEFAULT ''
          `)
          console.log('Made name column optional with default value')
        }
      }
    } catch (error) {
      console.error(
        'Error checking/updating dentists table structure:',
        error.message
      )
    }

    // Check if dentists table has the user_id column and add it if not
    try {
      const [columns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'user_id'
      `)

      if (columns.length === 0) {
        // user_id column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE dentists
          ADD COLUMN user_id INT NOT NULL UNIQUE,
          ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        `)
        console.log('Added user_id column to dentists table')
      }
    } catch (error) {
      console.error(
        'Error checking/adding user_id column to dentists:',
        error.message
      )
    }

    // Check if dentists table has the bio column and add it if not
    try {
      const [columns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'bio'
      `)

      if (columns.length === 0) {
        // bio column doesn't exist, so add it
        await pool.query(`
          ALTER TABLE dentists
          ADD COLUMN bio TEXT
        `)
        console.log('Added bio column to dentists table')
      }
    } catch (error) {
      console.error(
        'Error checking/adding bio column to dentists:',
        error.message
      )
    }

    // Check if dentists table has a 'name' column and drop it if it exists
    try {
      const [nameColumns] = await pool.query(`
        SHOW COLUMNS FROM dentists LIKE 'name'
      `)

      if (nameColumns.length > 0) {
        // The 'name' column exists but we don't need it, so drop it
        await pool.query(`
          ALTER TABLE dentists
          DROP COLUMN name
        `)
        console.log('Dropped unnecessary name column from dentists table')
      }
    } catch (error) {
      console.error(
        'Error checking/dropping name column from dentists:',
        error.message
      )
    }

    // Create dentist availability table
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

    // Create patient notes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS patient_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dentist_id INT NOT NULL,
        patient_id INT NOT NULL,
        appointment_id INT,
        notes TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
      )
    `)

    console.log('Database tables initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing database tables:', error.message)
    return false
  }
}

// additional Tables - commented out reference code
/*
CREATE TABLE dentists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specialization VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dentist_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason TEXT,
  status ENUM('pending', 'confirmed', 'canceled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
);

CREATE TABLE availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dentist_id INT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status ENUM('available', 'booked') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
);

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/
