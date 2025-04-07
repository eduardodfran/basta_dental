/**
 * Authentication utilities specific to the dentist role
 */

// On page load, check if the current user is allowed to access the dentist dashboard
document.addEventListener('DOMContentLoaded', function () {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      window.location.replace('login.html')
      return
    }

    const user = JSON.parse(userString)
    // Only dentists or admins can access the dentist dashboard
    if (user.role !== 'dentist' && user.role !== 'admin') {
      alert('Access denied. This area is for dental professionals only.')
      window.location.replace('dashboard.html')
      return
    }

    // If it's an admin, show an indicator that they're viewing as admin
    if (user.role === 'admin') {
      const header = document.querySelector('.dashboard-header')
      if (header) {
        const adminBadge = document.createElement('div')
        adminBadge.className = 'admin-badge'
        adminBadge.innerHTML = 'Admin View'
        adminBadge.style.backgroundColor = '#dc3545'
        adminBadge.style.color = 'white'
        adminBadge.style.padding = '0.25rem 0.5rem'
        adminBadge.style.borderRadius = '0.25rem'
        adminBadge.style.fontSize = '0.75rem'
        adminBadge.style.fontWeight = 'bold'
        adminBadge.style.position = 'absolute'
        adminBadge.style.top = '0.5rem'
        adminBadge.style.right = '0.5rem'
        header.appendChild(adminBadge)
      }
    }
  } catch (e) {
    console.error('Error verifying dentist access:', e)
    window.location.replace('login.html')
  }
})
