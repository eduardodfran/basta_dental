/**
 * Auth utility functions for checking login status and redirecting users
 */

/**
 * Check if user is logged in, redirect to login page if not
 * @return {Object|null} User object if logged in, null if redirecting
 */
function checkAuth() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      console.log('Not logged in. Redirecting to login page...')
      window.location.replace('./login.html')
      return null
    }

    const user = JSON.parse(userString)
    if (user && user.id) {
      return user
    }

    // If the user data is invalid, clear it
    localStorage.removeItem('user')
    window.location.replace('./login.html')
    return null
  } catch (error) {
    console.error('Error checking auth:', error)
    localStorage.removeItem('user') // Clear potentially corrupt data
    window.location.replace('login.html')
    return null
  }
}

/**
 * Check if user is already logged in, redirect to dashboard if yes
 * For use on login/signup pages to prevent logged-in users from seeing them
 */
function redirectIfLoggedIn() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      return false
    }

    const user = JSON.parse(userString)
    if (user && user.id) {
      console.log('User already logged in. Redirecting to dashboard...')
      window.location.replace('dashboard.html')
      return true
    }

    // If the user data is invalid, clear it
    localStorage.removeItem('user')
    return false
  } catch (error) {
    console.error('Error checking if logged in:', error)
    localStorage.removeItem('user') // Clear potentially corrupt data
    return false
  }
}

/**
 * Check if user is logged in and has admin role, redirect if not
 * @return {Object|null} User object if logged in as admin, null if redirecting
 */
function checkAdminAuth() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      console.log('Not logged in. Redirecting to login page...')
      window.location.replace('login.html')
      return null
    }

    const user = JSON.parse(userString)
    if (!user || !user.id) {
      // If the user data is invalid, clear it
      localStorage.removeItem('user')
      window.location.replace('login.html')
      return null
    }

    if (user.role !== 'admin') {
      console.log('Not an admin. Redirecting to dashboard...')
      // Show notification instead of alert
      if (typeof showNotificationDialog === 'function') {
        showNotificationDialog(
          'Access denied. Admin privileges required.',
          'Access Denied',
          () => window.location.replace('dashboard.html')
        )
      } else {
        // Fallback if notification system isn't loaded
        window.location.replace('dashboard.html')
      }
      return null
    }

    return user
  } catch (error) {
    console.error('Error checking admin auth:', error)
    localStorage.removeItem('user') // Clear potentially corrupt data
    window.location.replace('login.html')
    return null
  }
}

/**
 * Check if user is logged in and has dentist role, redirect if not
 * @return {Object|null} User object if logged in as dentist, null if redirecting
 */
function checkDentistAuth() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      console.log('Not logged in. Redirecting to login page...')
      window.location.replace('login.html')
      return null
    }

    const user = JSON.parse(userString)
    if (!user || !user.id) {
      // If the user data is invalid, clear it
      localStorage.removeItem('user')
      window.location.replace('login.html')
      return null
    }

    if (user.role !== 'dentist') {
      console.log('Not a dentist. Redirecting to dashboard...')
      // Show notification instead of alert
      if (typeof showNotificationDialog === 'function') {
        showNotificationDialog(
          'Access denied. Dentist privileges required.',
          'Access Denied',
          () => window.location.replace('dashboard.html')
        )
      } else {
        // Fallback if notification system isn't loaded
        window.location.replace('dashboard.html')
      }
      return null
    }

    return user
  } catch (error) {
    console.error('Error checking dentist auth:', error)
    localStorage.removeItem('user') // Clear potentially corrupt data
    window.location.replace('login.html')
    return null
  }
}

/**
 * Redirects user to appropriate dashboard based on their role
 */
function redirectBasedOnRole() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) return false

    const user = JSON.parse(userString)
    if (user && user.role) {
      switch (user.role) {
        case 'dentist':
          window.location.replace('dentist-dashboard.html')
          return true
        case 'admin':
          window.location.replace('admin.html')
          return true
        case 'patient':
        default:
          window.location.replace('dashboard.html')
          return true
      }
    }
    return false
  } catch (e) {
    console.error('Error parsing user data', e)
    return false
  }
}

/**
 * Check appropriate dashboard access based on user role
 * @param {string} role - The role to check access for
 * @param {string} currentPage - The current page identifier (e.g., 'patient', 'dentist', 'admin')
 * @return {boolean} Whether the access is valid
 */
function checkRoleAccess(role, currentPage) {
  // Map roles to their allowed pages
  const accessMap = {
    patient: ['patient'],
    dentist: ['dentist'],
    admin: ['admin', 'patient', 'dentist'], // Admins can access all dashboards
  }

  if (!role || !currentPage || !accessMap[role]) {
    return false
  }

  return accessMap[role].includes(currentPage)
}

/**
 * Check if user has permission to book appointments (not a dentist)
 * @return {boolean} True if user can book appointments, false otherwise
 */
function checkBookingPermission() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) return false

    const user = JSON.parse(userString)
    // Dentists cannot book appointments
    if (user.role === 'dentist') return false

    return true
  } catch (error) {
    console.error('Error checking booking permission:', error)
    return false
  }
}
