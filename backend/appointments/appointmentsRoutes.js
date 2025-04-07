import express from 'express'
import {
  createAppointment,
  getUserAppointments,
  getBookedTimeSlots,
  cancelAppointment,
  rescheduleAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  assignAppointment,
  updatePaymentStatus,
  updatePaymentMethod,
} from './appointmentsController.js'

const router = express.Router()

// Routes
router.post('/', createAppointment)
router.get('/', getAllAppointments) // New route for admin to get all appointments
router.get('/user/:userId', getUserAppointments)
router.get('/booked-slots', getBookedTimeSlots)
router.get('/:id', getAppointmentById) // New route to get specific appointment
router.put('/:id/cancel', cancelAppointment)
router.put('/:id/reschedule', rescheduleAppointment)
router.put('/:id/status', updateAppointmentStatus) // New route to update status
router.put('/:id/assign', assignAppointment) // Update appointment dentist assignment
router.put('/:id/payment', updatePaymentStatus) // Add payment status update route
router.put('/:id/payment-method', updatePaymentMethod) // Add payment method update route

export default router
