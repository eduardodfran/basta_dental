document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user) {
    // Redirect to login if no user data is found
    window.location.href = 'login.html'
    return
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
  const date = new Date(dateString)
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

  // Make API request to get user appointments
  // In a real implementation, this would be:
  // fetch(`http://localhost:3000/api/appointments/user/${user.id}`)

  // For now, we'll simulate the API call with mock data based on user ID
  setTimeout(() => {
    // This simulates an API call - in production, replace with actual fetch
    const appointments = getAppointmentsForUser(user.id)

    // Clear previous data
    tableBody.innerHTML = ''

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

        // Format date for display
        const dateObj = new Date(apt.date + (apt.time ? 'T' + apt.time : ''))
        const formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
        const formattedTime = apt.time
          ? dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'N/A'

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
  }, 500) // Simulate network delay
}

// Mock function to get appointments for a specific user
// In production, this would be replaced with an actual API call
function getAppointmentsForUser(userId) {
  // This is just for demonstration - in a real app, this would be an API call
  const mockAppointments = {
    1: [
      // User with ID 1
      {
        id: 101,
        date: '2023-10-15',
        time: '10:00',
        service: 'General Checkup',
        dentist: 'Dr. Sarah Johnson',
        status: 'confirmed',
      },
      {
        id: 102,
        date: '2023-11-05',
        time: '14:30',
        service: 'Teeth Whitening',
        dentist: 'Dr. Michael Chen',
        status: 'pending',
      },
    ],
    2: [
      // User with ID 2
      {
        id: 201,
        date: '2023-10-10',
        time: '09:15',
        service: 'Root Canal',
        dentist: 'Dr. Emily Wilson',
        status: 'completed',
      },
    ],
  }

  return mockAppointments[userId] || []
}

// Setup event listeners for various interactions
function setupEventListeners() {
  // Profile form submission
  const profileForm = document.getElementById('profile-form')
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault()

    const user = JSON.parse(localStorage.getItem('user'))
    if (!user) return

    const updatedData = {
      name: document.getElementById('full-name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      dob: document.getElementById('dob').value,
      address: document.getElementById('address').value,
    }

    const statusEl = document.getElementById('profile-status')
    statusEl.textContent = 'Updating profile...'
    statusEl.className = 'form-status'
    statusEl.style.display = 'block'

    // In a real implementation, this would be:
    // fetch(`http://localhost:3000/api/users/${user.id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updatedData)
    // })

    // For now, we'll simulate the API call
    setTimeout(() => {
      // Simulate successful update
      // Update the user data in localStorage
      const updatedUser = { ...user, ...updatedData }
      localStorage.setItem('user', JSON.stringify(updatedUser))

      // Update user name in header
      document.getElementById('user-name').textContent = updatedData.name

      // Show success message
      statusEl.textContent = 'Profile updated successfully!'
      statusEl.className = 'form-status success'

      // Hide message after 3 seconds
      setTimeout(() => {
        statusEl.style.display = 'none'
      }, 3000)
    }, 800) // Simulate network delay
  })

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

      // In a real implementation, this would be:
      // fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ date: newDate, time: newTime })
      // })

      // For now, we'll simulate the API call
      setTimeout(() => {
        // Display success message
        alert(
          `Appointment ${appointmentId} rescheduled to ${newDate} at ${newTime}`
        )

        closeModal()
        // Reload appointments to show updated data
        loadAppointments()
      }, 500)
    })
}

// Open reschedule modal
function openRescheduleModal(appointmentId) {
  const modal = document.getElementById('appointment-modal')
  document.getElementById('appointment-id').value = appointmentId

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]
  document.getElementById('new-date').min = today

  modal.style.display = 'block'
}

// Close modal
function closeModal() {
  document.getElementById('appointment-modal').style.display = 'none'
}

// Confirm appointment cancellation
function confirmCancelAppointment(appointmentId) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    // In a real implementation, this would be:
    // fetch(`http://localhost:3000/api/appointments/${appointmentId}/cancel`, {
    //   method: 'PUT'
    // })

    // For now, we'll simulate the API call
    setTimeout(() => {
      alert(`Appointment ${appointmentId} has been cancelled.`)
      loadAppointments()
    }, 500)
  }
}

// Close modal if clicked outside
window.addEventListener('click', function (e) {
  const modal = document.getElementById('appointment-modal')
  if (e.target === modal) {
    closeModal()
  }
})
