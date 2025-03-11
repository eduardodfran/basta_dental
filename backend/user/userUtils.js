/**
 * Validate user data during registration
 * @param {Object} userData - User data to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateUserData = (userData) => {
  const { name, email, password, dob } = userData

  // Check required fields
  if (!name || !email || !password || !dob) {
    return 'Name, email, password, and date of birth are required'
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please provide a valid email address'
  }

  // Validate password strength (min 6 chars)
  if (password.length < 6) {
    return 'Password must be at least 6 characters long'
  }

  // Validate date of birth (should be in the past)
  const dobDate = new Date(dob)
  if (isNaN(dobDate.getTime()) || dobDate >= new Date()) {
    return 'Please provide a valid date of birth'
  }

  return null // No validation errors
}

/**
 * Sanitize user data before sending to client
 * @param {Object} user - User object
 * @returns {Object} - Sanitized user object
 */
export const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user
  return sanitizedUser
}
