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

  // Check if user is admin and show/hide admin link
  const adminLink = document.getElementById('admin-link')
  if (adminLink) {
    adminLink.style.display = user.role === 'admin' ? 'block' : 'none'
  }

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

  try {
    // Add time component with explicit Philippine timezone if not present
    const dateStr = dateString.includes('T')
      ? dateString
      : `${dateString}T00:00:00+08:00`

    const date = new Date(dateStr)

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString)
      return ''
    }

    // Format as YYYY-MM-DD for input fields
    return date.toISOString().split('T')[0]
  } catch (err) {
    console.error('Error formatting date for input:', err, dateString)
    return ''
  }
}

// Load appointments for the current user
let rescheduleAppointmentData = []

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

      // Store appointment data for reschedule
      rescheduleAppointmentData = data.appointments

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

          // Handle the date properly with explicit Philippine timezone
          let formattedDate = 'Invalid date'
          let formattedTime = 'N/A'

          try {
            // Ensure we have a valid date string
            if (apt.date) {
              // Add time component with explicit Philippine timezone if not present
              const dateStr = apt.date.includes('T')
                ? apt.date
                : `${apt.date}T00:00:00+08:00`

              const dateObj = new Date(dateStr)

              // Check if date is valid before formatting
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  timeZone: 'Asia/Manila', // Explicitly use Philippine timezone
                })
              }
            }

            // Format the time if available
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
          } catch (err) {
            console.error('Error formatting date/time:', err)
            // Fall back to showing the raw date if there's an error
            formattedDate = apt.date || 'Unknown date'
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
          showToast('Profile updated successfully!', TOAST_LEVELS.SUCCESS)
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
        showToast(
          error.message || 'Failed to update profile',
          TOAST_LEVELS.ERROR
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

      if (!newDate || !newTime) {
        showToast('Please select both date and time', TOAST_LEVELS.ERROR)
        return
      }

      // Show loading indicator
      const submitBtn = this.querySelector('button[type="submit"]')
      const originalText = submitBtn.innerHTML
      submitBtn.disabled = true
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...'

      // First check if the dentist is available on this date
      const appointmentData = rescheduleAppointmentData.find(
        (apt) => apt.id == appointmentId
      )

      if (!appointmentData) {
        showToast('Error: Could not find appointment data', TOAST_LEVELS.ERROR)
        submitBtn.disabled = false
        submitBtn.innerHTML = originalText
        return
      }

      // Check clinic availability first
      fetch(
        `http://localhost:3000/api/clinic/check-availability?date=${newDate}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to check clinic availability')
          }
          return response.json()
        })
        .then((clinicData) => {
          if (!clinicData.success) {
            throw new Error(
              clinicData.message || 'Failed to check clinic availability'
            )
          }
          if (!clinicData.available) {
            throw new Error(
              clinicData.reason || 'The clinic is closed on the selected date'
            )
          }

          // If clinic is open, check dentist availability
          return fetch(
            `http://localhost:3000/api/dentist/check-availability?date=${newDate}&dentistName=${encodeURIComponent(
              appointmentData.dentist
            )}`
          )
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to check dentist availability')
          }
          return response.json()
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.message || 'Failed to check availability')
          }

          if (!data.available) {
            // Throw error with the specific reason from the backend
            throw new Error(
              data.reason || 'The dentist is not available on this date'
            )
          }

          // If dentist is available, proceed with reschedule
          return fetch(
            `http://localhost:3000/api/appointments/${appointmentId}/reschedule`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: newDate, time: newTime }),
            }
          )
        })
        .then((response) => {
          if (!response.ok) {
            // Try to parse error message from backend
            return response
              .json()
              .then((errData) => {
                throw new Error(
                  errData.message || 'Failed to reschedule appointment'
                )
              })
              .catch(() => {
                // Fallback if parsing fails
                throw new Error(
                  `Reschedule failed with status: ${response.status}`
                )
              })
          }
          return response.json()
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.message || 'Failed to reschedule appointment')
          }
          showToast(
            'Appointment rescheduled successfully!',
            TOAST_LEVELS.SUCCESS
          )
          closeModal()
          loadAppointments() // Reload appointments
        })
        .catch((error) => {
          console.error('Error rescheduling appointment:', error)
          // Display the specific error message caught (including availability reasons)
          showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
        })
        .finally(() => {
          // Reset button state
          submitBtn.disabled = false
          submitBtn.innerHTML = originalText
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

  // Fetch current appointment date to pre-populate date field
  fetch(`http://localhost:3000/api/appointments/${appointmentId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.appointment && data.appointment.date) {
        // Format the date correctly for the input field (YYYY-MM-DD)
        try {
          const dateObj = new Date(`${data.appointment.date}T00:00:00+08:00`)
          if (!isNaN(dateObj.getTime())) {
            const currentDate = dateObj.toISOString().split('T')[0]
            document.getElementById('new-date').value = currentDate
          }
        } catch (err) {
          console.error('Error setting current date:', err)
        }

        // Set current time if available
        if (data.appointment.time) {
          document.getElementById('new-time').value =
            data.appointment.time.substring(0, 5)
        }
      }
    })
    .catch((err) => console.error('Error fetching appointment details:', err))

  modal.style.display = 'block'
}

// Close modal
function closeModal() {
  document.getElementById('appointment-modal').style.display = 'none'
}

// Confirm appointment cancellation
function confirmCancelAppointment(appointmentId) {
  // First fetch the appointment details to check the date
  fetch(`http://localhost:3000/api/appointments/${appointmentId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch appointment details')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success || !data.appointment) {
        throw new Error('Failed to retrieve appointment information')
      }

      const appointment = data.appointment

      try {
        // Create date objects with proper timezone handling
        let appointmentDate
        const today = new Date()

        if (appointment.date) {
          // Add time component with explicit Philippine timezone if not present
          const dateStr = appointment.date.includes('T')
            ? appointment.date
            : `${appointment.date}T00:00:00+08:00`

          appointmentDate = new Date(dateStr)

          // If date is invalid, throw error
          if (isNaN(appointmentDate.getTime())) {
            throw new Error('Invalid appointment date')
          }
        } else {
          throw new Error('Missing appointment date')
        }

        // Set both to midnight for date comparison only
        appointmentDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)

        // Check if appointment is today or in the past
        if (appointmentDate.getTime() <= today.getTime()) {
          showNotificationDialog(
            'You cannot cancel appointments on the same day or past appointments. Please contact the clinic directly.',
            'Cancellation Restricted',
            null,
            'Understand'
          )
          return
        }

        // If cancellation is allowed, show confirmation
        showConfirmDialog(
          'Are you sure you want to cancel this appointment?<br><br>' +
            '<div class="downpayment-notice">' +
            '<i class="fas fa-exclamation-triangle"></i> ' +
            'Please note: Downpayment policies may apply to cancellations. Contact the clinic for refund information.' +
            '</div>',
          () => {
            // Proceed with cancellation
            fetch(
              `http://localhost:3000/api/appointments/${appointmentId}/cancel`,
              {
                method: 'PUT',
              }
            )
              .then((response) => {
                if (!response.ok) {
                  throw new Error('Failed to cancel appointment')
                }
                return response.json()
              })
              .then((data) => {
                if (data.success) {
                  // Reload appointments to show updated data
                  showToast(
                    'Appointment cancelled successfully',
                    TOAST_LEVELS.SUCCESS
                  )
                  loadAppointments()
                } else {
                  throw new Error(
                    data.message || 'Failed to cancel appointment'
                  )
                }
              })
              .catch((error) => {
                console.error('Error cancelling appointment:', error)
                showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
              })
          }
        )
      } catch (err) {
        console.error('Date validation error:', err)
        showToast(
          `Error validating appointment date: ${err.message}`,
          TOAST_LEVELS.ERROR
        )
        return
      }
    })
    .catch((error) => {
      console.error('Error checking appointment date:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Close modal if clicked outside
window.addEventListener('click', function (e) {
  const modal = document.getElementById('appointment-modal')
  if (e.target === modal) {
    closeModal()
  }
})
