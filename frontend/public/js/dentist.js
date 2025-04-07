document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in as dentist
  const user = checkDentistAuth()
  if (!user) {
    console.error('Not authenticated as dentist. Stopping script execution.')
    return
  }

  // Initialize dentist dashboard components
  initNavbarToggle()
  initTabs()
  loadDentistName(user.name)
  loadDentistProfile(user.id)
  loadAppointments(user.id)
  loadAvailability(user.id)
  setupEventListeners(user.id)
})

// Mobile navbar toggle
function initNavbarToggle() {
  document.querySelector('.burger').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('nav-active')
    document.querySelector('.burger').classList.toggle('toggle')
  })
}

// Initialize tabs
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn')
  const tabPanes = document.querySelectorAll('.tab-pane')

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove('active'))
      // Add active class to clicked button
      button.classList.add('active')

      // Hide all tab panes
      tabPanes.forEach((pane) => pane.classList.remove('active'))
      // Show the corresponding tab pane
      const tabId = `${button.getAttribute('data-tab')}-tab`
      document.getElementById(tabId).classList.add('active')
    })
  })
}

// Load dentist's name in the header
function loadDentistName(name) {
  document.getElementById('dentist-name').textContent = name.split(' ')[0]
}

// Load dentist profile data
function loadDentistProfile(userId) {
  fetch(`http://localhost:3000/api/dentists/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch dentist profile')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load dentist profile')
      }

      const dentist = data.dentist

      // Populate form with dentist data
      document.getElementById('specialization').value =
        dentist.specialization || ''
      document.getElementById('bio').value = dentist.bio || ''
    })
    .catch((error) => {
      console.error('Error loading dentist profile:', error)
      showProfileStatus('Error loading profile: ' + error.message, 'error')
    })
}

// Load appointments that this dentist is assigned to
function loadAppointments(userId, showAllDentists = false) {
  const tableBody = document.getElementById('appointments-data')
  const noAppointmentsMsg = document.getElementById('no-appointments')

  // Show loading indicator
  tableBody.innerHTML =
    '<tr><td colspan="5" style="text-align: center;">Loading appointments...</td></tr>'

  // Update view mode indicator
  const viewModeElement = document.getElementById('view-mode-indicator')
  if (viewModeElement) {
    viewModeElement.textContent = showAllDentists
      ? 'Viewing: All Dentists'
      : 'Viewing: My Appointments'
  }

  // Fetch appointments from API - either just this dentist's or all
  const endpoint = showAllDentists
    ? 'http://localhost:3000/api/appointments'
    : `http://localhost:3000/api/dentist/appointments/${userId}`

  fetch(endpoint)
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
          // Format date for display with better error handling
          let formattedDate = 'Invalid date'
          try {
            if (apt.date) {
              const dateObj = new Date(apt.date)

              // Check if date is valid before formatting
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              } else {
                console.warn('Invalid date for appointment ID:', apt.id)
              }
            }
          } catch (err) {
            console.error('Error formatting date:', err)
          }

          // Format time with proper error handling
          let formattedTime = 'N/A'
          try {
            if (apt.time) {
              const [hours, minutes] = apt.time.split(':')
              if (!isNaN(hours) && !isNaN(minutes)) {
                const timeObj = new Date()
                timeObj.setHours(hours, minutes, 0)
                formattedTime = timeObj.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
            }
          } catch (err) {
            console.error(
              'Error formatting time for appointment ID:',
              apt.id,
              err
            )
          }

          // Create a row with appropriate styling if this isn't the current dentist's appointment
          const row = document.createElement('tr')
          row.dataset.appointmentId = apt.id
          row.dataset.patientId = apt.user_id
          row.dataset.patientName = apt.userName || 'Unknown'

          // Get current user's name
          const currentUser = JSON.parse(localStorage.getItem('user'))
          const isCurrentDentistAppointment = apt.dentist === currentUser.name

          // Add a class if this isn't the current dentist's appointment
          if (!isCurrentDentistAppointment && showAllDentists) {
            row.classList.add('other-dentist-appointment')
          }

          row.innerHTML = `
            <td>${formattedDate}<br>${formattedTime}</td>
            <td>${apt.userName || 'Unknown'}</td>
            <td>${apt.service}</td>
            <td>
              <span class="appointment-status status-${apt.status}">
                ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
              </span>
              ${
                !isCurrentDentistAppointment && showAllDentists
                  ? `<span class="dentist-tag">${apt.dentist}</span>`
                  : ''
              }
            </td>
            <td>
              <button class="action-btn btn-view" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              ${
                isCurrentDentistAppointment && apt.status === 'pending'
                  ? `
                <button class="action-btn btn-confirm" title="Confirm Appointment">
                  <i class="fas fa-check"></i>
                </button>
              `
                  : ''
              }
              ${
                isCurrentDentistAppointment && apt.status === 'confirmed'
                  ? `
                <button class="action-btn btn-complete" title="Mark as Completed">
                  <i class="fas fa-check-double"></i>
                </button>
              `
                  : ''
              }
              ${
                isCurrentDentistAppointment &&
                apt.status !== 'cancelled' &&
                apt.status !== 'completed'
                  ? `
                <button class="action-btn btn-cancel" title="Cancel Appointment">
                  <i class="fas fa-times"></i>
                </button>
              `
                  : ''
              }
              ${
                !isCurrentDentistAppointment &&
                showAllDentists &&
                apt.status === 'pending'
                  ? `
                <button class="action-btn btn-assign" title="Assign to Me">
                  <i class="fas fa-user-plus"></i>
                </button>
              `
                  : ''
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

// Load dentist's availability
function loadAvailability(userId) {
  const availabilityContainer = document.getElementById('availability-calendar')
  const noAvailabilityMsg = document.getElementById('no-availability')

  // Fetch availability from API
  fetch(`http://localhost:3000/api/dentist/availability/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }
      return response.json()
    })
    .then((data) => {
      // Clear previous data
      availabilityContainer.innerHTML = ''

      if (!data.success) {
        throw new Error(data.message || 'Failed to load availability')
      }

      const availability = data.availability

      if (availability.length === 0) {
        availabilityContainer.style.display = 'none'
        noAvailabilityMsg.style.display = 'block'
      } else {
        availabilityContainer.style.display = 'block'
        noAvailabilityMsg.style.display = 'none'

        // Sort availability by date
        availability.sort((a, b) => new Date(a.date) - new Date(b.date))

        // Add availability items
        availability.forEach((item) => {
          // Format date
          const dateObj = new Date(item.date)
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          // Format times
          const startTimeObj = new Date(`1970-01-01T${item.timeStart}`)
          const endTimeObj = new Date(`1970-01-01T${item.timeEnd}`)

          const formattedStartTime = startTimeObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })

          const formattedEndTime = endTimeObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })

          const availabilityItem = document.createElement('div')
          availabilityItem.className = 'availability-item'
          availabilityItem.dataset.availabilityId = item.id
          availabilityItem.innerHTML = `
            <div class="date-time">
              <div>${formattedDate}</div>
              <div>${formattedStartTime} - ${formattedEndTime}</div>
            </div>
            <div class="actions">
              <button class="delete-availability" title="Delete availability">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          `
          availabilityContainer.appendChild(availabilityItem)
        })
      }
    })
    .catch((error) => {
      console.error('Error loading availability:', error)
      availabilityContainer.innerHTML = `
        <div style="text-align: center; color: #721c24; padding: 1rem;">
          Error loading availability: ${error.message}
        </div>
      `
    })
}

// Open appointment details modal
function openAppointmentModal(appointmentId, userId, patientId, patientName) {
  const modal = document.getElementById('appointment-modal')
  const detailsContainer = document.getElementById('appointment-details')
  const notesTextarea = document.getElementById('patient-notes')

  // Show loading
  detailsContainer.innerHTML = '<p>Loading appointment details...</p>'
  notesTextarea.value = ''

  // Set data for the modal
  modal.dataset.appointmentId = appointmentId
  modal.dataset.userId = userId
  modal.dataset.patientId = patientId
  modal.dataset.patientName = patientName

  // Show the modal
  modal.style.display = 'block'

  // Fetch appointment details
  fetch(`http://localhost:3000/api/appointments/${appointmentId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch appointment details')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load appointment details')
      }

      const apt = data.appointment

      // Format date for display with better error handling
      let formattedDate = 'Not available'
      try {
        if (apt.date) {
          // Standardize date format and handle timezone consistently
          const dateObj = new Date(apt.date)

          // Check if date is valid before formatting
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          } else {
            console.warn('Invalid appointment date:', apt.date)
          }
        }
      } catch (err) {
        console.error('Error formatting appointment date:', err)
      }

      // Format time with better error handling
      let formattedTime = 'Not available'
      try {
        if (apt.time) {
          const [hours, minutes] = apt.time.split(':')
          if (!isNaN(hours) && !isNaN(minutes)) {
            const timeObj = new Date()
            timeObj.setHours(hours, minutes, 0)
            formattedTime = timeObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }
        }
      } catch (err) {
        console.error('Error formatting appointment time:', err)
      }

      // Populate details
      detailsContainer.innerHTML = `
        <div class="detail-item">
          <div class="detail-label">Patient:</div>
          <div class="detail-value">${
            apt.userName || patientName || 'Unknown'
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Service:</div>
          <div class="detail-value">${apt.service}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Date:</div>
          <div class="detail-value">${formattedDate}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Time:</div>
          <div class="detail-value">${formattedTime}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Status:</div>
          <div class="detail-value">
            <span class="appointment-status status-${apt.status}">
              ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
            </span>
          </div>
        </div>
        ${
          apt.notes
            ? `
        <div class="detail-item">
          <div class="detail-label">Notes:</div>
          <div class="detail-value">${apt.notes}</div>
        </div>
        `
            : ''
        }
      `

      // Show/hide buttons based on status
      const confirmBtn = document.getElementById('confirm-appointment')
      const completeBtn = document.getElementById('complete-appointment')
      const cancelBtn = document.getElementById('cancel-appointment')

      confirmBtn.style.display =
        apt.status === 'pending' ? 'inline-block' : 'none'
      completeBtn.style.display =
        apt.status === 'confirmed' ? 'inline-block' : 'none'
      cancelBtn.style.display =
        apt.status !== 'cancelled' && apt.status !== 'completed'
          ? 'inline-block'
          : 'none'

      // Load existing patient notes if any
      return fetch(
        `http://localhost:3000/api/dentist/notes/${userId}/${patientId}`
      )
    })
    .then((response) => {
      if (!response.ok) {
        // Don't throw error as this is optional
        console.warn('Failed to fetch patient notes, but continuing')
        return { success: false, notes: [] }
      }
      return response.json()
    })
    .then((data) => {
      if (data.success && data.notes && data.notes.length > 0) {
        // Use the most recent note
        notesTextarea.value = data.notes[0].notes
      }
    })
    .catch((error) => {
      console.error('Error loading appointment details:', error)
      detailsContainer.innerHTML = `<p style="color: #721c24;">Error loading appointment details: ${error.message}</p>`
    })
}

// Update appointment status
function updateAppointmentStatus(appointmentId, status) {
  // If cancelling, check date first
  if (status === 'cancelled') {
    // For dentists, we'll also allow cancellation but show a warning for same-day appointments
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
          // Create date objects with proper timezone handling and validation
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          let appointmentDate = null

          if (appointment.date) {
            // Safely parse the date
            appointmentDate = new Date(appointment.date)

            // Validate the date is valid before comparison
            if (isNaN(appointmentDate.getTime())) {
              throw new Error('Invalid appointment date')
            }

            // Set both to midnight for date comparison only
            appointmentDate.setHours(0, 0, 0, 0)

            // Show appropriate warning for same-day cancellation
            if (appointmentDate.getTime() <= today.getTime()) {
              showConfirmDialog(
                '<b>Warning:</b> This is a same-day appointment cancellation. The patient should be notified immediately.<br><br>Are you sure you want to proceed?',
                () => processDentistStatusUpdate(appointmentId, status),
                null,
                'Proceed with Cancellation',
                'Go Back'
              )
              return
            }
          } else {
            // If no date is available, assume it's valid to cancel
            console.warn(
              'No date available for appointment, proceeding with cancellation'
            )
          }

          // If not same-day, proceed with normal cancellation confirmation
          showConfirmDialog(
            `Are you sure you want to cancel this appointment?`,
            () => processDentistStatusUpdate(appointmentId, status)
          )
        } catch (error) {
          console.error('Error validating appointment date:', error)
          showToast(
            `Error validating date: ${error.message}. Proceeding with cancellation option.`,
            TOAST_LEVELS.WARNING
          )

          // Still allow cancellation even if there's a date validation error
          showConfirmDialog(
            `Unable to validate appointment date, but you can still cancel. Continue?`,
            () => processDentistStatusUpdate(appointmentId, status)
          )
        }
      })
      .catch((error) => {
        console.error('Error checking appointment date:', error)
        showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
      })
  } else {
    // For non-cancellation status updates, proceed normally
    processDentistStatusUpdate(appointmentId, status)
  }
}

// Helper function to process the actual status update
function processDentistStatusUpdate(appointmentId, status) {
  fetch(`http://localhost:3000/api/appointments/${appointmentId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(
              data.message || 'Failed to update appointment status'
            )
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to update appointment status')
      }

      // Close modal and reload appointments
      closeModal()
      showToast(`Appointment ${status} successfully!`, TOAST_LEVELS.SUCCESS)
      const userId = JSON.parse(localStorage.getItem('user')).id
      loadAppointments(userId)
    })
    .catch((error) => {
      console.error('Error updating appointment status:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Save patient notes
function savePatientNotes(userId, patientId, appointmentId, notes) {
  fetch(`http://localhost:3000/api/dentist/notes/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      patientId,
      appointmentId,
      notes,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.message || 'Failed to save patient notes')
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to save patient notes')
      }

      alert('Patient notes saved successfully')
    })
    .catch((error) => {
      console.error('Error saving patient notes:', error)
      alert(`Error: ${error.message}`)
    })
}

// Save dentist availability
function saveAvailability(userId, date, timeStart, timeEnd) {
  return fetch(`http://localhost:3000/api/dentist/availability/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      date,
      timeStart,
      timeEnd,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.message || 'Failed to save availability')
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to save availability')
      }
      return data
    })
}

// Update dentist profile
function updateDentistProfile(userId, specialization, bio) {
  return fetch(`http://localhost:3000/api/dentists/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      specialization,
      bio,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.message || 'Failed to update profile')
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to update profile')
      }
      return data
    })
}

// Close modal
function closeModal() {
  document.getElementById('appointment-modal').style.display = 'none'
}

// Filter appointments by status and/or date
function filterAppointments() {
  const statusFilter = document.getElementById('status-filter').value
  const dateFilter = document.getElementById('date-filter').value

  const rows = document.querySelectorAll('#dentist-appointments-table tbody tr')
  let visibleCount = 0

  rows.forEach((row) => {
    let showRow = true

    // Filter by status
    if (statusFilter !== 'all') {
      const statusCell = row.querySelector('.appointment-status')
      const rowStatus = statusCell.className.split('status-')[1].split(' ')[0]
      if (rowStatus !== statusFilter) {
        showRow = false
      }
    }

    // Filter by date
    if (dateFilter && showRow) {
      const dateCell = row.querySelector('td:nth-child(1)').textContent

      // Extract just the date part from the cell text which might include time
      const datePart = dateCell.split('<br>')[0].trim()

      // Create date objects for comparison (correct timezone handling)
      const rowDate = new Date(datePart)
      const filterDate = new Date(dateFilter)

      // Just compare the date parts (year, month, day)
      if (
        rowDate.getFullYear() !== filterDate.getFullYear() ||
        rowDate.getMonth() !== filterDate.getMonth() ||
        rowDate.getDate() !== filterDate.getDate()
      ) {
        showRow = false
      }
    }

    // Show or hide row
    if (showRow) {
      row.style.display = ''
      visibleCount++
    } else {
      row.style.display = 'none'
    }
  })

  // Show or hide "no appointments" message
  const noAppointmentsMsg = document.getElementById('no-appointments')
  if (visibleCount === 0) {
    noAppointmentsMsg.style.display = 'block'
  } else {
    noAppointmentsMsg.style.display = 'none'
  }
}

// Show status message on profile tab
function showProfileStatus(message, type) {
  const statusEl = document.getElementById('profile-status')
  statusEl.textContent = message
  statusEl.className = 'form-status'

  if (type === 'success') {
    statusEl.classList.add('success')
  } else if (type === 'error') {
    statusEl.classList.add('error')
  } else {
    statusEl.classList.add('info')
  }

  statusEl.style.display = 'block'

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none'
    }, 3000)
  }
}

// Show status message on availability tab
function showAvailabilityStatus(message, type) {
  const statusEl = document.getElementById('availability-status')
  statusEl.textContent = message
  statusEl.className = 'form-status'

  if (type === 'success') {
    statusEl.classList.add('success')
  } else if (type === 'error') {
    statusEl.classList.add('error')
  } else {
    statusEl.classList.add('info')
  }

  statusEl.style.display = 'block'

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusEl.style.display = 'none'
    }, 3000)
  }
}

// Setup all event listeners
function setupEventListeners(userId) {
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault()
    localStorage.removeItem('user')
    window.location.href = 'index.html'
  })

  // Appointment filters
  document
    .getElementById('status-filter')
    .addEventListener('change', filterAppointments)
  document
    .getElementById('date-filter')
    .addEventListener('input', filterAppointments)
  document
    .getElementById('clear-filters')
    .addEventListener('click', function () {
      document.getElementById('status-filter').value = 'all'
      document.getElementById('date-filter').value = ''
      filterAppointments()
    })

  // Appointment actions (delegation)
  document
    .getElementById('appointments-data')
    .addEventListener('click', function (e) {
      const target = e.target.closest('button')
      if (!target) return

      const row = target.closest('tr')
      const appointmentId = row.dataset.appointmentId
      const patientId = row.dataset.patientId
      const patientName = row.dataset.patientName

      if (target.classList.contains('btn-view')) {
        openAppointmentModal(appointmentId, userId, patientId, patientName)
      } else if (target.classList.contains('btn-confirm')) {
        showConfirmDialog(
          'Are you sure you want to confirm this appointment?',
          () => updateAppointmentStatus(appointmentId, 'confirmed')
        )
      } else if (target.classList.contains('btn-complete')) {
        showConfirmDialog(
          'Are you sure you want to mark this appointment as completed?',
          () => updateAppointmentStatus(appointmentId, 'completed')
        )
      } else if (target.classList.contains('btn-cancel')) {
        showConfirmDialog(
          'Are you sure you want to cancel this appointment?',
          () => updateAppointmentStatus(appointmentId, 'cancelled')
        )
      } else if (target.classList.contains('btn-assign')) {
        showConfirmDialog(
          'Are you sure you want to assign this appointment to yourself?',
          () => assignAppointmentToDentist(appointmentId, userId)
        )
      }
    })

  // Modal close button
  document.querySelector('.close').addEventListener('click', closeModal)
  document.getElementById('close-modal').addEventListener('click', closeModal)

  // Appointment action buttons in modal
  document
    .getElementById('confirm-appointment')
    .addEventListener('click', function () {
      const appointmentId =
        document.getElementById('appointment-modal').dataset.appointmentId
      showConfirmDialog(
        'Are you sure you want to confirm this appointment?',
        () => updateAppointmentStatus(appointmentId, 'confirmed')
      )
    })

  document
    .getElementById('complete-appointment')
    .addEventListener('click', function () {
      const appointmentId =
        document.getElementById('appointment-modal').dataset.appointmentId
      showConfirmDialog(
        'Are you sure you want to mark this appointment as completed?',
        () => updateAppointmentStatus(appointmentId, 'completed')
      )
    })

  document
    .getElementById('cancel-appointment')
    .addEventListener('click', function () {
      const appointmentId =
        document.getElementById('appointment-modal').dataset.appointmentId
      showConfirmDialog(
        'Are you sure you want to cancel this appointment?',
        () => updateAppointmentStatus(appointmentId, 'cancelled')
      )
    })

  // Save patient notes button
  document.getElementById('save-notes').addEventListener('click', function () {
    const modal = document.getElementById('appointment-modal')
    const notes = document.getElementById('patient-notes').value.trim()

    if (!notes) {
      alert('Please enter some notes before saving')
      return
    }

    savePatientNotes(
      userId,
      modal.dataset.patientId,
      modal.dataset.appointmentId,
      notes
    )
  })

  // Availability form submission
  document
    .getElementById('availability-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()

      const date = document.getElementById('availability-date').value
      const timeStart = document.getElementById('time-start').value
      const timeEnd = document.getElementById('time-end').value

      // Validate times
      if (timeStart >= timeEnd) {
        showAvailabilityStatus('End time must be after start time', 'error')
        return
      }

      showAvailabilityStatus('Saving availability...', 'info')

      saveAvailability(userId, date, timeStart, timeEnd)
        .then(() => {
          showAvailabilityStatus('Availability saved successfully!', 'success')

          // Clear form
          document.getElementById('availability-date').value = ''
          document.getElementById('time-start').value = ''
          document.getElementById('time-end').value = ''

          // Reload availability
          loadAvailability(userId)
        })
        .catch((error) => {
          showAvailabilityStatus('Error: ' + error.message, 'error')
        })
    })

  // Delete availability (delegation)
  document
    .getElementById('availability-calendar')
    .addEventListener('click', function (e) {
      const target = e.target.closest('button')
      if (!target || !target.classList.contains('delete-availability')) return

      const item = target.closest('.availability-item')
      const availabilityId = item.dataset.availabilityId

      if (confirm('Delete this availability?')) {
        // Implement this if needed in future
        console.log('Would delete availability ID:', availabilityId)
        // For now, just reload to remove from view
        loadAvailability(userId)
      }
    })

  // Dentist profile form submission
  document
    .getElementById('dentist-profile-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()

      const specialization = document
        .getElementById('specialization')
        .value.trim()
      const bio = document.getElementById('bio').value.trim()

      showProfileStatus('Updating profile...', 'info')

      updateDentistProfile(userId, specialization, bio)
        .then((data) => {
          showProfileStatus('Profile updated successfully!', 'success')
        })
        .catch((error) => {
          showProfileStatus('Error: ' + error.message, 'error')
        })
    })

  // Close modal if clicked outside
  window.addEventListener('click', function (e) {
    const modal = document.getElementById('appointment-modal')
    if (e.target === modal) {
      closeModal()
    }
  })

  // Toggle view between my appointments and all dentists
  document.getElementById('view-toggle').addEventListener('click', function () {
    const isViewingAll = this.classList.toggle('viewing-all')
    // Update button text
    this.textContent = isViewingAll
      ? 'View My Appointments'
      : 'View All Appointments'
    // Reload appointments with the new filter
    loadAppointments(userId, isViewingAll)
  })
}

// New function to assign an appointment to the current dentist
function assignAppointmentToDentist(appointmentId, userId) {
  const currentUser = JSON.parse(localStorage.getItem('user'))
  if (!currentUser || !currentUser.name) {
    showToast('Error: User information not available', TOAST_LEVELS.ERROR)
    return
  }

  fetch(`http://localhost:3000/api/appointments/${appointmentId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dentistName: currentUser.name,
      dentistId: userId,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.message || 'Failed to assign appointment')
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to assign appointment')
      }

      showToast(
        `Appointment assigned to you successfully!`,
        TOAST_LEVELS.SUCCESS
      )

      // Reload with current view mode
      const viewToggleBtn = document.getElementById('view-toggle')
      const isViewingAll = viewToggleBtn.classList.contains('viewing-all')
      loadAppointments(userId, isViewingAll)
    })
    .catch((error) => {
      console.error('Error assigning appointment:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Dentist auth check function
function checkDentistAuth() {
  try {
    const userString = localStorage.getItem('user')
    if (!userString) {
      window.location.replace('login.html')
      return null
    }

    const user = JSON.parse(userString)
    if (!user || !user.id) {
      localStorage.removeItem('user')
      window.location.replace('login.html')
      return null
    }

    if (user.role !== 'dentist') {
      alert('Access denied. Dentist access only.')
      window.location.replace('dashboard.html')
      return null
    }

    return user
  } catch (error) {
    console.error('Error checking dentist authentication:', error)
    localStorage.removeItem('user')
    window.location.replace('login.html')
    return null
  }
}
