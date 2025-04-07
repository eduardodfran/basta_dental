import express from 'express'
import {
  getDentistAppointments,
  setAvailability,
  getAvailability,
  updatePatientNotes,
  getPatientNotes,
  getAllDentists,
} from './dentistController.js'

const router = express.Router()

// Routes
router.get('/appointments/:userId', getDentistAppointments)
router.get('/availability/:userId', getAvailability)
router.post('/availability/:userId', setAvailability)
router.post('/notes/:userId', updatePatientNotes)
router.get('/notes/:userId/:patientId', getPatientNotes)
router.get('/all', getAllDentists) // Add new route to get all dentists

export default router
