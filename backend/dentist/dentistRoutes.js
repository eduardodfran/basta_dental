import express from 'express'
import {
  getDentistAppointments,
  setAvailability,
  getAvailability,
  updatePatientNotes,
  getPatientNotes,
  getAllDentists,
  setPermanentUnavailability,
  getPermanentUnavailability,
  deletePermanentUnavailability,
  setTemporaryUnavailability,
  getTemporaryUnavailability,
  deleteTemporaryUnavailability,
  checkDateAvailability,
} from './dentistController.js'

const router = express.Router()

// Routes
router.get('/appointments/:userId', getDentistAppointments)
router.get('/availability/:userId', getAvailability)
router.post('/availability/:userId', setAvailability)
router.post('/notes/:userId', updatePatientNotes)
router.get('/notes/:userId/:patientId', getPatientNotes)
router.get('/all', getAllDentists)

// New routes for unavailability management
router.post('/unavailability/:userId/permanent', setPermanentUnavailability)
router.get('/unavailability/:userId/permanent', getPermanentUnavailability)
router.delete(
  '/unavailability/:userId/permanent/:dayId',
  deletePermanentUnavailability
)

router.post('/unavailability/:userId/temporary', setTemporaryUnavailability)
router.get('/unavailability/:userId/temporary', getTemporaryUnavailability)
router.delete(
  '/unavailability/:userId/temporary/:unavailabilityId',
  deleteTemporaryUnavailability
)

// Check dentist's availability on a specific date
router.get('/check-availability', checkDateAvailability)

export default router
