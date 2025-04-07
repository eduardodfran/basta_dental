/**
 * Utility functions to manage booking permissions for different user roles
 */

/**
 * Check if the current user is allowed to book appointments
 * Returns false for dentists, true for patients and admins
 */
function canBookAppointments() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) return false

    const user = JSON.parse(userString)
    // Dentists cannot book appointments, only patients and admins can
    if (user.role === 'dentist') return false

    return true
  } catch (e) {
    console.error('Error checking booking permissions:', e)
    return false
  }
}

/**
 * Redirect dentists away from booking pages
 * If the current user is a dentist, they will be redirected to the dentist dashboard
 */
function redirectDentistsFromBooking() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) return

    const user = JSON.parse(userString)
    if (user.role === 'dentist') {
      // Use notification dialog instead of alert if available
      if (typeof showNotificationDialog === 'function') {
        showNotificationDialog(
          'As a dentist, you cannot book appointments. Please use your dentist dashboard to manage appointments.',
          'Access Restricted',
          () => window.location.replace('dentist-dashboard.html')
        )
      } else {
        // Fallback to simple redirect if notification system isn't loaded
        window.location.replace('dentist-dashboard.html')
      }
    }
  } catch (e) {
    console.error('Error redirecting from booking:', e)
  }
}
