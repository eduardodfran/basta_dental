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
        role ENUM('patient', 'admin', 'staff') DEFAULT 'patient',
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
      MODIFY role ENUM('patient', 'admin', 'staff') DEFAULT 'patient'
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

    console.log('Database tables initialized successfully')
    return true
  } catch (error) {
    console.error('Error initializing database tables:', error.message)
    return false
  }
}


// additional Tables

// CREATE TABLE dentists (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   name VARCHAR(255) NOT NULL,
//   specialization VARCHAR(255),
//   phone VARCHAR(20) NOT NULL,
//   email VARCHAR(255),
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );


// CREATE TABLE appointments (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   dentist_id INT NOT NULL,
//   date DATE NOT NULL,
//   time TIME NOT NULL,
//   reason TEXT,
//   status ENUM('pending', 'confirmed', 'canceled') DEFAULT 'pending',
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//   FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
// );

// CREATE TABLE availability (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   dentist_id INT NOT NULL,
//   date DATE NOT NULL,
//   time TIME NOT NULL,
//   status ENUM('available', 'booked') DEFAULT 'available',
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   FOREIGN KEY (dentist_id) REFERENCES dentists(id) ON DELETE CASCADE
// );

// CREATE TABLE contact_messages (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   name VARCHAR(255) NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   message TEXT NOT NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
