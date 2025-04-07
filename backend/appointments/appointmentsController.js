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

    // Validate date format and prevent past dates
    try {
      // Create date objects for comparison
      const appointmentDate = new Date(date)
      appointmentDate.setHours(0, 0, 0, 0) // Reset time for date comparison

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if date is valid
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date format',
        })
      }

      // Check if date is in the past
      if (appointmentDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot book appointments for past dates',
        })
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date',
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

    // Count completed appointments for checking if user is trusted
    const completedAppointments = appointments.filter(
      (apt) => apt.status === 'completed'
    ).length
    const isTrustedPatient = completedAppointments > 0

    res.json({
      success: true,
      appointments,
      patientStatus: {
        completedAppointments,
        isTrusted: isTrustedPatient,
      },
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

    // Validate date format and prevent past dates
    try {
      // Create date objects for comparison
      const appointmentDate = new Date(date)
      appointmentDate.setHours(0, 0, 0, 0) // Reset time for date comparison

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if date is valid
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date format',
        })
      }

      // Check if date is in the past
      if (appointmentDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reschedule to a past date',
        })
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date',
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

    // Validate and standardize date format if present
    if (appointment.date) {
      try {
        // Test if the date is valid
        const testDate = new Date(appointment.date)
        if (isNaN(testDate.getTime())) {
          // If invalid, provide a standardized format in the response
          console.warn(
            `Invalid appointment date detected for ID ${appointmentId}: ${appointment.date}`
          )
          // Keep the original date in case client has special handling
        }
      } catch (err) {
        console.error(
          `Error processing date for appointment ${appointmentId}:`,
          err
        )
      }
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

/**
 * Assign appointment to a different dentist
 */
export const assignAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { dentistName, dentistId } = req.body

    // Validate input
    if (!dentistName) {
      return res.status(400).json({
        success: false,
        message: 'Dentist name is required',
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

    // Update appointment with new dentist
    const updatedAppointment = await Appointment.assignToDentist(
      appointmentId,
      dentistName,
      dentistId
    )

    res.json({
      success: true,
      message: 'Appointment assigned successfully',
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error('Assign appointment error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update payment status for an appointment
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { downpaymentStatus, paymentMethod } = req.body

    // Validate input
    if (!downpaymentStatus || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Downpayment status and payment method are required',
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

    // Update appointment with new payment information
    const updatedAppointment = await Appointment.updatePayment(
      appointmentId,
      downpaymentStatus,
      paymentMethod
    )

    res.json({
      success: true,
      message: 'Payment information updated successfully',
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error('Update payment status error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update payment method for an appointment
 */
export const updatePaymentMethod = async (req, res) => {
  try {
    const appointmentId = req.params.id
    const { paymentMethod } = req.body

    // Validate input
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required',
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

    // Update appointment with new payment method
    const updatedAppointment = await Appointment.updatePaymentMethod(
      appointmentId,
      paymentMethod
    )

    res.json({
      success: true,
      message: 'Payment method updated successfully',
      appointment: updatedAppointment,
    })
  } catch (error) {
    console.error('Update payment method error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
