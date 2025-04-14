document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in as dentist
  const user = checkDentistAuth()
  if (!user) {
    console.error('Not authenticated as dentist. Stopping script execution.')
    return
  }

  // Initialize dentist dashboard components
  initDashboard(user)
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
  const tabsContainer = document.querySelector('.dentist-tabs')
  const tabContent = document.querySelector('.tab-content') // Get the main content container
  const tabPanes = tabContent?.querySelectorAll('.tab-pane') // Select panes *inside* the container

  if (!tabsContainer || !tabContent || !tabPanes) return // Exit if elements not found

  // Use event delegation on the container
  tabsContainer.addEventListener('click', function (e) {
    // Check if a tab button was clicked
    const clickedTab = e.target.closest('.tab-btn')
    if (!clickedTab) return // Exit if click wasn't on a button

    const tabId = clickedTab.dataset.tab

    // Remove active class from all buttons and panes
    tabsContainer
      .querySelectorAll('.tab-btn')
      .forEach((btn) => btn.classList.remove('active'))
    // Ensure *all* panes within the container are deactivated
    tabContent
      .querySelectorAll('.tab-pane')
      .forEach((pane) => pane.classList.remove('active'))

    // Add active class to the clicked button and corresponding pane
    clickedTab.classList.add('active')
    const activePane = tabContent.querySelector(`#${tabId}-tab`) // Find pane within the container
    if (activePane) {
      activePane.classList.add('active')
    }

    // Special handling if the transferable tab is clicked (e.g., load data)
    if (tabId === 'transferable') {
      loadTransferableAppointments()
    }
  })
}

// Load dentist's name in the header
function loadDentistName(name) {
  document.getElementById('dentist-name').textContent = name.split(' ')[0]
}

// Load dentist profile data
function loadDentistProfile(userId) {
  fetch(`http://localhost:3000/api/users/dentists/${userId}`)
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

// Load dentist's availability (removed implementation, just loads unavailable days)
function loadAvailability(userId) {
  // Only load unavailable days now
  loadPermanentUnavailableDays(userId)
  loadTemporaryUnavailableDays(userId)
}

// Load permanently unavailable days
function loadPermanentUnavailableDays(userId) {
  const permanentUnavailabilityList = document.getElementById(
    'permanent-unavailability-list'
  )

  fetch(`http://localhost:3000/api/dentist/unavailability/${userId}/permanent`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch permanent unavailability')
      }
      return response.json()
    })
    .then((data) => {
      permanentUnavailabilityList.innerHTML = ''

      if (!data.success) {
        throw new Error(
          data.message || 'Failed to load permanent unavailability'
        )
      }

      const unavailableDays = data.permanentUnavailability

      if (unavailableDays.length === 0) {
        permanentUnavailabilityList.innerHTML =
          '<div class="no-data-message">No permanently unavailable days set.</div>'
        return
      }

      // Create an array for day names
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]

      unavailableDays.forEach((day) => {
        const dayItem = document.createElement('div')
        dayItem.className = 'unavailability-item'
        dayItem.dataset.dayId = day.id
        dayItem.innerHTML = `
          <div class="permanent-day">${dayNames[day.dayOfWeek]}</div>
          <div class="actions">
            <button class="delete-permanent-unavailability" title="Delete unavailable day">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `
        permanentUnavailabilityList.appendChild(dayItem)
      })
    })
    .catch((error) => {
      console.error('Error loading permanent unavailability:', error)
      permanentUnavailabilityList.innerHTML = `
        <div style="text-align: center; color: #721c24; padding: 1rem;">
          Error loading permanent unavailability: ${error.message}
        </div>
      `
    })
}

// Load temporarily unavailable days
function loadTemporaryUnavailableDays(userId) {
  const temporaryUnavailabilityList = document.getElementById(
    'temporary-unavailability-list'
  )
  const noUnavailabilityMsg = document.getElementById('no-unavailability')

  fetch(`http://localhost:3000/api/dentist/unavailability/${userId}/temporary`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch temporary unavailability')
      }
      return response.json()
    })
    .then((data) => {
      temporaryUnavailabilityList.innerHTML = ''

      if (!data.success) {
        throw new Error(
          data.message || 'Failed to load temporary unavailability'
        )
      }

      const tempUnavailableDates = data.temporaryUnavailability

      if (tempUnavailableDates.length === 0) {
        temporaryUnavailabilityList.style.display = 'none'
        noUnavailabilityMsg.style.display = 'block'
        return
      }

      temporaryUnavailabilityList.style.display = 'block'
      noUnavailabilityMsg.style.display = 'none'

      // Sort by start date
      tempUnavailableDates.sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      )

      tempUnavailableDates.forEach((item) => {
        // Format dates
        const startDateObj = new Date(item.startDate)
        const formattedStartDate = startDateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })

        let dateRangeText = formattedStartDate

        if (item.endDate) {
          const endDateObj = new Date(item.endDate)
          const formattedEndDate = endDateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
          dateRangeText += ` to ${formattedEndDate}`
        }

        const tempItem = document.createElement('div')
        tempItem.className = 'unavailability-item'
        tempItem.dataset.unavailabilityId = item.id
        tempItem.innerHTML = `
          <div>
            <div class="date-range">${dateRangeText}</div>
            ${item.reason ? `<div class="reason">${item.reason}</div>` : ''}
          </div>
          <div class="actions">
            <button class="delete-temporary-unavailability" title="Delete unavailable period">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `
        temporaryUnavailabilityList.appendChild(tempItem)
      })
    })
    .catch((error) => {
      console.error('Error loading temporary unavailability:', error)
      temporaryUnavailabilityList.innerHTML = `
        <div style="text-align: center; color: #721c24; padding: 1rem;">
          Error loading temporary unavailability: ${error.message}
        </div>
      `
    })
}

// Save permanent unavailable days
function savePermanentUnavailability(userId, daysOfWeek) {
  return fetch(
    `http://localhost:3000/api/dentist/unavailability/${userId}/permanent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        daysOfWeek,
      }),
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(
              data.message || 'Failed to save permanent unavailability'
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
        throw new Error(
          data.message || 'Failed to save permanent unavailability'
        )
      }
      return data
    })
}

// Save temporary unavailable days
function saveTemporaryUnavailability(userId, startDate, endDate, reason) {
  return fetch(
    `http://localhost:3000/api/dentist/unavailability/${userId}/temporary`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        reason,
      }),
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(
              data.message || 'Failed to save temporary unavailability'
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
        throw new Error(
          data.message || 'Failed to save temporary unavailability'
        )
      }
      return data
    })
}

// Delete permanent unavailability
function deletePermanentUnavailability(userId, dayId) {
  return fetch(
    `http://localhost:3000/api/dentist/unavailability/${userId}/permanent/${dayId}`,
    {
      method: 'DELETE',
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(
              data.message || 'Failed to delete permanent unavailability'
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
        throw new Error(
          data.message || 'Failed to delete permanent unavailability'
        )
      }
      return data
    })
}

// Delete temporary unavailability
function deleteTemporaryUnavailability(userId, unavailabilityId) {
  return fetch(
    `http://localhost:3000/api/dentist/unavailability/${userId}/temporary/${unavailabilityId}`,
    {
      method: 'DELETE',
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(
              data.message || 'Failed to delete temporary unavailability'
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
        throw new Error(
          data.message || 'Failed to delete temporary unavailability'
        )
      }
      return data
    })
}

// Show status message for permanent unavailability
function showPermanentUnavailabilityStatus(message, type) {
  const statusEl = document.getElementById('permanent-unavailability-status')
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

// Show status message for temporary unavailability
function showTemporaryUnavailabilityStatus(message, type) {
  const statusEl = document.getElementById('temporary-unavailability-status')
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
          <div class="detail-value" id="modal-appointment-notes">${apt.notes}</div> 
        </div>
        `
            : `
        <div class="detail-item" id="modal-notes-container" style="display: none;"> 
          <div class="detail-label">Notes:</div>
          <div class="detail-value" id="modal-appointment-notes"></div>
        </div>
        `
        }
      `

      // Show/hide buttons based on status
      const confirmBtn = document.getElementById('confirm-appointment')
      const completeBtn = document.getElementById('complete-appointment')
      const cancelBtn = document.getElementById('cancel-appointment')
      const transferBtn = document.getElementById('transfer-appointment') // Get the transfer button

      // Get current user's name
      const currentUser = JSON.parse(localStorage.getItem('user'))
      const isCurrentDentistAppointment = apt.dentist === currentUser.name
      const isTransferableStatus =
        apt.status !== 'cancelled' && apt.status !== 'completed'

      confirmBtn.style.display =
        isCurrentDentistAppointment && apt.status === 'pending'
          ? 'inline-block'
          : 'none'
      completeBtn.style.display =
        isCurrentDentistAppointment && apt.status === 'confirmed'
          ? 'inline-block'
          : 'none'
      cancelBtn.style.display =
        isCurrentDentistAppointment && isTransferableStatus
          ? 'inline-block'
          : 'none'

      // Show transfer button only if it's the current dentist's appointment and status is appropriate
      if (transferBtn) {
        transferBtn.style.display =
          isCurrentDentistAppointment && isTransferableStatus
            ? 'inline-block'
            : 'none'
      }

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

// Make appointment available for transfer to other dentists
function makeAppointmentTransferable(appointmentId) {
  // Show confirmation dialog
  showConfirmDialog(
    'Make this appointment available for transfer to another dentist?<br><br>' +
      '<div class="info-message"><i class="fas fa-info-circle"></i> ' +
      'The appointment will be visible to other dentists who can accept it.</div>',
    () => {
      // Call API to mark appointment as transferable
      fetch(
        `http://localhost:3000/api/appointments/${appointmentId}/transfer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transferable: true }),
        }
      )
        .then((response) => {
          if (!response.ok) {
            return response
              .json()
              .then((data) => {
                throw new Error(
                  data.message || 'Failed to mark appointment as transferable'
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
            throw new Error(
              data.message || 'Failed to mark appointment as transferable'
            )
          }

          // Show success message
          showToast(
            'Appointment is now available for transfer',
            TOAST_LEVELS.SUCCESS
          )
          closeModal()

          // Reload appointments to show updated status
          const userId = JSON.parse(localStorage.getItem('user')).id
          loadAppointments(userId)

          // Load transferable appointments too if the tab exists
          if (document.querySelector('[data-tab="transferable"]')) {
            loadTransferableAppointments()
          }
        })
        .catch((error) => {
          console.error('Error marking appointment as transferable:', error)
          showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
        })
    }
  )
}

// Accept a transferable appointment (assign to current dentist)
function acceptTransferableAppointment(appointmentId) {
  const currentUser = JSON.parse(localStorage.getItem('user'))

  // Show confirmation dialog
  showConfirmDialog(
    'Accept this appointment and add it to your schedule?<br><br>' +
      '<div class="info-message"><i class="fas fa-info-circle"></i> ' +
      'Once accepted, this appointment will be removed from the transferable list.</div>',
    () => {
      // Call API to accept transfer
      fetch(
        `http://localhost:3000/api/appointments/${appointmentId}/accept-transfer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dentistName: currentUser.name,
            dentistId: currentUser.id,
          }),
        }
      )
        .then((response) => {
          if (!response.ok) {
            return response
              .json()
              .then((data) => {
                throw new Error(
                  data.message || 'Failed to accept appointment transfer'
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
            throw new Error(
              data.message || 'Failed to accept appointment transfer'
            )
          }

          // Show success message
          showToast(
            'Appointment successfully transferred to you',
            TOAST_LEVELS.SUCCESS
          )

          // Reload appointments
          loadAppointments(currentUser.id)

          // Reload transferable appointments
          loadTransferableAppointments()
        })
        .catch((error) => {
          console.error('Error accepting appointment transfer:', error)
          showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
        })
    }
  )
}

// Load transferable appointments that other dentists have made available
function loadTransferableAppointments() {
  const tableBody = document.getElementById('transferable-appointments-data')
  const noAppointmentsMsg = document.getElementById(
    'no-transferable-appointments'
  )

  if (!tableBody) return

  // Show loading message
  tableBody.innerHTML =
    '<tr><td colspan="6" style="text-align: center;">Loading transferable appointments...</td></tr>'

  fetch('http://localhost:3000/api/appointments/transferable')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch transferable appointments')
      }
      return response.json()
    })
    .then((data) => {
      // Clear loading message
      tableBody.innerHTML = ''

      if (!data.success) {
        throw new Error(
          data.message || 'Failed to load transferable appointments'
        )
      }

      const appointments = data.appointments
      const currentUser = JSON.parse(localStorage.getItem('user'))

      if (appointments.length === 0) {
        tableBody.style.display = 'none'
        noAppointmentsMsg.style.display = 'block'
      } else {
        tableBody.style.display = 'table-row-group'
        noAppointmentsMsg.style.display = 'none'

        // Filter out appointments that belong to the current dentist
        const filteredAppointments = appointments.filter(
          (apt) => apt.original_dentist !== currentUser.name
        )

        if (filteredAppointments.length === 0) {
          tableBody.style.display = 'none'
          noAppointmentsMsg.style.display = 'block'
          return
        }

        // Add appointments to table
        filteredAppointments.forEach((apt) => {
          // Format date and time
          let formattedDate = 'N/A'
          let formattedTime = 'N/A'

          try {
            if (apt.date) {
              const dateObj = new Date(apt.date)
              if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              }
            }

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
            console.error('Error formatting date/time:', err)
          }

          const row = document.createElement('tr')
          row.dataset.appointmentId = apt.id
          row.dataset.date = apt.date || ''
          row.dataset.status = apt.transfer_status || 'available'

          row.innerHTML = `
            <td>${formattedDate}<br>${formattedTime}</td>
            <td>${apt.userName || 'Unknown'}</td>
            <td>${apt.service}</td>
            <td>${apt.original_dentist || 'N/A'}</td>
            <td>
              <span class="appointment-status status-${
                apt.transfer_status || 'available'
              }">
                ${
                  (apt.transfer_status || 'available').charAt(0).toUpperCase() +
                  (apt.transfer_status || 'available').slice(1)
                }
              </span>
            </td>
            <td class="actions-cell">
              <button class="action-btn btn-view" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              ${
                apt.transfer_status === 'available'
                  ? `
                <button class="action-btn btn-accept-transfer" title="Accept Transfer">
                  <i class="fas fa-hand-holding-medical"></i>
                </button>
              `
                  : ''
              }
            </td>
          `

          tableBody.appendChild(row)
        })

        // Add event listeners to the transferable appointment buttons
        tableBody.querySelectorAll('.btn-view').forEach((btn) => {
          btn.addEventListener('click', function () {
            const row = this.closest('tr')
            const appointmentId = row.dataset.appointmentId
            openAppointmentModal(appointmentId, currentUser.id)
          })
        })

        tableBody.querySelectorAll('.btn-accept-transfer').forEach((btn) => {
          btn.addEventListener('click', function () {
            const row = this.closest('tr')
            const appointmentId = row.dataset.appointmentId
            acceptTransferableAppointment(appointmentId)
          })
        })
      }
    })
    .catch((error) => {
      console.error('Error loading transferable appointments:', error)
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #721c24;">
        Error loading appointments: ${error.message}</td></tr>`
    })
}

// Filter transferable appointments based on status and date
function filterTransferableAppointments() {
  const statusFilter = document.getElementById(
    'transferable-status-filter'
  ).value
  const dateFilter = document.getElementById('transferable-date-filter').value

  const rows = document.querySelectorAll(
    '#transferable-appointments-table tbody tr'
  )
  let visibleCount = 0

  rows.forEach((row) => {
    let showRow = true

    // Filter by status
    if (statusFilter !== 'all') {
      const rowStatus = row.dataset.status
      if (rowStatus !== statusFilter) {
        showRow = false
      }
    }

    // Filter by date
    if (dateFilter && showRow) {
      try {
        const rowDate = new Date(row.dataset.date)
        const filterDate = new Date(dateFilter)

        if (
          rowDate.getFullYear() !== filterDate.getFullYear() ||
          rowDate.getMonth() !== filterDate.getMonth() ||
          rowDate.getDate() !== filterDate.getDate()
        ) {
          showRow = false
        }
      } catch (err) {
        console.error('Error comparing dates:', err)
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
  const noAppointmentsMsg = document.getElementById(
    'no-transferable-appointments'
  )
  if (visibleCount === 0) {
    noAppointmentsMsg.style.display = 'block'
  } else {
    noAppointmentsMsg.style.display = 'none'
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

      showToast('Patient notes saved successfully', TOAST_LEVELS.SUCCESS)

      // Update the notes display in the modal immediately
      const notesDisplay = document.getElementById('modal-appointment-notes')
      const notesContainer = document.getElementById('modal-notes-container')
      if (notesDisplay) {
        notesDisplay.textContent = notes
        // Ensure the container is visible if notes were just added
        if (notesContainer && notes) {
          notesContainer.style.display = 'flex' // Or 'block' depending on your CSS
        }
      }
    })
    .catch((error) => {
      console.error('Error saving patient notes:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Update dentist profile
function updateDentistProfile(userId, specialization, bio) {
  return fetch(`http://localhost:3000/api/users/dentists/${userId}`, {
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
        console.error('Profile update failed with status:', response.status)
        return response
          .json()
          .catch(() => {
            // If we can't parse JSON from the error response
            throw new Error(`Server error: ${response.status}`)
          })
          .then((data) => {
            throw new Error(data.message || 'Failed to update profile')
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
    const currentAppointmentId = modal.dataset.appointmentId // Get appointmentId from modal dataset

    if (!notes) {
      showToast('Please enter some notes before saving', TOAST_LEVELS.WARNING)
      return
    }

    // Ensure patientId and appointmentId are available
    const currentPatientId = modal.dataset.patientId
    if (!currentPatientId || !currentAppointmentId) {
      showToast('Error: Missing patient or appointment ID.', TOAST_LEVELS.ERROR)
      console.error('Missing patientId or appointmentId in modal dataset')
      return
    }

    savePatientNotes(
      userId,
      currentPatientId,
      currentAppointmentId, // Use the correct appointment ID
      notes
    )
  })

  // Permanent unavailability form submission
  document
    .getElementById('permanent-unavailability-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()

      const checkboxes = document.querySelectorAll(
        'input[name="permanent-unavailable"]:checked'
      )

      if (checkboxes.length === 0) {
        showPermanentUnavailabilityStatus(
          'Please select at least one day of the week',
          'error'
        )
        return
      }

      const daysOfWeek = Array.from(checkboxes).map((cb) => parseInt(cb.value))

      showPermanentUnavailabilityStatus(
        'Saving permanent unavailability...',
        'info'
      )

      savePermanentUnavailability(userId, daysOfWeek)
        .then(() => {
          showPermanentUnavailabilityStatus(
            'Permanent unavailability saved successfully!',
            'success'
          )

          // Uncheck all checkboxes
          document
            .querySelectorAll('input[name="permanent-unavailable"]')
            .forEach((cb) => {
              cb.checked = false
            })

          // Reload permanent unavailable days
          loadPermanentUnavailableDays(userId)
        })
        .catch((error) => {
          showPermanentUnavailabilityStatus('Error: ' + error.message, 'error')
        })
    })

  // Temporary unavailability form submission
  document
    .getElementById('temporary-unavailability-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()

      const startDate = document.getElementById('unavailable-date-start').value
      const endDate = document.getElementById('unavailable-date-end').value
      const reason = document
        .getElementById('unavailability-reason')
        .value.trim()

      if (!startDate) {
        showTemporaryUnavailabilityStatus('Please select a start date', 'error')
        return
      }

      // If end date is provided, ensure it's not before start date
      if (endDate && endDate < startDate) {
        showTemporaryUnavailabilityStatus(
          'End date cannot be before start date',
          'error'
        )
        return
      }

      showTemporaryUnavailabilityStatus(
        'Saving temporary unavailability...',
        'info'
      )

      saveTemporaryUnavailability(userId, startDate, endDate || null, reason)
        .then(() => {
          showTemporaryUnavailabilityStatus(
            'Temporary unavailability saved successfully!',
            'success'
          )

          // Clear form
          document.getElementById('unavailable-date-start').value = ''
          document.getElementById('unavailable-date-end').value = ''
          document.getElementById('unavailability-reason').value = ''

          // Reload temporary unavailable days
          loadTemporaryUnavailableDays(userId)
        })
        .catch((error) => {
          showTemporaryUnavailabilityStatus('Error: ' + error.message, 'error')
        })
    })

  // Delete permanent unavailability (delegation)
  document
    .getElementById('permanent-unavailability-list')
    .addEventListener('click', function (e) {
      const target = e.target.closest('button')
      if (
        !target ||
        !target.classList.contains('delete-permanent-unavailability')
      )
        return

      const item = target.closest('.unavailability-item')
      const dayId = item.dataset.dayId

      if (confirm('Delete this permanently unavailable day?')) {
        deletePermanentUnavailability(userId, dayId)
          .then(() => {
            showPermanentUnavailabilityStatus(
              'Permanent unavailability deleted successfully!',
              'success'
            )
            loadPermanentUnavailableDays(userId)
          })
          .catch((error) => {
            showPermanentUnavailabilityStatus(
              'Error: ' + error.message,
              'error'
            )
          })
      }
    })

  // Delete temporary unavailability (delegation)
  document
    .getElementById('temporary-unavailability-list')
    .addEventListener('click', function (e) {
      const target = e.target.closest('button')
      if (
        !target ||
        !target.classList.contains('delete-temporary-unavailability')
      )
        return

      const item = target.closest('.unavailability-item')
      const unavailabilityId = item.dataset.unavailabilityId

      if (confirm('Delete this temporary unavailability period?')) {
        deleteTemporaryUnavailability(userId, unavailabilityId)
          .then(() => {
            showTemporaryUnavailabilityStatus(
              'Temporary unavailability deleted successfully!',
              'success'
            )
            loadTemporaryUnavailableDays(userId)
          })
          .catch((error) => {
            showTemporaryUnavailabilityStatus(
              'Error: ' + error.message,
              'error'
            )
          })
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
          console.log('Profile update successful:', data)
          showProfileStatus('Profile updated successfully!', 'success')
        })
        .catch((error) => {
          console.error('Profile update error:', error)
          showProfileStatus('Error updating profile: ' + error.message, 'error')
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

  // Add the transfer button to the modal actions
  const modalActions = document.querySelector('.modal-actions')
  if (modalActions) {
    // Create transfer button if it doesn't exist
    if (!document.getElementById('transfer-appointment')) {
      const transferBtn = document.createElement('button')
      transferBtn.id = 'transfer-appointment'
      transferBtn.className = 'btn btn-warning'
      transferBtn.innerHTML =
        '<i class="fas fa-exchange-alt"></i> Make Available for Transfer'

      // Insert before the close button
      const closeBtn = document.getElementById('close-modal')
      if (closeBtn) {
        modalActions.insertBefore(transferBtn, closeBtn)
      } else {
        modalActions.appendChild(transferBtn)
      }
    }

    // Add event listener to transfer button
    document
      .getElementById('transfer-appointment')
      .addEventListener('click', function () {
        const appointmentId =
          document.getElementById('appointment-modal').dataset.appointmentId
        makeAppointmentTransferable(appointmentId)
      })
  }

  // Add tab for transferable appointments if it doesn't exist
  const tabsContainer = document.querySelector('.dentist-tabs')
  // Ensure the tab content container exists before proceeding
  const tabContent = document.querySelector('.tab-content')

  if (
    tabsContainer &&
    tabContent &&
    !document.querySelector('[data-tab="transferable"]')
  ) {
    const transferableTab = document.createElement('button')
    transferableTab.className = 'tab-btn'
    transferableTab.setAttribute('data-tab', 'transferable')
    transferableTab.innerHTML =
      '<i class="fas fa-exchange-alt"></i> Transferable'
    tabsContainer.appendChild(transferableTab)

    // Also add the tab content pane *inside* the tabContent container
    const transferablePane = document.createElement('div')
    transferablePane.className = 'tab-pane' // Start inactive
    transferablePane.id = 'transferable-tab'

    transferablePane.innerHTML = `
        <div class="tab-header">
          <h2>Transferable Appointments</h2>
          <div class="filters">
            <select id="transferable-status-filter">
              <option value="all">All Status</option>
              <option value="available">Available</option>
            </select>
            <input type="date" id="transferable-date-filter" placeholder="Filter by date" />
            <button id="clear-transferable-filters" class="btn btn-sm">Clear</button>
          </div>
        </div>
        <div class="appointments-list">
          <table id="transferable-appointments-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient</th>
                <th>Service</th>
                <th>Original Dentist</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="transferable-appointments-data">
              <!-- Transferable appointments will be loaded dynamically -->
            </tbody>
          </table>
          <div id="no-transferable-appointments" class="no-data-message">
            No transferable appointments found.
          </div>
        </div>
      `

    // Append the new pane to the main tab content area
    tabContent.appendChild(transferablePane)

    // Add event listeners for filters (ensure elements exist before adding listeners)
    document
      .getElementById('transferable-status-filter')
      ?.addEventListener('change', filterTransferableAppointments)
    document
      .getElementById('transferable-date-filter')
      ?.addEventListener('input', filterTransferableAppointments)
    document
      .getElementById('clear-transferable-filters')
      ?.addEventListener('click', function () {
        document.getElementById('transferable-status-filter').value = 'all'
        document.getElementById('transferable-date-filter').value = ''
        filterTransferableAppointments()
      })
  }
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

// Initialize dentist dashboard components
function initDashboard(user) {
  initNavbarToggle()
  initTabs()
  loadDentistName(user.name)
  loadDentistProfile(user.id)
  loadAppointments(user.id)
  // No longer loading availability as we're only handling unavailable days
  loadPermanentUnavailableDays(user.id)
  loadTemporaryUnavailableDays(user.id)
  setupEventListeners(user.id)
}
