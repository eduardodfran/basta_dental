import express from 'express'
import { getAnalyticsData } from './analyticsController.js'

const router = express.Router()

// Routes
router.get('/', getAnalyticsData)

export default router
