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
  // Import new transfer controllers
  getTransferableAppointments,
  markAppointmentTransferable,
  acceptAppointmentTransfer,
} from './appointmentsController.js'

const router = express.Router()

// Routes
router.post('/', createAppointment)
router.get('/', getAllAppointments) // Admin get all appointments
router.get('/transferable', getTransferableAppointments) // Get appointments available for transfer
router.get('/user/:userId', getUserAppointments)
router.get('/booked-slots', getBookedTimeSlots)
router.get('/:id', getAppointmentById) // Get specific appointment
router.put('/:id/cancel', cancelAppointment)
router.put('/:id/reschedule', rescheduleAppointment)
router.put('/:id/status', updateAppointmentStatus) // Update status (pending, confirmed, completed, cancelled)
router.put('/:id/assign', assignAppointment) // Admin assign/reassign dentist
router.put('/:id/transfer', markAppointmentTransferable) // Mark appointment as available for transfer
router.put('/:id/accept-transfer', acceptAppointmentTransfer) // Dentist accepts a transferable appointment
router.put('/:id/payment', updatePaymentStatus) // Update payment status
router.put('/:id/payment-method', updatePaymentMethod) // Update payment method

export default router
