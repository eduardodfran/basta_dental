import { getPool } from '../config/db.js'

class DentistAvailability {
  /**
   * Set availability for a dentist
   * @param {number} dentistId - Dentist ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {string} timeStart - Start time (HH:MM)
   * @param {string} timeEnd - End time (HH:MM)
   * @returns {Object} - Created or updated availability
   */
  static async setAvailability(dentistId, date, timeStart, timeEnd) {
    try {
      const pool = getPool()

      // Check if availability for this date already exists
      const [existing] = await pool.query(
        'SELECT * FROM dentist_availability WHERE dentist_id = ? AND date = ?',
        [dentistId, date]
      )

      if (existing.length > 0) {
        // Update existing
        await pool.query(
          'UPDATE dentist_availability SET time_start = ?, time_end = ? WHERE id = ?',
          [timeStart, timeEnd, existing[0].id]
        )

        return {
          id: existing[0].id,
          dentistId,
          date,
          timeStart,
          timeEnd,
        }
      } else {
        // Insert new
        const [result] = await pool.query(
          'INSERT INTO dentist_availability (dentist_id, date, time_start, time_end) VALUES (?, ?, ?, ?)',
          [dentistId, date, timeStart, timeEnd]
        )

        return {
          id: result.insertId,
          dentistId,
          date,
          timeStart,
          timeEnd,
        }
      }
    } catch (error) {
      console.error('Error setting availability:', error)
      throw error
    }
  }

  /**
   * Get all availability for a dentist
   * @param {number} dentistId - Dentist ID
   * @returns {Array} - Array of availability objects
   */
  static async getByDentistId(dentistId) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        'SELECT * FROM dentist_availability WHERE dentist_id = ? ORDER BY date',
        [dentistId]
      )

      return rows.map((row) => ({
        id: row.id,
        dentistId: row.dentist_id,
        date: row.date,
        timeStart: row.time_start,
        timeEnd: row.time_end,
      }))
    } catch (error) {
      console.error('Error getting availability:', error)
      throw error
    }
  }

  /**
   * Save patient notes
   * @param {number} dentistId - Dentist ID
   * @param {number} patientId - Patient ID
   * @param {number} appointmentId - Appointment ID (optional)
   * @param {string} notes - Notes content
   * @returns {Object} - Created or updated notes
   */
  static async savePatientNotes(dentistId, patientId, appointmentId, notes) {
    try {
      const pool = getPool()

      // Check if notes for this appointment already exist
      let existing = null
      if (appointmentId) {
        ;[existing] = await pool.query(
          'SELECT * FROM patient_notes WHERE dentist_id = ? AND patient_id = ? AND appointment_id = ?',
          [dentistId, patientId, appointmentId]
        )
      } else {
        ;[existing] = await pool.query(
          'SELECT * FROM patient_notes WHERE dentist_id = ? AND patient_id = ? AND appointment_id IS NULL',
          [dentistId, patientId]
        )
      }

      if (existing && existing.length > 0) {
        // Update existing
        await pool.query('UPDATE patient_notes SET notes = ? WHERE id = ?', [
          notes,
          existing[0].id,
        ])

        return {
          id: existing[0].id,
          dentistId,
          patientId,
          appointmentId,
          notes,
        }
      } else {
        // Insert new
        const [result] = await pool.query(
          'INSERT INTO patient_notes (dentist_id, patient_id, appointment_id, notes) VALUES (?, ?, ?, ?)',
          [dentistId, patientId, appointmentId, notes]
        )

        return {
          id: result.insertId,
          dentistId,
          patientId,
          appointmentId,
          notes,
        }
      }
    } catch (error) {
      console.error('Error saving patient notes:', error)
      throw error
    }
  }

  /**
   * Get patient notes
   * @param {number} dentistId - Dentist ID
   * @param {number} patientId - Patient ID
   * @returns {Array} - Array of notes objects
   */
  static async getPatientNotes(dentistId, patientId) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        `SELECT n.*, a.date as appointment_date, a.time as appointment_time, a.service 
         FROM patient_notes n
         LEFT JOIN appointments a ON n.appointment_id = a.id
         WHERE n.dentist_id = ? AND n.patient_id = ?
         ORDER BY n.created_at DESC`,
        [dentistId, patientId]
      )

      return rows
    } catch (error) {
      console.error('Error getting patient notes:', error)
      throw error
    }
  }

  /**
   * Set permanent unavailability for a dentist (specific days of week)
   * @param {number} dentistId - Dentist ID
   * @param {Array<number>} daysOfWeek - Array of days (0-6 for Sunday-Saturday)
   * @returns {Array} - Array of created unavailability records
   */
  static async setPermanentUnavailability(dentistId, daysOfWeek) {
    try {
      const pool = getPool()
      const results = []

      // Process each day of week
      for (const dayOfWeek of daysOfWeek) {
        // Check if this day is already marked unavailable
        const [existing] = await pool.query(
          'SELECT * FROM dentist_permanent_unavailability WHERE dentist_id = ? AND day_of_week = ?',
          [dentistId, dayOfWeek]
        )

        // If not already marked as unavailable, insert it
        if (existing.length === 0) {
          const [result] = await pool.query(
            'INSERT INTO dentist_permanent_unavailability (dentist_id, day_of_week) VALUES (?, ?)',
            [dentistId, dayOfWeek]
          )

          results.push({
            id: result.insertId,
            dentistId,
            dayOfWeek,
          })
        } else {
          // Already exists, add to results
          results.push({
            id: existing[0].id,
            dentistId,
            dayOfWeek: existing[0].day_of_week,
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error setting permanent unavailability:', error)
      throw error
    }
  }

  /**
   * Get permanent unavailability for a dentist
   * @param {number} dentistId - Dentist ID
   * @returns {Array} - Array of permanent unavailability records
   */
  static async getPermanentUnavailability(dentistId) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        'SELECT * FROM dentist_permanent_unavailability WHERE dentist_id = ? ORDER BY day_of_week',
        [dentistId]
      )

      return rows.map((row) => ({
        id: row.id,
        dentistId: row.dentist_id,
        dayOfWeek: row.day_of_week,
      }))
    } catch (error) {
      console.error('Error getting permanent unavailability:', error)
      throw error
    }
  }

  /**
   * Get permanent unavailability for a specific day of week
   * @param {number} dentistId - Dentist ID
   * @param {number} dayOfWeek - Day of week (0-6 for Sunday-Saturday)
   * @returns {Array} - Array of permanent unavailability objects for this day
   */
  static async getPermanentUnavailabilityByDayOfWeek(dentistId, dayOfWeek) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        'SELECT * FROM dentist_permanent_unavailability WHERE dentist_id = ? AND day_of_week = ?',
        [dentistId, dayOfWeek]
      )

      return rows.map((row) => ({
        id: row.id,
        dentistId: row.dentist_id,
        dayOfWeek: row.day_of_week,
      }))
    } catch (error) {
      console.error('Error getting permanent unavailability by day:', error)
      throw error
    }
  }

  /**
   * Delete permanent unavailability for a dentist
   * @param {number} dentistId - Dentist ID
   * @param {number} dayId - Unavailability record ID
   * @returns {boolean} - True if deleted successfully
   */
  static async deletePermanentUnavailability(dentistId, dayId) {
    try {
      const pool = getPool()

      await pool.query(
        'DELETE FROM dentist_permanent_unavailability WHERE id = ? AND dentist_id = ?',
        [dayId, dentistId]
      )

      return true
    } catch (error) {
      console.error('Error deleting permanent unavailability:', error)
      throw error
    }
  }

  /**
   * Set temporary unavailability for a dentist (specific date range)
   * @param {number} dentistId - Dentist ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD) - Optional
   * @param {string} reason - Reason for unavailability - Optional
   * @returns {Object} - Created unavailability record
   */
  static async setTemporaryUnavailability(
    dentistId,
    startDate,
    endDate = null,
    reason = null
  ) {
    try {
      const pool = getPool()

      const [result] = await pool.query(
        'INSERT INTO dentist_temporary_unavailability (dentist_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)',
        [dentistId, startDate, endDate, reason]
      )

      return {
        id: result.insertId,
        dentistId,
        startDate,
        endDate,
        reason,
      }
    } catch (error) {
      console.error('Error setting temporary unavailability:', error)
      throw error
    }
  }

  /**
   * Check if a specific date falls within any temporary unavailability periods
   * @param {number} dentistId - Dentist ID
   * @param {string} date - Date to check (YYYY-MM-DD)
   * @returns {Object|null} - Temporary unavailability object if found, null otherwise
   */
  static async checkDateInTemporaryUnavailability(dentistId, date) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        `SELECT * FROM dentist_temporary_unavailability 
         WHERE dentist_id = ? 
         AND start_date <= ? 
         AND (end_date >= ? OR end_date IS NULL)`,
        [dentistId, date, date]
      )

      if (rows.length === 0) {
        return null
      }

      return {
        id: rows[0].id,
        dentistId: rows[0].dentist_id,
        startDate: rows[0].start_date,
        endDate: rows[0].end_date,
        reason: rows[0].reason,
      }
    } catch (error) {
      console.error('Error checking temporary unavailability:', error)
      throw error
    }
  }

  /**
   * Get temporary unavailability for a dentist
   * @param {number} dentistId - Dentist ID
   * @returns {Array} - Array of temporary unavailability records
   */
  static async getTemporaryUnavailability(dentistId) {
    try {
      const pool = getPool()

      const [rows] = await pool.query(
        'SELECT * FROM dentist_temporary_unavailability WHERE dentist_id = ? ORDER BY start_date',
        [dentistId]
      )

      return rows.map((row) => ({
        id: row.id,
        dentistId: row.dentist_id,
        startDate: row.start_date,
        endDate: row.end_date,
        reason: row.reason,
        createdAt: row.created_at,
      }))
    } catch (error) {
      console.error('Error getting temporary unavailability:', error)
      throw error
    }
  }

  /**
   * Delete temporary unavailability for a dentist
   * @param {number} dentistId - Dentist ID
   * @param {number} unavailabilityId - Unavailability record ID
   * @returns {boolean} - True if deleted successfully
   */
  static async deleteTemporaryUnavailability(dentistId, unavailabilityId) {
    try {
      const pool = getPool()

      await pool.query(
        'DELETE FROM dentist_temporary_unavailability WHERE id = ? AND dentist_id = ?',
        [unavailabilityId, dentistId]
      )

      return true
    } catch (error) {
      console.error('Error deleting temporary unavailability:', error)
      throw error
    }
  }
}

export default DentistAvailability
