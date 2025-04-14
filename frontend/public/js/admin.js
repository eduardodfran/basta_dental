document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in and is admin
  const user = checkAdminAuth()
  if (!user) {
    console.error('Not authenticated as admin. Stopping script execution.')
    return
  }

  // Initialize admin dashboard components
  initNavbarToggle()
  initTabs()
  loadAppointments()
  loadUsers()
  loadAnalytics()
  loadClinicAvailability() // Load clinic availability settings
  setupEventListeners()

  // Add transferable appointments tab functionality
  const transferableTab = document.querySelector(
    '.tab-btn[data-tab="transferable-appointments"]'
  )
  if (transferableTab) {
    transferableTab.addEventListener('click', () => {
      loadTransferableAppointments()
    })
  }

  // Add event listener to filter button for transferable appointments
  const transferFilterBtn = document.getElementById('clear-transfer-filters')
  if (transferFilterBtn) {
    transferFilterBtn.addEventListener('click', () => {
      // Reset transfer filters
      if (document.getElementById('transfer-status-filter'))
        document.getElementById('transfer-status-filter').value = 'all'
      if (document.getElementById('transfer-date-filter'))
        document.getElementById('transfer-date-filter').value = ''
      filterTransferableAppointments()
    })
  }

  // Add event listeners to filter inputs for transferable appointments
  const transferStatusFilter = document.getElementById('transfer-status-filter')
  const transferDateFilter = document.getElementById('transfer-date-filter')

  if (transferStatusFilter) {
    transferStatusFilter.addEventListener(
      'change',
      filterTransferableAppointments
    )
  }

  if (transferDateFilter) {
    transferDateFilter.addEventListener(
      'input', // Using 'input' for better responsiveness
      filterTransferableAppointments
    )
  }
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

      // Load data if needed (e.g., for clinic availability)
      if (button.getAttribute('data-tab') === 'clinic-availability') {
        loadClinicAvailability()
      }
      // Load transferable appointments when that tab is clicked
      if (button.getAttribute('data-tab') === 'transferable-appointments') {
        loadTransferableAppointments()
      }
    })
  })
}

// Load all users
function loadUsers() {
  const tableBody = document.getElementById('users-data')
  const noUsersMsg = document.getElementById('no-users')

  if (!tableBody || !noUsersMsg) {
    console.error('User table elements not found')
    return
  }

  // Show loading indicator
  tableBody.innerHTML =
    '<tr><td colspan="7" style="text-align: center;">Loading users...</td></tr>'
  noUsersMsg.style.display = 'none'

  fetch('http://localhost:3000/api/users')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      tableBody.innerHTML = '' // Clear loading/previous data

      if (!data.success) {
        throw new Error(data.message || 'Failed to load users')
      }

      const users = data.users

      if (users.length === 0) {
        tableBody.style.display = 'none'
        noUsersMsg.style.display = 'block'
      } else {
        tableBody.style.display = 'table-row-group'
        noUsersMsg.style.display = 'none'

        users.forEach((user) => {
          const row = document.createElement('tr')
          row.dataset.userId = user.id
          row.dataset.userName = user.name
          row.dataset.userEmail = user.email
          row.dataset.userRole = user.role

          // Format joined date
          let joinedDate = 'N/A'
          try {
            if (user.created_at) {
              joinedDate = new Date(user.created_at).toLocaleDateString(
                'en-US',
                {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }
              )
            }
          } catch (e) {
            console.error('Error formatting date:', e)
          }

          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="role-tag role-${user.role}">${
            user.role.charAt(0).toUpperCase() + user.role.slice(1)
          }</span></td>
            <td>${joinedDate}</td>
            <td class="actions-cell">
              <button class="action-btn btn-view-user" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn btn-change-role" title="Change Role">
                <i class="fas fa-user-edit"></i>
              </button>
            </td>
          `
          tableBody.appendChild(row)
        })
        // Apply filters after loading
        filterUsers()
      }
    })
    .catch((error) => {
      console.error('Error loading users:', error)
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #721c24;">
        Error loading users: ${error.message}</td></tr>`
      tableBody.style.display = 'table-row-group'
      noUsersMsg.style.display = 'none'
    })
}

// Filter users based on search and role
function filterUsers() {
  const searchTerm = document.getElementById('search-users').value.toLowerCase()
  const roleFilter = document.getElementById('role-filter').value
  const tableBody = document.getElementById('users-data')
  const rows = tableBody.querySelectorAll('tr')
  const noUsersMsg = document.getElementById('no-users')
  let visibleCount = 0

  rows.forEach((row) => {
    const name = (row.dataset.userName || '').toLowerCase()
    const email = (row.dataset.userEmail || '').toLowerCase()
    const role = row.dataset.userRole || ''

    const matchesSearch =
      name.includes(searchTerm) || email.includes(searchTerm)
    const matchesRole = roleFilter === 'all' || role === roleFilter

    if (matchesSearch && matchesRole) {
      row.style.display = ''
      visibleCount++
    } else {
      row.style.display = 'none'
    }
  })

  noUsersMsg.style.display = visibleCount === 0 ? 'block' : 'none'
}

// Open user details modal
function openUserDetailsModal(userId) {
  const modal = document.getElementById('user-modal')
  const detailsContainer = document.getElementById('user-details')
  const appointmentsList = document.getElementById('user-appointments-list')
  const changeRoleBtn = document.getElementById('edit-user-role')

  if (!modal || !detailsContainer || !appointmentsList || !changeRoleBtn) {
    console.error('User details modal elements not found')
    showToast('Could not open user details.', TOAST_LEVELS.ERROR)
    return
  }

  detailsContainer.innerHTML = '<p>Loading user details...</p>'
  appointmentsList.innerHTML = '<p>Loading appointments...</p>'
  modal.style.display = 'block'
  modal.dataset.userId = userId // Store userId for the change role button

  // Fetch User Details
  fetch(`http://localhost:3000/api/users/profile/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const user = data.user
        modal.dataset.userRole = user.role // Store role for change role modal
        detailsContainer.innerHTML = `
          <p><strong>ID:</strong> ${user.id}</p>
          <p><strong>Name:</strong> ${user.name}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
          <p><strong>Date of Birth:</strong> ${
            user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A'
          }</p>
          <p><strong>Gender:</strong> ${user.gender || 'N/A'}</p>
          <p><strong>Address:</strong> ${user.address || 'N/A'}</p>
          <p><strong>Role:</strong> <span class="role-tag role-${user.role}">${
          user.role.charAt(0).toUpperCase() + user.role.slice(1)
        }</span></p>
          <p><strong>Joined:</strong> ${new Date(
            user.created_at
          ).toLocaleDateString()}</p>
        `
      } else {
        throw new Error(data.message || 'Failed to load user details')
      }
    })
    .catch((error) => {
      detailsContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`
    })

  // Fetch User Appointments
  fetch(`http://localhost:3000/api/appointments/user/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const appointments = data.appointments
        if (appointments.length === 0) {
          appointmentsList.innerHTML =
            '<p>No appointments found for this user.</p>'
        } else {
          appointmentsList.innerHTML = `
            <ul>
              ${appointments
                .map(
                  (apt) => `
                <li>
                  ${new Date(apt.date).toLocaleDateString()} ${apt.time} - ${
                    apt.service
                  } (${apt.status})
                  ${apt.dentist ? `with ${apt.dentist}` : ''}
                </li>
              `
                )
                .join('')}
            </ul>
          `
        }
      } else {
        throw new Error(data.message || 'Failed to load appointments')
      }
    })
    .catch((error) => {
      appointmentsList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`
    })
}

// Open change role modal
function openChangeRoleModal(userId, currentRole) {
  const modal = document.getElementById('role-modal')
  const form = document.getElementById('change-role-form')
  const userIdInput = document.getElementById('user-id')
  const roleSelect = document.getElementById('user-role') // Corrected ID

  if (!modal || !form || !userIdInput || !roleSelect) {
    console.error('Change role modal elements not found')
    showToast('Could not open role change form.', TOAST_LEVELS.ERROR)
    return
  }

  userIdInput.value = userId
  roleSelect.value = currentRole
  modal.style.display = 'block'
}

// Update user role via API
function updateUserRole(event) {
  event.preventDefault()
  const form = event.target
  const userId = document.getElementById('user-id').value
  const newRole = document.getElementById('user-role').value // Corrected ID
  const modal = document.getElementById('role-modal')

  if (!userId || !newRole) {
    showToast('User ID or role missing.', TOAST_LEVELS.ERROR)
    return
  }

  fetch(`http://localhost:3000/api/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: newRole }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(
            err.message || `HTTP error! status: ${response.status}`
          )
        })
      }
      return response.json()
    })
    .then((data) => {
      if (data.success) {
        showToast('User role updated successfully!', TOAST_LEVELS.SUCCESS)
        modal.style.display = 'none'
        loadUsers() // Reload the users table
        // If the user details modal is open for this user, update its role display
        const userModal = document.getElementById('user-modal')
        if (
          userModal.style.display === 'block' &&
          userModal.dataset.userId === userId
        ) {
          const roleSpan = userModal.querySelector('.role-tag')
          if (roleSpan) {
            roleSpan.className = `role-tag role-${newRole}`
            roleSpan.textContent =
              newRole.charAt(0).toUpperCase() + newRole.slice(1)
          }
          userModal.dataset.userRole = newRole // Update stored role
        }
      } else {
        throw new Error(data.message || 'Failed to update role')
      }
    })
    .catch((error) => {
      console.error('Error updating user role:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Load clinic availability settings
function loadClinicAvailability() {
  loadPermanentClinicUnavailability()
  loadTemporaryClinicUnavailability()
}

// Load permanent clinic unavailability (days of week)
function loadPermanentClinicUnavailability() {
  const listElement = document.getElementById(
    'clinic-permanent-unavailability-list'
  )
  const formCheckboxes = document.querySelectorAll(
    'input[name="clinic-permanent-unavailable"]'
  )

  if (!listElement) return

  listElement.innerHTML = '<p>Loading permanent closures...</p>'
  // Reset checkboxes
  formCheckboxes.forEach((cb) => (cb.checked = false))

  fetch('http://localhost:3000/api/clinic/unavailability/permanent') // Corrected URL
    .then((response) => {
      // Check for non-JSON 404 response first
      if (!response.ok && response.status === 404) {
        throw new Error('Permanent unavailability endpoint not found (404)')
      }
      // Check for other non-ok responses that might be JSON
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(
            err.message || `HTTP error! status: ${response.status}`
          )
        })
      }
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return response.text().then((text) => {
          throw new TypeError(
            `Expected JSON but received ${contentType}. Response: ${text.substring(
              0,
              100
            )}...`
          )
        })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(
          data.message || 'Failed to load permanent unavailability'
        )
      }
      listElement.innerHTML = '' // Clear loading
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ]

      if (data.permanentUnavailability.length === 0) {
        listElement.innerHTML = '<p>No permanent closure days set.</p>'
      } else {
        data.permanentUnavailability.forEach((item) => {
          const dayName = days[item.dayOfWeek]
          const listItem = document.createElement('div')
          listItem.className = 'unavailability-item'
          listItem.innerHTML = `
            <div class="details">
              <div class="day-name">${dayName}</div>
            </div>
            <div class="actions">
              <button class="delete-clinic-permanent-unavailability" data-day-id="${item.id}" title="Remove permanent closure for ${dayName}">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          `
          listElement.appendChild(listItem)

          // Check the corresponding checkbox in the form
          formCheckboxes.forEach((cb) => {
            if (parseInt(cb.value) === item.dayOfWeek) {
              cb.checked = true
            }
          })
        })
      }
    })
    .catch((error) => {
      console.error('Error loading permanent clinic unavailability:', error)
      listElement.innerHTML = `<p style="color: #721c24;">Error: ${error.message}</p>`
    })
}

// Load temporary clinic unavailability (date ranges)
function loadTemporaryClinicUnavailability() {
  const listElement = document.getElementById(
    'clinic-temporary-unavailability-list'
  )
  const noDataMsg = document.getElementById(
    'clinic-no-temporary-unavailability'
  )

  if (!listElement || !noDataMsg) return

  listElement.innerHTML = '<p>Loading temporary closures...</p>'
  noDataMsg.style.display = 'none'

  fetch('http://localhost:3000/api/clinic/unavailability/temporary') // Corrected URL
    .then((response) => {
      // Check for non-JSON 404 response first
      if (!response.ok && response.status === 404) {
        throw new Error('Temporary unavailability endpoint not found (404)')
      }
      // Check for other non-ok responses that might be JSON
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(
            err.message || `HTTP error! status: ${response.status}`
          )
        })
      }
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return response.text().then((text) => {
          throw new TypeError(
            `Expected JSON but received ${contentType}. Response: ${text.substring(
              0,
              100
            )}...`
          )
        })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(
          data.message || 'Failed to load temporary unavailability'
        )
      }
      listElement.innerHTML = '' // Clear loading

      if (data.temporaryUnavailability.length === 0) {
        noDataMsg.style.display = 'block'
      } else {
        noDataMsg.style.display = 'none'
        data.temporaryUnavailability.forEach((item) => {
          let dateRangeText = new Date(item.start_date).toLocaleDateString()
          if (item.end_date && item.end_date !== item.start_date) {
            dateRangeText += ` - ${new Date(
              item.end_date
            ).toLocaleDateString()}`
          }

          const listItem = document.createElement('div')
          listItem.className = 'unavailability-item'
          listItem.innerHTML = `
            <div class="details">
              <div class="date-range">${dateRangeText}</div>
              ${item.reason ? `<div class="reason">${item.reason}</div>` : ''}
            </div>
            <div class="actions">
              <button class="delete-clinic-temporary-unavailability" data-unavailability-id="${
                item.id
              }" title="Delete temporary closure period">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          `
          listElement.appendChild(listItem)
        })
      }
    })
    .catch((error) => {
      console.error('Error loading temporary clinic unavailability:', error)
      listElement.innerHTML = `<p style="color: #721c24;">Error: ${error.message}</p>`
      noDataMsg.style.display = 'none'
    })
}

// Save permanent clinic unavailability
async function savePermanentClinicUnavailability(daysOfWeek) {
  showPermanentClinicUnavailabilityStatus('Saving...', 'info')
  try {
    const response = await fetch(
      'http://localhost:3000/api/clinic/unavailability/permanent', // Corrected URL
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysOfWeek }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to save permanent unavailability')
    }

    showPermanentClinicUnavailabilityStatus(
      'Permanent closures saved successfully!',
      'success'
    )
    loadPermanentClinicUnavailability() // Reload the list
  } catch (error) {
    showPermanentClinicUnavailabilityStatus(`Error: ${error.message}`, 'error')
    console.error('Error saving permanent clinic unavailability:', error)
  }
}

// Save temporary clinic unavailability
async function saveTemporaryClinicUnavailability(startDate, endDate, reason) {
  showTemporaryClinicUnavailabilityStatus('Saving...', 'info')
  try {
    const response = await fetch(
      'http://localhost:3000/api/clinic/unavailability/temporary', // Corrected URL
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate: endDate || null, reason }), // Send null if endDate is empty
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to save temporary unavailability')
    }

    showTemporaryClinicUnavailabilityStatus(
      'Temporary closure saved successfully!',
      'success'
    )
    // Clear form
    document.getElementById('clinic-unavailable-date-start').value = ''
    document.getElementById('clinic-unavailable-date-end').value = ''
    document.getElementById('clinic-unavailability-reason').value = ''
    loadTemporaryClinicUnavailability() // Reload the list
  } catch (error) {
    showTemporaryClinicUnavailabilityStatus(`Error: ${error.message}`, 'error')
    console.error('Error saving temporary clinic unavailability:', error)
  }
}

// Delete permanent clinic unavailability
async function deletePermanentClinicUnavailability(dayId) {
  showPermanentClinicUnavailabilityStatus('Deleting...', 'info')
  try {
    const response = await fetch(
      `http://localhost:3000/api/clinic/unavailability/permanent/${dayId}`, // Corrected URL
      {
        method: 'DELETE',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    if (!data.success) {
      throw new Error(
        data.message || 'Failed to delete permanent unavailability'
      )
    }

    showPermanentClinicUnavailabilityStatus(
      'Permanent closure removed successfully!',
      'success'
    )
    loadPermanentClinicUnavailability() // Reload the list
  } catch (error) {
    showPermanentClinicUnavailabilityStatus(`Error: ${error.message}`, 'error')
    console.error('Error deleting permanent clinic unavailability:', error)
  }
}

// Delete temporary clinic unavailability
async function deleteTemporaryClinicUnavailability(unavailabilityId) {
  showTemporaryClinicUnavailabilityStatus('Deleting...', 'info')
  try {
    const response = await fetch(
      `http://localhost:3000/api/clinic/unavailability/temporary/${unavailabilityId}`, // Corrected URL
      {
        method: 'DELETE',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`)
    }

    if (!data.success) {
      throw new Error(
        data.message || 'Failed to delete temporary unavailability'
      )
    }

    showTemporaryClinicUnavailabilityStatus(
      'Temporary closure removed successfully!',
      'success'
    )
    loadTemporaryClinicUnavailability() // Reload the list
  } catch (error) {
    showTemporaryClinicUnavailabilityStatus(`Error: ${error.message}`, 'error')
    console.error('Error deleting temporary clinic unavailability:', error)
  }
}

// Show status message for permanent clinic unavailability
function showPermanentClinicUnavailabilityStatus(message, type) {
  const statusEl = document.getElementById(
    'clinic-permanent-unavailability-status'
  )
  if (!statusEl) return
  statusEl.textContent = message
  statusEl.className = 'form-status' // Reset classes
  if (type === 'success') statusEl.classList.add('success')
  else if (type === 'error') statusEl.classList.add('error')
  else statusEl.classList.add('info')
  statusEl.style.display = 'block'

  // Auto-hide success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none'
    }, 3000)
  }
}

// Show status message for temporary clinic unavailability
function showTemporaryClinicUnavailabilityStatus(message, type) {
  const statusEl = document.getElementById(
    'clinic-temporary-unavailability-status'
  )
  if (!statusEl) return
  statusEl.textContent = message
  statusEl.className = 'form-status' // Reset classes
  if (type === 'success') statusEl.classList.add('success')
  else if (type === 'error') statusEl.classList.add('error')
  else statusEl.classList.add('info')
  statusEl.style.display = 'block'

  // Auto-hide success/info messages
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusEl.style.display = 'none'
    }, 3000)
  }
}

// Load analytics data
function loadAnalytics() {
  console.log('loadAnalytics function called - needs implementation')
  // Placeholder: Add logic to fetch and display analytics data
}

// Load all appointments
function loadAppointments() {
  const tableBody = document.getElementById('appointments-data')
  const noAppointmentsMsg = document.getElementById('no-appointments')

  // Show loading indicator
  tableBody.innerHTML =
    '<tr><td colspan="7" style="text-align: center;">Loading appointments...</td></tr>'

  // Fetch appointments from API
  fetch('http://localhost:3000/api/appointments')
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
          // Format date for display with proper handling
          let formattedDate = 'Invalid date'

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
          } catch (err) {
            console.error('Error formatting appointment date:', err)
            formattedDate = apt.date || 'Unknown date'
          }

          // Format time if available
          let formattedTime = 'N/A'
          if (apt.time) {
            try {
              const [hours, minutes] = apt.time.split(':')
              const timeObj = new Date()
              timeObj.setHours(hours, minutes, 0)
              formattedTime = timeObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            } catch (err) {
              console.error('Error formatting appointment time:', err)
              formattedTime = apt.time || 'N/A'
            }
          }

          const row = document.createElement('tr')
          row.dataset.appointmentId = apt.id
          row.innerHTML = `
            <td>${apt.id}</td>
            <td>${apt.userName || apt.user_id || 'Unknown'}</td>
            <td>${apt.service}</td>
            <td>${formattedDate}<br>${formattedTime}</td>
            <td>${apt.dentist}</td>
            <td><span class="appointment-status status-${apt.status}">${
            apt.status.charAt(0).toUpperCase() + apt.status.slice(1)
          }</span></td>
            <td class="actions-cell">
              <button class="action-btn btn-view" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              ${
                apt.status === 'pending'
                  ? `
                <button class="action-btn btn-confirm" title="Confirm Appointment">
                  <i class="fas fa-check"></i>
                </button>
              `
                  : ''
              }
              ${
                apt.status === 'confirmed'
                  ? `
                <button class="action-btn btn-complete" title="Mark as Completed">
                  <i class="fas fa-check-double"></i>
                </button>
              `
                  : ''
              }
              ${
                apt.status !== 'cancelled' && apt.status !== 'completed'
                  ? `
                <button class="action-btn btn-cancel" title="Cancel Appointment">
                  <i class="fas fa-times"></i>
                </button>
                <button class="action-btn btn-assign" title="Reassign Dentist">
                  <i class="fas fa-user-md"></i>
                </button>
                ${
                  apt.transfer_status === 'available'
                    ? `<span class="transfer-badge" title="Available for transfer"><i class="fas fa-exchange-alt"></i></span>`
                    : ''
                }
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
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #721c24;">
        Error loading appointments: ${error.message}</td></tr>`
    })
}

// Load transferable appointments
function loadTransferableAppointments() {
  const tableBody = document.getElementById('transferable-appointments-data')
  const noDataMsg = document.getElementById('no-transferable-appointments')

  if (!tableBody) return // Ensure the table body exists

  // Show loading message
  tableBody.innerHTML =
    '<tr><td colspan="6" style="text-align: center;">Loading transferable appointments...</td></tr>'
  if (noDataMsg) noDataMsg.style.display = 'none'

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

      if (!appointments || appointments.length === 0) {
        tableBody.style.display = 'none' // Hide table body if no data
        if (noDataMsg) noDataMsg.style.display = 'block'
      } else {
        tableBody.style.display = 'table-row-group' // Show table body
        if (noDataMsg) noDataMsg.style.display = 'none'

        appointments.forEach((apt) => {
          // Format date and time
          let formattedDate = 'N/A'
          let formattedTime = 'N/A'

          try {
            // Use consistent date formatting as in loadAppointments
            if (apt.date) {
              const dateStr = apt.date.includes('T')
                ? apt.date
                : `${apt.date}T00:00:00+08:00` // Assume PH time if only date
              const dateObj = new Date(dateStr)
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
            formattedDate = apt.date || 'Date Error' // Fallback on error
            formattedTime = apt.time || 'Time Error' // Fallback on error
          }

          const row = document.createElement('tr')
          row.dataset.appointmentId = apt.id
          row.dataset.date = apt.date || ''
          row.dataset.status = apt.transfer_status || 'available'

          // Correctly align data with table columns
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
                <button class="action-btn btn-assign-transfer" title="Assign to Dentist">
                  <i class="fas fa-user-md"></i>
                </button>
              `
                  : ''
              }
            </td>
          `
          tableBody.appendChild(row)
        })

        // Add event listeners after rows are added
        setupTransferableActionListeners(tableBody)
      }
    })
    .catch((error) => {
      console.error('Error loading transferable appointments:', error)
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #721c24;">
        Error loading appointments: ${error.message}</td></tr>`
      if (noDataMsg) noDataMsg.style.display = 'none'
    })
}

// Setup event listeners for transferable appointment actions
function setupTransferableActionListeners(tableBody) {
  tableBody.querySelectorAll('.btn-view').forEach((btn) => {
    btn.addEventListener('click', function () {
      const appointmentId = this.closest('tr').dataset.appointmentId
      openAppointmentModal(appointmentId) // Use admin's modal
    })
  })

  tableBody.querySelectorAll('.btn-assign-transfer').forEach((btn) => {
    btn.addEventListener('click', function () {
      const appointmentId = this.closest('tr').dataset.appointmentId
      openAssignDentistModal(appointmentId)
    })
  })
}

// Filter transferable appointments
function filterTransferableAppointments() {
  const statusFilter =
    document.getElementById('transfer-status-filter')?.value || 'all'
  const dateFilter =
    document.getElementById('transfer-date-filter')?.value || ''

  const rows = document.querySelectorAll('#transferable-appointments-data tr')
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
  const noDataMsg = document.getElementById('no-transferable-appointments')
  if (noDataMsg) {
    noDataMsg.style.display = visibleCount === 0 ? 'block' : 'none'
  }
}

// Open assign dentist modal for transferable appointments
function openAssignDentistModal(appointmentId) {
  // Display loading indicator
  showToast('Loading dentist information...', TOAST_LEVELS.INFO)

  // Get dentist list first
  fetch('http://localhost:3000/api/dentist/all')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch dentists: ${response.status}`)
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load dentists')
      }

      // Get appointment details
      return fetch(`http://localhost:3000/api/appointments/${appointmentId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to fetch appointment details')
          }
          return response.json()
        })
        .then((aptData) => {
          if (!aptData.success) {
            throw new Error(aptData.message || 'Failed to load appointment')
          }

          const appointment = aptData.appointment
          const dentists = data.dentists

          // Create modal HTML
          const modal = document.createElement('div')
          modal.className = 'modal'
          modal.id = 'assign-dentist-modal'
          modal.innerHTML = `
            <div class="modal-content">
              <div class="modal-header">
                <h2>Assign Appointment to Dentist</h2>
                <span class="close">&times;</span>
              </div>
              <div class="modal-body">
                <p>
                  <strong>Patient:</strong> ${
                    appointment.userName || 'Unknown'
                  }<br>
                  <strong>Service:</strong> ${appointment.service}<br>
                  <strong>Date:</strong> ${new Date(
                    appointment.date
                  ).toLocaleDateString()}<br>
                  <strong>Time:</strong> ${appointment.time}<br>
                  <strong>Original Dentist:</strong> ${
                    appointment.original_dentist || 'N/A'
                  }<br>
                </p>
                
                <div class="form-group">
                  <label for="dentist-select">Select Dentist:</label>
                  <select id="dentist-select" class="form-control">
                    <option value="">-- Select a dentist --</option>
                    ${dentists
                      .filter((d) => d.name !== appointment.original_dentist)
                      .map(
                        (d) =>
                          `<option value="${d.id}" data-name="${d.name}">${d.name}</option>`
                      )
                      .join('')}
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button id="cancel-assign" class="btn btn-secondary">Cancel</button>
                <button id="confirm-assign" class="btn btn-primary">Assign</button>
              </div>
            </div>
          `

          document.body.appendChild(modal)

          // Show modal
          modal.style.display = 'block'

          // Add event listeners
          modal.querySelector('.close').addEventListener('click', () => {
            document.body.removeChild(modal)
          })

          document
            .getElementById('cancel-assign')
            .addEventListener('click', () => {
              document.body.removeChild(modal)
            })

          document
            .getElementById('confirm-assign')
            .addEventListener('click', () => {
              const select = document.getElementById('dentist-select')
              const dentistId = select.value
              const dentistName =
                select.options[select.selectedIndex].dataset.name

              if (!dentistId) {
                showToast('Please select a dentist', TOAST_LEVELS.ERROR)
                return
              }

              // Call API to assign dentist
              assignTransferableAppointment(
                appointmentId,
                dentistName,
                dentistId,
                modal
              )
            })
        })
    })
    .catch((error) => {
      console.error('Error opening assign dentist modal:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Assign transferable appointment to a dentist
function assignTransferableAppointment(
  appointmentId,
  dentistName,
  dentistId,
  modal
) {
  // Use the correct endpoint for admin assignment: /assign
  fetch(`http://localhost:3000/api/appointments/${appointmentId}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dentistName, // Backend expects dentistName
      dentistId, // Backend expects dentistId
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            // Provide more specific error message if available
            throw new Error(
              data.message ||
                `Failed to assign appointment (Status: ${response.status})`
            )
          })
          .catch(() => {
            // Fallback error
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to assign appointment')
      }

      // Remove modal
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal)
      }

      // Show success message
      showToast('Appointment assigned successfully', TOAST_LEVELS.SUCCESS)

      // Reload tables
      loadTransferableAppointments() // Reload to remove from transferable list
      loadAppointments() // Reload to show updated assignment
    })
    .catch((error) => {
      console.error('Error assigning appointment:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Setup event listeners for various interactions
function setupEventListeners() {
  // Logout button
  document
    .getElementById('logout-btn')
    ?.addEventListener('click', function (e) {
      e.preventDefault()
      localStorage.removeItem('user')
      window.location.href = 'index.html'
    })

  // Appointment filters
  document
    .getElementById('status-filter')
    ?.addEventListener('change', filterAppointments)
  document
    .getElementById('date-filter')
    ?.addEventListener('input', filterAppointments)
  document
    .getElementById('clear-filters')
    ?.addEventListener('click', function () {
      document.getElementById('status-filter').value = 'all'
      document.getElementById('date-filter').value = ''
      filterAppointments()
    })

  // User Filters
  document
    .getElementById('search-users')
    ?.addEventListener('input', filterUsers)
  document
    .getElementById('role-filter')
    ?.addEventListener('change', filterUsers)
  document
    .getElementById('clear-user-filters')
    ?.addEventListener('click', function () {
      document.getElementById('search-users').value = ''
      document.getElementById('role-filter').value = 'all'
      filterUsers()
    })

  // Main Appointments table actions (Event Delegation)
  const appointmentsTableBody = document.getElementById('appointments-data')
  if (appointmentsTableBody) {
    appointmentsTableBody.addEventListener('click', function (e) {
      // Find the button that was clicked, or its parent if icon was clicked
      let target = null
      if (e.target.tagName === 'I') {
        // If user clicked the icon inside the button
        target = e.target.parentElement
      } else if (e.target.classList.contains('action-btn')) {
        // If user clicked the button directly
        target = e.target
      }

      if (!target) return

      const row = target.closest('tr')
      const appointmentId = row?.dataset.appointmentId

      if (!appointmentId) return

      if (target.classList.contains('btn-view')) {
        openAppointmentModal(appointmentId)
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
        openAssignDentistModal(appointmentId)
      }
    })
  }

  // Users table actions (Event Delegation)
  const usersTableBody = document.getElementById('users-data')
  if (usersTableBody) {
    usersTableBody.addEventListener('click', function (e) {
      let target = null
      if (e.target.tagName === 'I') {
        target = e.target.parentElement
      } else if (e.target.classList.contains('action-btn')) {
        target = e.target
      }

      if (!target) return

      const row = target.closest('tr')
      const userId = row?.dataset.userId
      const currentRole = row?.dataset.userRole

      if (!userId) return

      if (target.classList.contains('btn-view-user')) {
        openUserDetailsModal(userId)
      } else if (target.classList.contains('btn-change-role')) {
        openChangeRoleModal(userId, currentRole)
      }
    })
  }

  // Modal close buttons (General)
  document.addEventListener('click', function (e) {
    // Close any modal if the close button (span.close) is clicked
    if (e.target.matches('.modal .close')) {
      const modal = e.target.closest('.modal')
      if (modal) {
        modal.style.display = 'none'
      }
    }
    // Close specific modals via their dedicated close/cancel buttons
    if (e.target.matches('#close-modal')) {
      document.getElementById('appointment-modal').style.display = 'none'
    }
    if (e.target.matches('#close-user-modal')) {
      document.getElementById('user-modal').style.display = 'none'
    }
    if (e.target.matches('#cancel-role-change')) {
      document.getElementById('role-modal').style.display = 'none'
    }
    // Close modal if clicking outside the modal content
    if (e.target.matches('.modal')) {
      e.target.style.display = 'none'
    }
  })

  // Change Role Modal Form Submission
  const changeRoleForm = document.getElementById('change-role-form')
  if (changeRoleForm) {
    changeRoleForm.addEventListener('submit', updateUserRole)
  }

  // User Details Modal - Change Role Button
  const editUserRoleBtn = document.getElementById('edit-user-role')
  if (editUserRoleBtn) {
    editUserRoleBtn.addEventListener('click', function () {
      const userModal = document.getElementById('user-modal')
      const userId = userModal?.dataset.userId
      const userRole = userModal?.dataset.userRole
      if (userId && userRole) {
        openChangeRoleModal(userId, userRole)
      } else {
        showToast('Could not get user ID or role.', TOAST_LEVELS.ERROR)
      }
    })
  }

  // Clinic Availability Forms & Lists
  const permanentClinicForm = document.getElementById(
    'clinic-permanent-unavailability-form'
  )
  const temporaryClinicForm = document.getElementById(
    'clinic-temporary-unavailability-form'
  )
  const permanentClinicList = document.getElementById(
    'clinic-permanent-unavailability-list'
  )
  const temporaryClinicList = document.getElementById(
    'clinic-temporary-unavailability-list'
  )

  // Permanent Clinic Closure Form Submission
  if (permanentClinicForm) {
    permanentClinicForm.addEventListener('submit', function (e) {
      e.preventDefault()
      const selectedDays = Array.from(
        document.querySelectorAll(
          'input[name="clinic-permanent-unavailable"]:checked'
        )
      ).map((cb) => parseInt(cb.value))
      savePermanentClinicUnavailability(selectedDays)
    })
  }

  // Temporary Clinic Closure Form Submission
  if (temporaryClinicForm) {
    temporaryClinicForm.addEventListener('submit', function (e) {
      e.preventDefault()
      const startDate = document.getElementById(
        'clinic-unavailable-date-start'
      ).value
      const endDate = document.getElementById(
        'clinic-unavailable-date-end'
      ).value
      const reason = document.getElementById(
        'clinic-unavailability-reason'
      ).value

      if (!startDate) {
        showTemporaryClinicUnavailabilityStatus(
          'Please select a start date.',
          'error'
        )
        return
      }
      if (endDate && endDate < startDate) {
        showTemporaryClinicUnavailabilityStatus(
          'End date cannot be before start date.',
          'error'
        )
        return
      }
      saveTemporaryClinicUnavailability(startDate, endDate, reason)
    })
  }

  // Delete Permanent Clinic Closure (Event Delegation)
  if (permanentClinicList) {
    permanentClinicList.addEventListener('click', function (e) {
      const target = e.target.closest(
        'button.delete-clinic-permanent-unavailability'
      )
      if (target) {
        const dayId = target.dataset.dayId
        showConfirmDialog(
          'Are you sure you want to remove this permanent closure day?',
          () => deletePermanentClinicUnavailability(dayId)
        )
      }
    })
  }

  // Delete Temporary Clinic Closure (Event Delegation)
  if (temporaryClinicList) {
    temporaryClinicList.addEventListener('click', function (e) {
      const target = e.target.closest(
        'button.delete-clinic-temporary-unavailability'
      )
      if (target) {
        const unavailabilityId = target.dataset.unavailabilityId
        showConfirmDialog(
          'Are you sure you want to remove this temporary closure period?',
          () => deleteTemporaryClinicUnavailability(unavailabilityId)
        )
      }
    })
  }
}

// Filter appointments in the main table (Example, adapt as needed)
function filterAppointments() {
  const statusFilter = document.getElementById('status-filter').value
  const dateFilter = document.getElementById('date-filter').value
  const tableBody = document.getElementById('appointments-data')
  const rows = tableBody.querySelectorAll('tr')
  const noAppointmentsMsg = document.getElementById('no-appointments')
  let visibleCount = 0

  rows.forEach((row) => {
    const statusCell = row.querySelector('td:nth-child(6) span')
    const dateCell = row.querySelector('td:nth-child(4)')
    if (!statusCell || !dateCell) return // Skip header or loading rows

    const rowStatus = statusCell.className.replace(
      'appointment-status status-',
      ''
    )
    const rowDateStr = dateCell.innerText.split('\n')[0] // Get only the date part

    let showRow = true

    // Filter by status
    if (statusFilter !== 'all' && rowStatus !== statusFilter) {
      showRow = false
    }

    // Filter by date
    if (dateFilter && showRow) {
      try {
        // Convert row date string (e.g., "Mon, Jan 1, 2024") to comparable format
        const rowDate = new Date(rowDateStr)
        const filterDate = new Date(dateFilter + 'T00:00:00') // Ensure comparison is date-only

        if (
          rowDate.getFullYear() !== filterDate.getFullYear() ||
          rowDate.getMonth() !== filterDate.getMonth() ||
          rowDate.getDate() !== filterDate.getDate()
        ) {
          showRow = false
        }
      } catch (err) {
        console.error('Error comparing dates:', err)
        showRow = false // Hide if date parsing fails
      }
    }

    // Show/hide row
    row.style.display = showRow ? '' : 'none'
    if (showRow) {
      visibleCount++
    }
  })

  // Show/hide no data message
  if (noAppointmentsMsg) {
    noAppointmentsMsg.style.display = visibleCount === 0 ? 'block' : 'none'
  }
}

// Update appointment status (Adapt from dentist.js or create new)
function updateAppointmentStatus(appointmentId, newStatus) {
  fetch(`http://localhost:3000/api/appointments/${appointmentId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: newStatus }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(
            err.message || `HTTP error! status: ${response.status}`
          )
        })
      }
      return response.json()
    })
    .then((data) => {
      if (data.success) {
        showToast(
          `Appointment ${newStatus} successfully!`,
          TOAST_LEVELS.SUCCESS
        )
        loadAppointments() // Reload the appointments table
        closeModal() // Close modal if open
      } else {
        throw new Error(data.message || 'Failed to update status')
      }
    })
    .catch((error) => {
      console.error('Error updating appointment status:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Open appointment details modal (Adapt from dentist.js or create new)
function openAppointmentModal(appointmentId) {
  const modal = document.getElementById('appointment-modal')
  const detailsContainer = document.getElementById('appointment-details')
  const confirmBtn = document.getElementById('confirm-appointment')
  const completeBtn = document.getElementById('complete-appointment')
  const cancelBtn = document.getElementById('cancel-appointment')

  if (!modal || !detailsContainer) {
    console.error('Appointment modal elements not found')
    return
  }

  // Fetch appointment details
  fetch(`http://localhost:3000/api/appointments/${appointmentId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        const apt = data.appointment
        detailsContainer.innerHTML = `
          <div class="detail-item">
            <div class="detail-label">Patient:</div>
            <div class="detail-value">${apt.userName || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Service:</div>
            <div class="detail-value">${apt.service}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Date:</div>
            <div class="detail-value">${new Date(
              apt.date
            ).toLocaleDateString()}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Time:</div>
            <div class="detail-value">${apt.time}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Dentist:</div>
            <div class="detail-value">${apt.dentist || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Status:</div>
            <div class="detail-value"><span class="appointment-status status-${
              apt.status
            }">${apt.status}</span></div>
          </div>
          ${
            apt.notes
              ? `
          <div class="detail-item">
            <div class="detail-label">Notes:</div>
            <div class="detail-value">${apt.notes}</div>
          </div>`
              : ''
          }
          ${
            apt.transfer_status
              ? `
          <div class="detail-item">
            <div class="detail-label">Transfer Status:</div>
            <div class="detail-value">${apt.transfer_status} ${
                  apt.original_dentist
                    ? `(Original: ${apt.original_dentist})`
                    : ''
                }</div>
          </div>`
              : ''
          }
        `

        modal.dataset.appointmentId = appointmentId

        if (confirmBtn)
          confirmBtn.style.display =
            apt.status === 'pending' ? 'inline-block' : 'none'
        if (completeBtn)
          completeBtn.style.display =
            apt.status === 'confirmed' ? 'inline-block' : 'none'
        if (cancelBtn)
          cancelBtn.style.display =
            apt.status !== 'cancelled' && apt.status !== 'completed'
              ? 'inline-block'
              : 'none'

        confirmBtn?.removeEventListener('click', handleModalConfirm)
        confirmBtn?.addEventListener('click', handleModalConfirm)

        completeBtn?.removeEventListener('click', handleModalComplete)
        completeBtn?.addEventListener('click', handleModalComplete)

        cancelBtn?.removeEventListener('click', handleModalCancel)
        cancelBtn?.addEventListener('click', handleModalCancel)

        modal.style.display = 'block'
      } else {
        throw new Error(data.message || 'Failed to load appointment details')
      }
    })
    .catch((error) => {
      console.error('Error opening appointment modal:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

// Modal action handlers
function handleModalConfirm() {
  const appointmentId =
    document.getElementById('appointment-modal')?.dataset.appointmentId
  if (appointmentId) {
    showConfirmDialog('Confirm this appointment?', () =>
      updateAppointmentStatus(appointmentId, 'confirmed')
    )
  }
}
function handleModalComplete() {
  const appointmentId =
    document.getElementById('appointment-modal')?.dataset.appointmentId
  if (appointmentId) {
    showConfirmDialog('Mark this appointment as completed?', () =>
      updateAppointmentStatus(appointmentId, 'completed')
    )
  }
}
function handleModalCancel() {
  const appointmentId =
    document.getElementById('appointment-modal')?.dataset.appointmentId
  if (appointmentId) {
    showConfirmDialog('Cancel this appointment?', () =>
      updateAppointmentStatus(appointmentId, 'cancelled')
    )
  }
}

// Close any open modal
function closeModal(e) {
  if (e && e.target) {
    const modal = e.target.closest('.modal')
    if (modal) {
      modal.style.display = 'none'
    }
  } else {
    document.querySelectorAll('.modal').forEach((modal) => {
      modal.style.display = 'none'
    })
  }
}
