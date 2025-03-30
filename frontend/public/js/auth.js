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
      window.location.replace('login.html')
      return null
    }

    const user = JSON.parse(userString)
    if (user && user.id) {
      return user
    }

    // If the user data is invalid, clear it
    localStorage.removeItem('user')
    window.location.replace('login.html')
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
      alert('Access denied. Admin privileges required.')
      window.location.replace('dashboard.html')
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
