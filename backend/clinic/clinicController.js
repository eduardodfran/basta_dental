import { getPool } from '../config/db.js'
import initClinicTables from '../config/initClinicTables.js'

// Add an initialization function to be called on first access
async function ensureTablesExist() {
  try {
    const pool = getPool()

    // Check if the tables exist
    const [permanentTable] = await pool.query(`
      SHOW TABLES LIKE 'clinic_permanent_unavailability'
    `)

    const [temporaryTable] = await pool.query(`
      SHOW TABLES LIKE 'clinic_temporary_unavailability'
    `)

    // If either table doesn't exist, run the initialization
    if (permanentTable.length === 0 || temporaryTable.length === 0) {
      console.log('Clinic tables missing. Running initialization...')
      await initClinicTables()
    }
  } catch (error) {
    console.error('Error checking clinic tables:', error)
    // Still going to try to initialize
    await initClinicTables()
  }
}

/**
 * Set permanent unavailability for the clinic (specific days of the week)
 */
export const setPermanentUnavailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const { daysOfWeek } = req.body

    // Validate required fields
    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Days of week array is required',
      })
    }

    const pool = getPool()
    const results = []

    // First, clear all existing permanent unavailability
    await pool.query('DELETE FROM clinic_permanent_unavailability')

    // Process each day of week
    for (const dayOfWeek of daysOfWeek) {
      // Validate day of week (0-6)
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        continue // Skip invalid days
      }

      // Insert new record
      const [result] = await pool.query(
        'INSERT INTO clinic_permanent_unavailability (day_of_week) VALUES (?)',
        [dayOfWeek]
      )

      results.push({
        id: result.insertId,
        dayOfWeek,
      })
    }

    res.json({
      success: true,
      message: 'Clinic permanent unavailability set successfully',
      permanentUnavailability: results,
    })
  } catch (error) {
    console.error('Set clinic permanent unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get permanent unavailability for the clinic
 */
export const getPermanentUnavailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const pool = getPool()

    const [rows] = await pool.query(
      'SELECT * FROM clinic_permanent_unavailability ORDER BY day_of_week'
    )

    const permanentUnavailability = rows.map((row) => ({
      id: row.id,
      dayOfWeek: row.day_of_week,
      reason: row.reason,
    }))

    res.json({
      success: true,
      permanentUnavailability,
    })
  } catch (error) {
    console.error('Get clinic permanent unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Delete permanent unavailability for the clinic
 */
export const deletePermanentUnavailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const { dayId } = req.params

    if (!dayId) {
      return res.status(400).json({
        success: false,
        message: 'Day ID is required',
      })
    }

    const pool = getPool()

    // First check if the day exists
    const [existingDay] = await pool.query(
      'SELECT * FROM clinic_permanent_unavailability WHERE id = ?',
      [dayId]
    )

    if (existingDay.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Permanent closure day not found',
      })
    }

    // Delete the permanent unavailability
    await pool.query(
      'DELETE FROM clinic_permanent_unavailability WHERE id = ?',
      [dayId]
    )

    res.json({
      success: true,
      message: 'Clinic permanent unavailability deleted successfully',
    })
  } catch (error) {
    console.error('Delete clinic permanent unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Set temporary unavailability for the clinic (specific date range)
 */
export const setTemporaryUnavailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const { startDate, endDate, reason } = req.body

    // Validate required fields
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required',
      })
    }

    const pool = getPool()

    const [result] = await pool.query(
      'INSERT INTO clinic_temporary_unavailability (start_date, end_date, reason) VALUES (?, ?, ?)',
      [startDate, endDate, reason]
    )

    res.json({
      success: true,
      message: 'Clinic temporary unavailability set successfully',
      temporaryUnavailability: {
        id: result.insertId,
        startDate,
        endDate,
        reason,
      },
    })
  } catch (error) {
    console.error('Set clinic temporary unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get temporary unavailability for the clinic
 */
export const getTemporaryUnavailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const pool = getPool()

    const [rows] = await pool.query(
      'SELECT * FROM clinic_temporary_unavailability ORDER BY start_date'
    )

    const temporaryUnavailability = rows.map((row) => ({
      id: row.id,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason,
      created_at: row.created_at,
    }))

    res.json({
      success: true,
      temporaryUnavailability,
    })
  } catch (error) {
    console.error('Get clinic temporary unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Delete temporary unavailability for the clinic
 */
export const deleteTemporaryUnavailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const { id } = req.params

    const pool = getPool()

    await pool.query(
      'DELETE FROM clinic_temporary_unavailability WHERE id = ?',
      [id]
    )

    res.json({
      success: true,
      message: 'Clinic temporary unavailability deleted successfully',
    })
  } catch (error) {
    console.error('Delete clinic temporary unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Check if a date is unavailable for the entire clinic
 */
export const checkDateAvailability = async (req, res) => {
  try {
    // Ensure tables exist before proceeding
    await ensureTablesExist()

    const { date } = req.query

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required',
      })
    }

    const pool = getPool()

    // Parse the date to check the day of week
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      })
    }

    const dayOfWeek = dateObj.getDay() // 0-6 (Sunday-Saturday)

    // Check if the day of week is permanently unavailable
    const [permanentRows] = await pool.query(
      'SELECT * FROM clinic_permanent_unavailability WHERE day_of_week = ?',
      [dayOfWeek]
    )

    if (permanentRows.length > 0) {
      return res.json({
        success: true,
        available: false,
        reason: 'This day of the week the clinic is permanently closed',
      })
    }

    // Check temporary unavailability for this specific date
    const formattedDate = date.split('T')[0] // Format: YYYY-MM-DD
    const [tempRows] = await pool.query(
      `SELECT * FROM clinic_temporary_unavailability 
       WHERE start_date <= ? AND (end_date >= ? OR end_date IS NULL)`,
      [formattedDate, formattedDate]
    )

    if (tempRows.length > 0) {
      return res.json({
        success: true,
        available: false,
        reason:
          tempRows[0].reason || 'The clinic is temporarily closed on this date',
      })
    }

    // If we reach here, the clinic is available on this date
    return res.json({
      success: true,
      available: true,
    })
  } catch (error) {
    console.error('Check clinic availability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
