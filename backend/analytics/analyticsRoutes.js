import express from 'express'
// Correct the imported function name
import { getAnalytics } from './analyticsController.js'

const router = express.Router()

// Routes
// Use the correct function name here
router.get('/', getAnalytics)

export default router
