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
}

export default DentistAvailability
