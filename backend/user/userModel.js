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

      await pool.query(
        `UPDATE users 
         SET name = ?, email = ?, phone = ?, dob = ?, gender = ?, address = ? 
         WHERE id = ?`,
        [name, email, phone, dob, gender, address, id]
      )

      // Return updated user without password
      return this.findByIdWithoutPassword(id)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }
}

export default User
