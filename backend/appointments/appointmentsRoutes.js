import express from 'express'
import {
  createAppointment,
  getUserAppointments,
  getBookedTimeSlots,
  cancelAppointment,
  rescheduleAppointment,
} from './appointmentsController.js'

const router = express.Router()

// Routes
router.post('/', createAppointment)
router.get('/user/:userId', getUserAppointments)
router.get('/booked-slots', getBookedTimeSlots)
router.put('/:id/cancel', cancelAppointment)
router.put('/:id/reschedule', rescheduleAppointment)

export default router
