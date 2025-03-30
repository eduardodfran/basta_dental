import express from 'express'
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  getDentistProfile,
  updateDentistProfile,
} from './userController.js'

const router = express.Router()

// Debug route to confirm the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'User API is working' })
})

// Auth routes
router.post('/login', loginUser)
router.post('/signup', registerUser)

// User profile routes
router.get('/users/:id', getUserProfile)
router.put('/users/:id', updateUserProfile)

// Admin routes
router.get('/users', getAllUsers)
router.put('/users/:id/role', updateUserRole)

// Dentist routes
router.get('/dentists/:id', getDentistProfile)
router.put('/dentists/:id', updateDentistProfile)

export default router
