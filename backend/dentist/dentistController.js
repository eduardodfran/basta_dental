import DentistAvailability from './dentistModel.js'
import User from '../user/userModel.js'
import Appointment from '../appointments/appointmentsModel.js'

/**
 * Get dentist appointments
 */
export const getDentistAppointments = async (req, res) => {
  try {
    const userId = req.params.userId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Get appointments where dentist name matches user name
    const appointments = await Appointment.findByDentistName(user.name)

    res.json({
      success: true,
      appointments,
    })
  } catch (error) {
    console.error('Get dentist appointments error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update availability for a dentist
 */
export const setAvailability = async (req, res) => {
  try {
    const userId = req.params.userId
    const { date, timeStart, timeEnd } = req.body

    // Validate required fields
    if (!date || !timeStart || !timeEnd) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time and end time are required',
      })
    }

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Create or update availability
    const availability = await DentistAvailability.setAvailability(
      dentist.id,
      date,
      timeStart,
      timeEnd
    )

    res.json({
      success: true,
      message: 'Availability updated successfully',
      availability,
    })
  } catch (error) {
    console.error('Set availability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get dentist availability
 */
export const getAvailability = async (req, res) => {
  try {
    const userId = req.params.userId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Get availability
    const availability = await DentistAvailability.getByDentistId(dentist.id)

    res.json({
      success: true,
      availability,
    })
  } catch (error) {
    console.error('Get availability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Add or update patient notes
 */
export const updatePatientNotes = async (req, res) => {
  try {
    const userId = req.params.userId
    const { patientId, appointmentId, notes } = req.body

    // Validate required fields
    if (!patientId || !notes) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID and notes are required',
      })
    }

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Create or update patient notes
    const patientNotes = await DentistAvailability.savePatientNotes(
      dentist.id,
      patientId,
      appointmentId,
      notes
    )

    res.json({
      success: true,
      message: 'Patient notes updated successfully',
      patientNotes,
    })
  } catch (error) {
    console.error('Update patient notes error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get patient notes
 */
export const getPatientNotes = async (req, res) => {
  try {
    const userId = req.params.userId
    const patientId = req.params.patientId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Get patient notes
    const notes = await DentistAvailability.getPatientNotes(
      dentist.id,
      patientId
    )

    res.json({
      success: true,
      notes,
    })
  } catch (error) {
    console.error('Get patient notes error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get all dentists
 */
export const getAllDentists = async (req, res) => {
  try {
    // Get all users with dentist role
    const dentists = await User.findByRole('dentist')

    res.json({
      success: true,
      dentists,
    })
  } catch (error) {
    console.error('Get all dentists error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Set permanent unavailability for a dentist (specific days of the week)
 */
export const setPermanentUnavailability = async (req, res) => {
  try {
    const userId = req.params.userId
    const { daysOfWeek } = req.body

    // Validate required fields
    if (!daysOfWeek || !Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Days of week array is required',
      })
    }

    // Validate each day is between 0-6 (Sunday-Saturday)
    const validDays = daysOfWeek.every((day) => day >= 0 && day <= 6)
    if (!validDays) {
      return res.status(400).json({
        success: false,
        message: 'Days of week must be between 0-6 (Sunday-Saturday)',
      })
    }

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Save permanent unavailability
    const results = await DentistAvailability.setPermanentUnavailability(
      dentist.id,
      daysOfWeek
    )

    res.json({
      success: true,
      message: 'Permanent unavailability set successfully',
      permanentUnavailability: results,
    })
  } catch (error) {
    console.error('Set permanent unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get permanent unavailability for a dentist
 */
export const getPermanentUnavailability = async (req, res) => {
  try {
    const userId = req.params.userId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Get permanent unavailability
    const permanentUnavailability =
      await DentistAvailability.getPermanentUnavailability(dentist.id)

    res.json({
      success: true,
      permanentUnavailability,
    })
  } catch (error) {
    console.error('Get permanent unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Delete permanent unavailability for a dentist
 */
export const deletePermanentUnavailability = async (req, res) => {
  try {
    const userId = req.params.userId
    const dayId = req.params.dayId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Delete permanent unavailability
    await DentistAvailability.deletePermanentUnavailability(dentist.id, dayId)

    res.json({
      success: true,
      message: 'Permanent unavailability deleted successfully',
    })
  } catch (error) {
    console.error('Delete permanent unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Set temporary unavailability for a dentist (specific date range)
 */
export const setTemporaryUnavailability = async (req, res) => {
  try {
    const userId = req.params.userId
    const { startDate, endDate, reason } = req.body

    // Validate required fields
    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date is required',
      })
    }

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Save temporary unavailability
    const result = await DentistAvailability.setTemporaryUnavailability(
      dentist.id,
      startDate,
      endDate,
      reason
    )

    res.json({
      success: true,
      message: 'Temporary unavailability set successfully',
      temporaryUnavailability: result,
    })
  } catch (error) {
    console.error('Set temporary unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get temporary unavailability for a dentist
 */
export const getTemporaryUnavailability = async (req, res) => {
  try {
    const userId = req.params.userId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Get temporary unavailability
    const temporaryUnavailability =
      await DentistAvailability.getTemporaryUnavailability(dentist.id)

    res.json({
      success: true,
      temporaryUnavailability,
    })
  } catch (error) {
    console.error('Get temporary unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Delete temporary unavailability for a dentist
 */
export const deleteTemporaryUnavailability = async (req, res) => {
  try {
    const userId = req.params.userId
    const unavailabilityId = req.params.unavailabilityId

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: User is not a dentist',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Delete temporary unavailability
    await DentistAvailability.deleteTemporaryUnavailability(
      dentist.id,
      unavailabilityId
    )

    res.json({
      success: true,
      message: 'Temporary unavailability deleted successfully',
    })
  } catch (error) {
    console.error('Delete temporary unavailability error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Check if a dentist is available on a specific date
 */
export const checkDateAvailability = async (req, res) => {
  try {
    const { date, dentistName } = req.query

    if (!date || !dentistName) {
      return res.status(400).json({
        success: false,
        message: 'Date and dentist name are required',
      })
    }

    // Get the dentist ID from name
    const user = await User.findByName(dentistName)

    if (!user || user.role !== 'dentist') {
      return res.status(404).json({
        success: false,
        message: 'Dentist not found',
      })
    }

    // Get dentist record
    const dentist = await User.findDentistByUserId(user.id)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist record not found',
      })
    }

    // Parse the date to check the day of week
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      })
    }

    const dayOfWeek = dateObj.getDay() // 0-6 (Sunday-Saturday)

    // Check permanent unavailability for this day of week
    const permanentUnavailability =
      await DentistAvailability.getPermanentUnavailabilityByDayOfWeek(
        dentist.id,
        dayOfWeek
      )

    if (permanentUnavailability && permanentUnavailability.length > 0) {
      return res.json({
        success: true,
        available: false,
        reason: 'This day of the week is marked as permanently unavailable',
      })
    }

    // Check temporary unavailability for this specific date
    const formattedDate = date.split('T')[0] // Format: YYYY-MM-DD
    const tempUnavailability =
      await DentistAvailability.checkDateInTemporaryUnavailability(
        dentist.id,
        formattedDate
      )

    if (tempUnavailability) {
      return res.json({
        success: true,
        available: false,
        reason: 'This date is marked as temporarily unavailable',
        details: tempUnavailability.reason
          ? { reason: tempUnavailability.reason }
          : undefined,
      })
    }

    // If we reach here, the dentist is available on this date
    return res.json({
      success: true,
      available: true,
    })
  } catch (error) {
    console.error('Error checking dentist availability:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
