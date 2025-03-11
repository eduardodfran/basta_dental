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
