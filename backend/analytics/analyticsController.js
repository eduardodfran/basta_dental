import { getPool } from '../config/db.js'
import Appointment from '../appointments/appointmentsModel.js' // Corrected path
import User from '../user/userModel.js'

// Helper function to format date for SQL (YYYY-MM-DD)
const formatDateForSQL = (date) => {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

export const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const pool = getPool()

    // --- Build WHERE clause for dates ---
    let dateWhereClause = ''
    const dateParams = []
    if (startDate && endDate) {
      dateWhereClause = 'WHERE a.date BETWEEN ? AND ?'
      dateParams.push(startDate, endDate)
    } else if (startDate) {
      dateWhereClause = 'WHERE a.date >= ?'
      dateParams.push(startDate)
    } else if (endDate) {
      dateWhereClause = 'WHERE a.date <= ?'
      dateParams.push(endDate)
    }

    // --- Queries ---
    // 1. Appointments by Status
    const [statusResults] = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM appointments a 
       ${dateWhereClause.replace('a.date', 'date')} 
       GROUP BY status`,
      dateParams // Use dateParams here too
    )

    // 2. Appointments by Service
    const [serviceResults] = await pool.query(
      `SELECT service, COUNT(*) as count 
       FROM appointments a 
       ${dateWhereClause} 
       GROUP BY service`,
      dateParams
    )

    // 3. Appointments by Day of Week
    const [dayResults] = await pool.query(
      `SELECT DAYOFWEEK(a.date) as dayOfWeek, COUNT(*) as count 
       FROM appointments a 
       ${dateWhereClause} 
       GROUP BY dayOfWeek`,
      dateParams
    )

    // 4. Users (Total and by Role)
    const [userResults] = await pool.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    )

    // 5. New Users within the date range
    let newUserWhereClause = ''
    const newUserDateParams = []
    if (startDate && endDate) {
      newUserWhereClause = 'WHERE created_at BETWEEN ? AND ?'
      newUserDateParams.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`)
    } else if (startDate) {
      newUserWhereClause = 'WHERE created_at >= ?'
      newUserDateParams.push(`${startDate} 00:00:00`)
    } else if (endDate) {
      newUserWhereClause = 'WHERE created_at <= ?'
      newUserDateParams.push(`${endDate} 23:59:59`)
    }
    // Only count new patients
    newUserWhereClause += newUserWhereClause ? ' AND ' : 'WHERE '
    newUserWhereClause += "role = 'patient'"

    const [newUsersResult] = await pool.query(
      `SELECT COUNT(*) as count FROM users ${newUserWhereClause}`,
      newUserDateParams
    )
    const newPatientsCount = newUsersResult[0].count

    // --- Process Results ---
    // Status
    const appointmentsByStatus = {
      pending: 0,
      confirmed: 0,
      cancelled: 0,
      completed: 0,
    }
    let totalAppointments = 0
    statusResults.forEach((row) => {
      if (appointmentsByStatus.hasOwnProperty(row.status)) {
        appointmentsByStatus[row.status] = row.count
      }
      totalAppointments += row.count
    })

    // Services
    const appointmentsByService = serviceResults.map((row) => ({
      service: row.service,
      count: row.count,
    }))

    // Days (Ensure all days 0-6 are present, even if count is 0)
    const appointmentsByDay = Array(7).fill(0) // Index 0 = Sunday, ..., 6 = Saturday
    dayResults.forEach((row) => {
      // DAYOFWEEK returns 1 for Sunday, 7 for Saturday. Adjust to 0-6.
      const zeroBasedDay = row.dayOfWeek - 1
      if (zeroBasedDay >= 0 && zeroBasedDay < 7) {
        appointmentsByDay[zeroBasedDay] = row.count
      }
    })

    // Users
    let totalUsers = 0
    let totalDentists = 0
    userResults.forEach((row) => {
      if (row.role === 'dentist') {
        totalDentists = row.count
      }
      totalUsers += row.count
    })

    res.json({
      success: true,
      analytics: {
        totalAppointments,
        appointmentsByStatus,
        appointmentsByService,
        appointmentsByDay,
        totalUsers,
        totalDentists,
        newPatients: newPatientsCount, // Add new patients count
      },
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
