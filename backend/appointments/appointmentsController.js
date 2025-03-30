import Appointment from './appointmentsModel.js'

/**
 * Create a new appointment
 */
export const createAppointment = async (req, res) => {
  try {
    const { userId, service, dentist, date, time, notes } = req.body

    // Validate required fields
    if (!userId || !service || !dentist || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      })
    }

    // Check if time slot is available
    const isAvailable = await Appointment.isTimeSlotAvailable(
      date,
      time,
      dentist
    )
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked',
      })
    }

    // Create appointment
    const appointmentData = {
      userId,
      service,
      dentist,
      date,
      time,
      status: 'pending',
      notes: notes || '',
    }

    const appointment = new Appointment(appointmentData)
    const savedAppointment = await appointment.save()

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: savedAppointment,
    })
  } catch (error) {
    console.error('Appointment creation error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get all appointments for a user
 */
export const getUserAppointments = async (req, res) => {
  try {
    const userId = req.params.userId

    const appointments = await Appointment.findByUserId(userId)

    res.json({
      success: true,
      appointments,
    })
  } catch (error) {
    console.error('Get user appointments error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get booked time slots for a date and dentist
 */
export const getBookedTimeSlots = async (req, res) => {
  try {
    const { date, dentist } = req.query

    if (!date || !dentist) {
      return res.status(400).json({
        success: false,
        message: 'Date and dentist parameters are required',
      })
    }

    const bookedSlots = await Appointment.getBookedTimeSlots(date, dentist)

    res.json({
      success: true,
      bookedSlots,
    })
  } catch (error) {
    console.error('Get booked slots error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Cancel an appointment
 */
export const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id

    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    // Update appointment status
    const updatedAppointment = await Appointment.updateStatus(
      appointmentId,
      'cancelled'
    )

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Reschedule an appointment
 */
export const rescheduleAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { date, time } = req.body

    // Validate input
    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'New date and time are required',
      })
    }

    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    // Check if new time slot is available
    const isAvailable = await Appointment.isTimeSlotAvailable(
      date,
      time,
      appointment.dentist
    )
    if (!isAvailable) {
      return res.status(409).json({
        success: false,
        message: 'The requested time slot is already booked',
      })
    }

    // Reschedule appointment
    const updatedAppointment = await Appointment.reschedule(
      appointmentId,
      date,
      time
    )

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error('Reschedule appointment error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get all appointments (for admin)
 */
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll()

    // Get user names for each appointment
    for (let apt of appointments) {
      try {
        // Join with user data to get user names if available
        // This will be implemented in the model
      } catch (error) {
        console.error(
          `Error getting user details for appointment ${apt.id}:`,
          error
        )
        // Continue with other appointments even if one fails
      }
    }

    res.json({
      success: true,
      appointments,
    })
  } catch (error) {
    console.error('Get all appointments error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get appointment by ID
 */
export const getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id

    const appointment = await Appointment.findById(appointmentId)

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    res.json({
      success: true,
      appointment,
    })
  } catch (error) {
    console.error('Get appointment by ID error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update appointment status
 */
export const updateAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { status } = req.body

    if (
      !status ||
      !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid status is required',
      })
    }

    // Check if appointment exists
    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      })
    }

    // Update appointment status
    const updatedAppointment = await Appointment.updateStatus(
      appointmentId,
      status
    )

    res.json({
      success: true,
      message: `Appointment marked as ${status} successfully`,
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error('Update appointment status error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
