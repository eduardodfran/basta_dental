import express from 'express'
import { loginUser, registerUser, getUserProfile } from './userController.js'

const router = express.Router()

// Debug route to confirm the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'User API is working' })
})

// Auth routes
router.post('/login', loginUser)
router.post('/signup', registerUser)

// User profile routes
router.get('/profile/:id', getUserProfile)

export default router
