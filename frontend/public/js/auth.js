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
      console.log('No user found in localStorage. Redirecting to login...')
      window.location.replace('login.html')
      return null
    }

    const user = JSON.parse(userString)
    if (!user || !user.id) {
      console.log('Invalid user data in localStorage. Redirecting to login...')
      localStorage.removeItem('user') // Clear invalid data
      window.location.replace('login.html')
      return null
    }

    return user
  } catch (error) {
    console.error('Error checking authentication:', error)
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
