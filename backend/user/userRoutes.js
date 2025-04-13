import express from 'express'
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  updateUserRole,
  updateDentistProfile,
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

// Protected routes
router.get('/profile/:id', protect, getUserProfile)
router.put('/profile/:id', protect, updateUserProfile)

// Admin routes
router.get('/', protect, admin, getAllUsers)
router.put('/:id/role', protect, admin, updateUserRole)

// Dentist profile update route
// If you have a separate dentist route file, this might be there instead.
router.put('/dentists/:id', protect, updateDentistProfile)

export default router
