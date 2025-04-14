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
    // Assuming these columns exist in the DB schema
    this.transferStatus = appointmentData.transferStatus || 'pending'
    this.originalDentist = appointmentData.originalDentist || null
  }

  /**
   * Save appointment to the database
   * @returns {Object} - Created appointment data with ID
   */
  async save() {
    try {
      const pool = getPool()
      // Ensure transfer_status and original_dentist are included if they exist in the table
      const [result] = await pool.query(
        `INSERT INTO appointments (user_id, service, dentist, date, time, status, notes, transfer_status, original_dentist) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          this.userId,
          this.service,
          this.dentist,
          this.date,
          this.time,
          this.status,
          this.notes,
          this.transferStatus, // Add transfer status
          this.originalDentist, // Add original dentist
        ]
      )

      this.id = result.insertId
      // Use the class name instead of this to call static method
      return Appointment.findById(this.id)
    } catch (error) {
      // Handle potential errors if columns don't exist yet
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.warn(
          'Transfer columns (transfer_status, original_dentist) might be missing. Trying save without them.'
        )
        // Try saving without transfer columns
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
        return Appointment.findById(this.id)
      }
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
      // Select all columns, including potential transfer columns
      const [rows] = await pool.query(
        `SELECT a.*, u.name as userName 
         FROM appointments a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,
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
   * Check if a time slot is available, excluding current appointment
   * @param {string} date - Appointment date
   * @param {string} time - Appointment time
   * @param {string} dentist - Dentist name
   * @param {number} appointmentId - Current appointment ID to exclude
   * @returns {boolean} - True if slot is available
   */
  static async isTimeSlotAvailableExcludingCurrentAppointment(
    date,
    time,
    dentist,
    appointmentId
  ) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM appointments 
         WHERE date = ? AND time = ? AND dentist = ? 
         AND id != ?
         AND status != 'cancelled'`,
        [date, time, dentist, appointmentId]
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
   * Assign appointment to a dentist and update transfer status
   * @param {number} id - Appointment ID
   * @param {string} dentistName - Dentist name
   * @param {number} dentistId - Dentist user ID (optional)
   * @param {string} transferStatus - New transfer status (e.g., 'accepted', 'pending')
   * @returns {Object} - Updated appointment
   */
  static async assignToDentist(
    id,
    dentistName,
    dentistId = null,
    transferStatus = 'accepted' // Default to 'accepted' when assigning
  ) {
    try {
      const pool = getPool()

      // Update appointment dentist and transfer status
      // Assuming transfer_status column exists
      await pool.query(
        'UPDATE appointments SET dentist = ?, transfer_status = ? WHERE id = ?',
        [dentistName, transferStatus, id]
      )

      // Get updated appointment
      return this.findById(id)
    } catch (error) {
      // Handle potential errors if transfer_status column doesn't exist yet
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.warn(
          'Transfer_status column might be missing. Assigning dentist without updating transfer status.'
        )
        const pool = getPool()
        await pool.query('UPDATE appointments SET dentist = ? WHERE id = ?', [
          dentistName,
          id,
        ])
        return this.findById(id)
      }
      console.error('Error assigning appointment to dentist:', error)
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
      // Include transfer_status and original_dentist if they exist
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

  /**
   * Update payment information for an appointment
   * @param {number} id - Appointment ID
   * @param {string} downpaymentStatus - New downpayment status
   * @param {string} paymentMethod - Payment method used
   * @returns {Object} - Updated appointment
   */
  static async updatePayment(id, downpaymentStatus, paymentMethod) {
    try {
      const pool = getPool()

      // First, verify if the columns exist in the table
      const [columns] = await pool.query('SHOW COLUMNS FROM appointments')
      const columnNames = columns.map((col) => col.Field)
      const hasDownpaymentStatus = columnNames.includes('downpayment_status')
      const hasPaymentMethod = columnNames.includes('payment_method')
      const hasPaymentStatus = columnNames.includes('payment_status')

      // Build the query based on available columns
      let query = `UPDATE appointments SET `
      const queryParams = []

      if (hasDownpaymentStatus) {
        query += `downpayment_status = ?`
        queryParams.push(downpaymentStatus)
      } else if (hasPaymentStatus) {
        // Fall back to payment_status if it exists
        query += `payment_status = ?`
        queryParams.push(downpaymentStatus)
      } else {
        // If neither column exists, use the status column to mark as confirmed
        query += `status = 'confirmed'`
      }

      if (hasPaymentMethod) {
        if (queryParams.length > 0) query += `, `
        query += `payment_method = ?`
        queryParams.push(paymentMethod)
      }

      query += ` WHERE id = ?`
      queryParams.push(id)

      // Execute the query with available columns
      await pool.query(query, queryParams)

      return this.findById(id)
    } catch (error) {
      console.error('Error updating appointment payment:', error)
      throw error
    }
  }

  /**
   * Update payment method for an appointment
   * @param {number} id - Appointment ID
   * @param {string} paymentMethod - New payment method
   * @returns {Object} - Updated appointment
   */
  static async updatePaymentMethod(id, paymentMethod) {
    try {
      const pool = getPool()

      // Update notes to include payment method information
      await pool.query(
        `UPDATE appointments 
         SET notes = CONCAT(IFNULL(notes, ''), '\n[Payment Method: ', ?, ']')
         WHERE id = ?`,
        [paymentMethod, id]
      )

      return this.findById(id)
    } catch (error) {
      console.error('Error updating payment method:', error)
      throw error
    }
  }

  /**
   * Mark an appointment as available for transfer
   * @param {number} id - Appointment ID
   * @param {string} originalDentist - Name of the dentist making it available
   * @returns {Object} - Updated appointment
   */
  static async markAsTransferable(id, originalDentist) {
    try {
      const pool = getPool()

      // Update appointment to make it available for transfer
      await pool.query(
        `UPDATE appointments 
         SET transfer_status = 'available', original_dentist = ? 
         WHERE id = ?`,
        [originalDentist, id]
      )

      return this.findById(id)
    } catch (error) {
      console.error('Error marking appointment as transferable:', error)
      throw error
    }
  }

  /**
   * Find all appointments available for transfer
   * @returns {Array} - Array of appointment objects
   */
  static async findTransferable() {
    try {
      const pool = getPool()

      // Get all appointments marked as available for transfer
      const [rows] = await pool.query(`
        SELECT a.*, u.name as userName 
        FROM appointments a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.transfer_status = 'available'
        AND a.status != 'cancelled'
        AND a.status != 'completed'
        ORDER BY a.date ASC, a.time ASC
      `)

      return rows
    } catch (error) {
      console.error('Error finding transferable appointments:', error)
      throw error
    }
  }

  /**
   * Accept a transfer and assign appointment to a new dentist
   * @param {number} id - Appointment ID
   * @param {string} dentistName - New dentist name
   * @param {number|null} dentistId - New dentist ID (optional)
   * @returns {Object} - Updated appointment
   */
  static async acceptTransfer(id, dentistName, dentistId = null) {
    try {
      const pool = getPool()

      // Update appointment with new dentist and mark transfer as accepted
      await pool.query(
        `UPDATE appointments 
         SET dentist = ?, transfer_status = 'accepted' 
         WHERE id = ?`,
        [dentistName, id]
      )

      return this.findById(id)
    } catch (error) {
      console.error('Error accepting appointment transfer:', error)
      throw error
    }
  }
}

export default Appointment
