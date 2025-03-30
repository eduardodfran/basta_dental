import { getPool } from '../config/db.js'
import Appointment from '../appointments/appointmentsModel.js'
import User from '../user/userModel.js'

/**
 * Get analytics data for admin dashboard
 */
export const getAnalyticsData = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      })
    }

    // Get analytics data
    const pool = getPool()

    // Total appointments in date range
    const [appointmentsResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM appointments 
       WHERE date BETWEEN ? AND ?`,
      [startDate, endDate]
    )
    const totalAppointments = appointmentsResult[0].count

    // New users in date range
    const [usersResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM users 
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    )
    const newUsers = usersResult[0].count

    // Completion rate
    const [completedResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM appointments 
       WHERE status = 'completed' AND date BETWEEN ? AND ?`,
      [startDate, endDate]
    )
    const completionRate =
      totalAppointments > 0
        ? Math.round((completedResult[0].count / totalAppointments) * 100)
        : 0

    // Cancellation rate
    const [cancelledResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM appointments 
       WHERE status = 'cancelled' AND date BETWEEN ? AND ?`,
      [startDate, endDate]
    )
    const cancellationRate =
      totalAppointments > 0
        ? Math.round((cancelledResult[0].count / totalAppointments) * 100)
        : 0

    res.json({
      success: true,
      totalAppointments,
      newUsers,
      completionRate,
      cancellationRate,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
