import express from 'express'
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  updateDentistProfile,
  getDentistProfile,
  forgotPassword, // Import new controller
  resetPassword, // Import new controller
} from './userController.js'
import { protect, admin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Debug route to confirm the router is working
router.get('/test', (req, res) => {
  res.json({ message: 'User API is working' })
})

// Public routes
router.post('/login', loginUser)
router.post('/signup', registerUser)
router.post('/forgot-password', forgotPassword) // Add forgot password route
router.post('/reset-password', resetPassword) // Add reset password route

// Protected routes
router.get('/profile/:id', protect, getUserProfile)
router.put('/profile/:id', protect, updateUserProfile)

// Admin routes
router.get('/', protect, admin, getAllUsers)
router.put('/:id/role', protect, admin, updateUserRole)

// Dentist profile routes
router.get('/dentists/:id', protect, getDentistProfile)
router.put('/dentists/:id', protect, updateDentistProfile)

export default router
