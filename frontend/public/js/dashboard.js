document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in - use our auth utility
  const user = checkAuth()
  if (!user) {
    console.error('Not authenticated. Stopping script execution.')
    return // Stop execution if not authenticated
  }

  // Initialize dashboard components
  initNavbarToggle()
  loadUserData()
  loadAppointments()
  setupEventListeners()
})

// Mobile navbar toggle
function initNavbarToggle() {
  document.querySelector('.burger').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('nav-active')
    document.querySelector('.burger').classList.toggle('toggle')
  })
}

// Load user data from localStorage
function loadUserData() {
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user) return

  // Update user name in header
  document.getElementById('user-name').textContent = user.name

  // Fill profile form with user data
  document.getElementById('full-name').value = user.name
  document.getElementById('email').value = user.email
  document.getElementById('phone').value = user.phone || ''
  document.getElementById('dob').value = user.dob
    ? formatDateForInput(user.dob)
    : ''
  document.getElementById('address').value = user.address || ''
}

// Format date from MySQL format to input field format (YYYY-MM-DD)
function formatDateForInput(dateString) {
  if (!dateString) return ''

  // Handle both date-only strings and full ISO strings
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString)
    return ''
  }
  return date.toISOString().split('T')[0]
}

// Load appointments for the current user
function loadAppointments() {
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user) return

  const tableBody = document.getElementById('appointments-data')
  const noAppointmentsMsg = document.getElementById('no-appointments')

  // Show loading indicator
  tableBody.innerHTML =
    '<tr><td colspan="5" style="text-align: center;">Loading appointments...</td></tr>'

  // Fetch real appointments from the API
  fetch(`http://localhost:3000/api/appointments/user/${user.id}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      return response.json()
    })
    .then((data) => {
      // Clear previous data
      tableBody.innerHTML = ''

      if (!data.success) {
        throw new Error(data.message || 'Failed to load appointments')
      }

      const appointments = data.appointments

      if (appointments.length === 0) {
        tableBody.style.display = 'none'
        noAppointmentsMsg.style.display = 'block'
      } else {
        tableBody.style.display = 'table-row-group'
        noAppointmentsMsg.style.display = 'none'

        // Add appointments to table
        appointments.forEach((apt) => {
          const row = document.createElement('tr')
          row.dataset.appointmentId = apt.id

          // Handle the date correctly
          // First, make sure we're working with a proper date string in YYYY-MM-DD format
          let dateStr = apt.date
          if (typeof dateStr === 'string' && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0]
          }

          // Create the date object with correct timezone adjustment
          const dateObj = new Date(dateStr)

          // Add 1 day to compensate for potential timezone issue
          // This is a common issue when the server returns dates in UTC
          // but the browser interprets them in local timezone
          // Only do this if the date appears to be off by a day
          const now = new Date()
          const timezoneOffset = now.getTimezoneOffset()
          if (timezoneOffset > 0) {
            dateObj.setDate(dateObj.getDate() + 1)
          }

          // Format the date
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          // Format the time if available
          let formattedTime = 'N/A'
          if (apt.time) {
            // Time is usually stored as HH:MM:SS, create a Date with this time
            const [hours, minutes] = apt.time.split(':')
            const timeObj = new Date()
            timeObj.setHours(hours, minutes, 0)

            formattedTime = timeObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }

          row.innerHTML = `
            <td>${formattedDate}<br>${formattedTime}</td>
            <td>${apt.service}</td>
            <td>${apt.dentist}</td>
            <td><span class="appointment-status status-${apt.status}">${
            apt.status.charAt(0).toUpperCase() + apt.status.slice(1)
          }</span></td>
            <td class="appointment-actions">
              ${
                apt.status === 'completed' || apt.status === 'cancelled'
                  ? ''
                  : `
                <button class="action-btn btn-reschedule" title="Reschedule">
                  <i class="fas fa-calendar-alt"></i>
                </button>
                <button class="action-btn btn-cancel" title="Cancel">
                  <i class="fas fa-times-circle"></i>
                </button>
              `
              }
            </td>
          `

          tableBody.appendChild(row)
        })
      }
    })
    .catch((error) => {
      console.error('Error loading appointments:', error)
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #721c24;">
        Error loading appointments: ${error.message}</td></tr>`
    })
}

// Setup event listeners for various interactions
function setupEventListeners() {
  // Profile form submission
  const profileForm = document.getElementById('profile-form')
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault()

    const user = JSON.parse(localStorage.getItem('user'))
    if (!user) return

    // Get form values
    const name = document.getElementById('full-name').value.trim()
    const email = document.getElementById('email').value.trim()
    const phone = document.getElementById('phone').value.trim()
    const dob = document.getElementById('dob').value
    const address = document.getElementById('address').value.trim()

    // Validate form inputs
    if (!name) {
      showProfileStatus('Please enter your name', 'error')
      return
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showProfileStatus('Please enter a valid email address', 'error')
      return
    }

    if (!dob) {
      showProfileStatus('Please enter your date of birth', 'error')
      return
    }

    // Prepare updated data (keeping existing gender value)
    const updatedData = {
      name,
      email,
      phone,
      dob,
      gender: user.gender || '', // Preserve the existing gender value
      address,
    }

    // Show updating status
    showProfileStatus('Updating profile...', 'info')

    // Send update request to the server
    fetch(`http://localhost:3000/api/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update profile')
        }
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          // Update local storage with the data from the server
          localStorage.setItem('user', JSON.stringify(data.user))

          // Update UI
          document.getElementById('user-name').textContent = data.user.name
          showProfileStatus('Profile updated successfully!', 'success')
        } else {
          throw new Error(data.message || 'Failed to update profile')
        }
      })
      .catch((error) => {
        console.error('Error updating profile:', error)
        showProfileStatus(
          error.message || 'Failed to update profile. Please try again.',
          'error'
        )
      })
  })

  // Helper function to show profile status messages
  function showProfileStatus(message, type) {
    const statusEl = document.getElementById('profile-status')
    statusEl.textContent = message
    statusEl.className = 'form-status'

    if (type === 'success') {
      statusEl.classList.add('success')
      // Auto-hide success messages after 3 seconds
      setTimeout(() => {
        statusEl.style.display = 'none'
      }, 3000)
    } else if (type === 'error') {
      statusEl.classList.add('error')
    } else {
      // For "info" or other types
      statusEl.classList.add('info')
    }

    statusEl.style.display = 'block'
  }

  // Logout button
  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault()

    // Clear user data from localStorage
    localStorage.removeItem('user')

    // Redirect to home page
    window.location.href = 'index.html'
  })

  // Appointment actions (delegation)
  document
    .getElementById('appointments-data')
    .addEventListener('click', function (e) {
      const target = e.target.closest('button')
      if (!target) return

      const row = target.closest('tr')
      const appointmentId = row.dataset.appointmentId

      if (target.classList.contains('btn-reschedule')) {
        openRescheduleModal(appointmentId)
      } else if (target.classList.contains('btn-cancel')) {
        confirmCancelAppointment(appointmentId)
      }
    })

  // Modal close button
  document.querySelector('.close').addEventListener('click', closeModal)
  document
    .getElementById('cancel-reschedule')
    .addEventListener('click', closeModal)

  // Reschedule form submission
  document
    .getElementById('reschedule-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()

      const appointmentId = document.getElementById('appointment-id').value
      const newDate = document.getElementById('new-date').value
      const newTime = document.getElementById('new-time').value

      fetch(
        `http://localhost:3000/api/appointments/${appointmentId}/reschedule`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: newDate, time: newTime }),
        }
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to reschedule appointment')
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            closeModal()
            // Reload appointments to show updated data
            loadAppointments()
          } else {
            throw new Error(data.message || 'Failed to reschedule appointment')
          }
        })
        .catch((error) => {
          console.error('Error rescheduling appointment:', error)
          alert(`Error: ${error.message}`)
        })
    })
}

// Open reschedule modal
function openRescheduleModal(appointmentId) {
  const modal = document.getElementById('appointment-modal')
  document.getElementById('appointment-id').value = appointmentId

  // Set minimum date to today with proper formatting
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const formattedToday = `${yyyy}-${mm}-${dd}`

  document.getElementById('new-date').min = formattedToday

  modal.style.display = 'block'
}

// Close modal
function closeModal() {
  document.getElementById('appointment-modal').style.display = 'none'
}

// Confirm appointment cancellation
function confirmCancelAppointment(appointmentId) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    fetch(`http://localhost:3000/api/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to cancel appointment')
        }
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          // Reload appointments to show updated data
          loadAppointments()
        } else {
          throw new Error(data.message || 'Failed to cancel appointment')
        }
      })
      .catch((error) => {
        console.error('Error cancelling appointment:', error)
        alert(`Error: ${error.message}`)
      })
  }
}

// Close modal if clicked outside
window.addEventListener('click', function (e) {
  const modal = document.getElementById('appointment-modal')
  if (e.target === modal) {
    closeModal()
  }
})
