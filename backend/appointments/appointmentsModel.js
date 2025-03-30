import { getPool } from '../config/db.js'

class Appointment {
  /**
   * Create a new appointment instance
   * @param {Object} appointmentData - Appointment data
   */
  constructor(appointmentData) {
    this.userId = appointmentData.userId
    this.service = appointmentData.service
    this.dentist = appointmentData.dentist
    this.date = appointmentData.date
    this.time = appointmentData.time
    this.status = appointmentData.status || 'pending'
    this.notes = appointmentData.notes || ''
  }

  /**
   * Save appointment to the database
   * @returns {Object} - Created appointment data with ID
   */
  async save() {
    try {
      const pool = getPool()
      const [result] = await pool.query(
        `INSERT INTO appointments (user_id, service, dentist, date, time, status, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          this.userId,
          this.service,
          this.dentist,
          this.date,
          this.time,
          this.status,
          this.notes,
        ]
      )

      this.id = result.insertId
      // Use the class name instead of this to call static method
      return Appointment.findById(this.id)
    } catch (error) {
      console.error('Error saving appointment:', error)
      throw error
    }
  }

  /**
   * Find appointment by ID
   * @param {number} id - Appointment ID
   * @returns {Object|null} - Appointment object or null if not found
   */
  static async findById(id) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        `SELECT * FROM appointments WHERE id = ?`,
        [id]
      )
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      console.error('Error finding appointment:', error)
      throw error
    }
  }

  /**
   * Find all appointments for a user
   * @param {number} userId - User ID
   * @returns {Array} - Array of appointment objects
   */
  static async findByUserId(userId) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        `SELECT * FROM appointments 
         WHERE user_id = ? 
         ORDER BY date ASC, time ASC`,
        [userId]
      )
      return rows
    } catch (error) {
      console.error('Error finding user appointments:', error)
      throw error
    }
  }

  /**
   * Check if a time slot is available
   * @param {string} date - Appointment date
   * @param {string} time - Appointment time
   * @param {string} dentist - Dentist name
   * @returns {boolean} - True if slot is available
   */
  static async isTimeSlotAvailable(date, time, dentist) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM appointments 
         WHERE date = ? AND time = ? AND dentist = ? 
         AND status != 'cancelled'`,
        [date, time, dentist]
      )

      return rows[0].count === 0
    } catch (error) {
      console.error('Error checking time slot availability:', error)
      throw error
    }
  }

  /**
   * Get all appointments for a specific date
   * @param {string} date - Date to check
   * @param {string} dentist - Dentist name
   * @returns {Array} - Array of booked time slots
   */
  static async getBookedTimeSlots(date, dentist) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        `SELECT time 
         FROM appointments 
         WHERE date = ? AND dentist = ? 
         AND status != 'cancelled'`,
        [date, dentist]
      )

      return rows.map((row) => row.time)
    } catch (error) {
      console.error('Error getting booked time slots:', error)
      throw error
    }
  }

  /**
   * Update appointment status
   * @param {number} id - Appointment ID
   * @param {string} status - New status
   * @returns {Object} - Updated appointment
   */
  static async updateStatus(id, status) {
    try {
      const pool = getPool()
      await pool.query(
        `UPDATE appointments 
         SET status = ? 
         WHERE id = ?`,
        [status, id]
      )

      return this.findById(id)
    } catch (error) {
      console.error('Error updating appointment status:', error)
      throw error
    }
  }

  /**
   * Reschedule an appointment
   * @param {number} id - Appointment ID
   * @param {string} date - New date
   * @param {string} time - New time
   * @returns {Object} - Updated appointment
   */
  static async reschedule(id, date, time) {
    try {
      const pool = getPool()
      await pool.query(
        `UPDATE appointments 
         SET date = ?, time = ? 
         WHERE id = ?`,
        [date, time, id]
      )

      return this.findById(id)
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      throw error
    }
  }

  /**
   * Find all appointments
   * @returns {Array} - Array of appointment objects
   */
  static async findAll() {
    try {
      const pool = getPool()
      const [appointments] = await pool.query(`
        SELECT a.*, u.name as userName 
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.date DESC, a.time ASC
      `)

      return appointments
    } catch (error) {
      console.error('Error finding all appointments:', error)
      throw error
    }
  }

  /**
   * Find appointments by dentist name
   * @param {string} dentistName - Dentist name
   * @returns {Array} - Array of appointment objects
   */
  static async findByDentistName(dentistName) {
    try {
      const pool = getPool()
      const [rows] = await pool.query(
        `SELECT a.*, u.name as userName 
         FROM appointments a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.dentist = ? 
         ORDER BY a.date ASC, a.time ASC`,
        [dentistName]
      )
      return rows
    } catch (error) {
      console.error('Error finding dentist appointments:', error)
      throw error
    }
  }
}

export default Appointment
