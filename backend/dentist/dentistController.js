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
