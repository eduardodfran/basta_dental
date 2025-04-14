import bcrypt from 'bcrypt'
import { getPool } from '../config/db.js'

class User {
  /**
   * Find a user by email
   * @param {string} email - Email to search for
   * @returns {Object|null} - User object or null if not found
   */
  static async findOne({ email }) {
    try {
      const pool = getPool()
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
        email,
      ])
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error finding user:', error)
      throw error
    }
  }

  /**
   * Find a user by ID
   * @param {string} id - User ID to search for
   * @returns {Object|null} - User object or null if not found
   */
  static async findById(id) {
    try {
      const pool = getPool()
      const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error finding user by ID:', error)
      throw error
    }
  }

  /**
   * Find a user by name
   * @param {string} name - User name
   * @returns {Object|null} - User object or null if not found
   */
  static async findByName(name) {
    try {
      const pool = getPool()

      const [rows] = await pool.query('SELECT * FROM users WHERE name = ?', [
        name,
      ])

      if (rows.length === 0) {
        return null
      }

      return {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role,
      }
    } catch (error) {
      console.error('Error finding user by name:', error)
      throw error
    }
  }

  /**
   * Create a new user instance
   * @param {Object} userData - User data
   */
  constructor(userData) {
    this.name = userData.name
    this.email = userData.email
    this.password = userData.password
    this.dob = userData.dob
    this.phone = userData.phone || null
    this.gender = userData.gender || null
    this.address = userData.address || null
    this.role = userData.role || 'patient'
  }

  /**
   * Save user to the database
   */
  async save() {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)

      const pool = getPool()
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password, dob, phone, gender, address, role) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          this.name,
          this.email,
          this.password,
          this.dob,
          this.phone,
          this.gender,
          this.address,
          this.role,
        ]
      )

      this.id = result.insertId
      return this
    } catch (error) {
      console.error('Error saving user:', error)
      throw error
    }
  }

  /**
   * Compare a candidate password with the stored hash
   * @param {string} hashedPassword - Stored hashed password
   * @param {string} candidatePassword - Password to check
   * @returns {boolean} - True if passwords match
   */
  static async comparePassword(hashedPassword, candidatePassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword)
  }

  /**
   * Select user data without password
   * @param {string} id - User ID
   * @returns {Object|null} - User data without password or null if not found
   */
  static async findByIdWithoutPassword(id) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        'SELECT id, name, email, dob, phone, gender, address, role, created_at, updated_at FROM users WHERE id = ?',
        [id]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error finding user:', error)
      throw error
    }
  }

  /**
   * Update user profile
   * @param {number} id - User ID
   * @param {object} userData - Updated user data
   * @returns {object} - Updated user data
   */
  static async update(id, userData) {
    try {
      const pool = getPool()
      const { name, email, phone, dob, gender, address } = userData

      console.log(`Updating user ${id} with data:`, userData)

      // Remove updated_at reference since it doesn't exist in the table
      await pool.query(
        `UPDATE users 
         SET name = ?, email = ?, phone = ?, dob = ?, gender = ?, address = ?
         WHERE id = ?`,
        [name, email, phone, dob, gender, address, id]
      )

      console.log(`User ${id} updated successfully`)

      // Return updated user without password
      return this.findByIdWithoutPassword(id)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Find all users (for admin)
   * @returns {Array} - Array of user objects without passwords
   */
  static async findAll() {
    try {
      const pool = getPool()
      const [rows] = await pool.query(`
        SELECT id, name, email, dob, phone, gender, address, role, created_at 
        FROM users 
        ORDER BY created_at DESC
      `)
      return rows
    } catch (error) {
      console.error('Error finding all users:', error)
      throw error
    }
  }

  /**
   * Update user role
   * @param {number} id - User ID
   * @param {string} role - New role
   * @returns {object} - Updated user data
   */
  static async updateRole(id, role) {
    try {
      const pool = getPool()
      await pool.query(`UPDATE users SET role = ? WHERE id = ?`, [role, id])

      return this.findByIdWithoutPassword(id)
    } catch (error) {
      console.error('Error updating user role:', error)
      throw error
    }
  }

  /**
   * Find a dentist by user ID
   * @param {number} userId - User ID
   * @returns {Object|null} - Dentist object or null if not found
   */
  static async findDentistByUserId(userId) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        'SELECT * FROM dentists WHERE user_id = ?',
        [userId]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error finding dentist:', error)
      throw error
    }
  }

  /**
   * Add a user to the dentists table
   * @param {number} userId - User ID
   * @returns {Object} - Created dentist object
   */
  static async addUserToDentists(userId) {
    try {
      const pool = getPool()

      // First get the user's data
      const [userData] = await pool.query(
        'SELECT name, phone FROM users WHERE id = ?',
        [userId]
      )

      if (userData.length === 0) {
        throw new Error(`User with ID ${userId} not found`)
      }

      // Check if the dentist record already exists
      const [existingDentist] = await pool.query(
        'SELECT * FROM dentists WHERE user_id = ?',
        [userId]
      )

      if (existingDentist.length > 0) {
        return existingDentist[0] // Return existing record if found
      }

      try {
        // Get table structure to understand required fields
        const [columns] = await pool.query(`DESCRIBE dentists`)
        const columnNames = columns.map((col) => col.Field)
        const hasPhoneColumn = columnNames.includes('phone')
        const hasNameColumn = columnNames.includes('name')

        // Build the query dynamically based on table structure
        let query = 'INSERT INTO dentists (user_id, specialization, bio'
        let values = [userId, '', '']
        let placeholders = '?, ?, ?'

        if (hasPhoneColumn) {
          query += ', phone'
          placeholders += ', ?'
          values.push(userData[0].phone || '')
        }

        if (hasNameColumn) {
          query += ', name'
          placeholders += ', ?'
          values.push(userData[0].name || '')
        }

        query += ') VALUES (' + placeholders + ')'

        const [result] = await pool.query(query, values)

        const [dentist] = await pool.query(
          'SELECT * FROM dentists WHERE id = ?',
          [result.insertId]
        )

        return dentist[0]
      } catch (error) {
        console.error('Error adding user to dentists table:', error)

        // Fall back to specific queries if the dynamic approach fails
        if (error.code === 'ER_NO_DEFAULT_FOR_FIELD') {
          if (
            error.sqlMessage?.includes(
              "Field 'phone' doesn't have a default value"
            )
          ) {
            console.log('Table requires phone field, trying with phone value')
            const [result] = await pool.query(
              'INSERT INTO dentists (user_id, specialization, bio, phone) VALUES (?, ?, ?, ?)',
              [userId, '', '', userData[0].phone || '']
            )

            const [dentist] = await pool.query(
              'SELECT * FROM dentists WHERE id = ?',
              [result.insertId]
            )

            return dentist[0]
          } else if (
            error.sqlMessage?.includes(
              "Field 'name' doesn't have a default value"
            )
          ) {
            console.log('Table requires name field, trying with name value')
            const [result] = await pool.query(
              'INSERT INTO dentists (user_id, specialization, bio, name) VALUES (?, ?, ?, ?)',
              [userId, '', '', userData[0].name]
            )

            const [dentist] = await pool.query(
              'SELECT * FROM dentists WHERE id = ?',
              [result.insertId]
            )

            return dentist[0]
          } else if (
            error.sqlMessage?.includes(
              "Field 'phone' doesn't have a default value"
            ) &&
            error.sqlMessage?.includes(
              "Field 'name' doesn't have a default value"
            )
          ) {
            console.log('Table requires both phone and name fields')
            const [result] = await pool.query(
              'INSERT INTO dentists (user_id, specialization, bio, phone, name) VALUES (?, ?, ?, ?, ?)',
              [userId, '', '', userData[0].phone || '', userData[0].name]
            )

            const [dentist] = await pool.query(
              'SELECT * FROM dentists WHERE id = ?',
              [result.insertId]
            )

            return dentist[0]
          }
        }

        // If none of the specific error cases match, rethrow the error
        throw error
      }
    } catch (error) {
      console.error('Error adding user to dentists:', error)
      throw error
    }
  }

  /**
   * Update dentist profile
   * @param {number} dentistId - Dentist ID
   * @param {object} data - Dentist data (specialization, bio)
   * @returns {object} - Updated dentist object
   */
  static async updateDentistProfile(dentistId, data) {
    try {
      const pool = getPool()
      const { specialization, bio } = data

      console.log(`Updating dentist ${dentistId} with: `, {
        specialization,
        bio,
      })

      // Execute the update query
      await pool.query(
        'UPDATE dentists SET specialization = ?, bio = ? WHERE id = ?',
        [specialization, bio, dentistId]
      )

      // Verify the update by fetching the updated record
      const [rows] = await pool.query('SELECT * FROM dentists WHERE id = ?', [
        dentistId,
      ])

      if (rows.length === 0) {
        throw new Error(`No dentist found with id ${dentistId} after update`)
      }

      console.log('Updated dentist record:', rows[0])
      return rows[0]
    } catch (error) {
      console.error('Error updating dentist profile:', error)
      throw error
    }
  }

  /**
   * Get all dentists
   * @returns {Array} - Array of dentist objects with user info
   */
  static async getAllDentists() {
    try {
      const pool = getPool()
      const [rows] = await pool.query(`
        SELECT d.*, u.name, u.email, u.phone 
        FROM dentists d
        JOIN users u ON d.user_id = u.id
        WHERE u.role = 'dentist'
        ORDER BY u.name
      `)
      return rows
    } catch (error) {
      console.error('Error finding all dentists:', error)
      throw error
    }
  }

  /**
   * Find users by role
   * @param {string} role - User role to find (e.g., 'dentist')
   * @returns {Array} - Array of user objects
   */
  static async findByRole(role) {
    try {
      const pool = getPool()

      // If querying for dentists, join with the dentists table to get specialization
      if (role === 'dentist') {
        const [rows] = await pool.query(
          `
          SELECT u.id, u.name, u.email, u.phone, u.role, d.specialization, d.bio 
          FROM users u
          LEFT JOIN dentists d ON u.id = d.user_id
          WHERE u.role = ?
          ORDER BY u.name
        `,
          [role]
        )

        return rows
      } else {
        // For other roles, just query the users table
        const [rows] = await pool.query(
          'SELECT id, name, email, phone, role, created_at FROM users WHERE role = ?',
          [role]
        )

        return rows
      }
    } catch (error) {
      console.error('Error finding users by role:', error)
      throw error
    }
  }
}

export default User
