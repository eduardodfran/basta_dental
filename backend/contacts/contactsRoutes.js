import express from 'express'
import contactsController from './contactsController.js'

const router = express.Router()

// Single route for contact form submission
router.post('/submit', contactsController.submitContactForm)

export default router
