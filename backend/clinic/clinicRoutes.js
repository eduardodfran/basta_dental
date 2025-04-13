import express from 'express'
import {
  setPermanentUnavailability,
  getPermanentUnavailability,
  setTemporaryUnavailability,
  getTemporaryUnavailability,
  deleteTemporaryUnavailability,
  checkDateAvailability,
  deletePermanentUnavailability, // Add this import
} from './clinicController.js'

const router = express.Router()

// Routes for clinic unavailability management
router.post('/unavailability/permanent', setPermanentUnavailability)
router.get('/unavailability/permanent', getPermanentUnavailability)
router.delete('/unavailability/permanent/:dayId', deletePermanentUnavailability) // Add this route
router.post('/unavailability/temporary', setTemporaryUnavailability)
router.get('/unavailability/temporary', getTemporaryUnavailability)
router.delete('/unavailability/temporary/:id', deleteTemporaryUnavailability)
router.get('/check-availability', checkDateAvailability)

export default router
