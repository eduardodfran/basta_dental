import User from './userModel.js'
import { validateUserData } from './userUtils.js'

/**
 * Login user and return user data
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required' })
    }

    // Check if user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' })
    }

    // Compare passwords
    const match = await User.comparePassword(user.password, password)
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' })
    }

    // Remove password from user object
    const { password: userPassword, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Register a new user
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, dob, phone, gender, address } = req.body

    // Validate user data
    const validationError = validateUserData(req.body)
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      })
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      dob,
      phone,
      gender,
      address,
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user.id,
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get user profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id

    const user = await User.findByIdWithoutPassword(userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id
    const { name, email, phone, dob, gender, address } = req.body

    // Validate input data
    if (!name || !email || !dob) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and date of birth are required',
      })
    }

    // Check if user exists
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // If email changed, check if new email is already in use by another user
    if (email !== existingUser.email) {
      const userWithSameEmail = await User.findOne({ email })
      if (userWithSameEmail && userWithSameEmail.id !== parseInt(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another account',
        })
      }
    }

    // Update user
    const updatedUser = await User.update(userId, {
      name,
      email,
      phone,
      dob,
      gender,
      address,
    })

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get all users (for admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll()

    res.json({
      success: true,
      users,
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update user role (for admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.id
    const { role } = req.body

    // Validate role
    if (!role || !['patient', 'admin', 'dentist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required',
      })
    }

    // Check if user exists
    const existingUser = await User.findById(userId)
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Update user role
    const updatedUser = await User.updateRole(userId, role)

    // Add user to dentists table if role is dentist
    if (role === 'dentist') {
      // Check if the user is already in the dentists table
      const existingDentist = await User.findDentistByUserId(userId)

      if (!existingDentist) {
        // Add to dentists table
        await User.addUserToDentists(userId)
      }
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update user role error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Get dentist profile
 */
export const getDentistProfile = async (req, res) => {
  try {
    const userId = req.params.id

    // Check if user is a dentist
    const user = await User.findByIdWithoutPassword(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(404).json({
        success: false,
        message: 'Dentist not found',
      })
    }

    // Get dentist details
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist details not found',
      })
    }

    // Combine user and dentist info
    const dentistProfile = {
      ...user,
      ...dentist,
    }

    res.json({
      success: true,
      dentist: dentistProfile,
    })
  } catch (error) {
    console.error('Get dentist profile error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

/**
 * Update dentist profile
 */
export const updateDentistProfile = async (req, res) => {
  try {
    const userId = req.params.id
    const { specialization, bio } = req.body

    // Check if user is a dentist
    const user = await User.findById(userId)
    if (!user || user.role !== 'dentist') {
      return res.status(404).json({
        success: false,
        message: 'Dentist not found',
      })
    }

    // Get dentist details
    const dentist = await User.findDentistByUserId(userId)
    if (!dentist) {
      return res.status(404).json({
        success: false,
        message: 'Dentist details not found',
      })
    }

    // Update dentist details
    const updatedDentist = await User.updateDentistProfile(dentist.id, {
      specialization,
      bio,
    })

    res.json({
      success: true,
      message: 'Dentist profile updated successfully',
      dentist: {
        ...user,
        ...updatedDentist,
      },
    })
  } catch (error) {
    console.error('Update dentist profile error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}
