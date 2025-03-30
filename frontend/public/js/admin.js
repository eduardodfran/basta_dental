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
  setupEventListeners()
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
          // Format date for display
          const dateObj = new Date(apt.date)
          // Add 1 day to compensate for potential timezone issue
          const timezoneOffset = new Date().getTimezoneOffset()
          if (timezoneOffset > 0) {
            dateObj.setDate(dateObj.getDate() + 1)
          }

          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          // Format time if available
          let formattedTime = 'N/A'
          if (apt.time) {
            const [hours, minutes] = apt.time.split(':')
            const timeObj = new Date()
            timeObj.setHours(hours, minutes, 0)
            formattedTime = timeObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
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
                <button class="action-btn btn-edit btn-confirm" title="Confirm Appointment">
                  <i class="fas fa-check"></i>
                </button>
              `
                  : ''
              }
              ${
                apt.status === 'confirmed'
                  ? `
                <button class="action-btn btn-edit btn-complete" title="Mark as Completed">
                  <i class="fas fa-check-double"></i>
                </button>
              `
                  : ''
              }
              ${
                apt.status !== 'cancelled' && apt.status !== 'completed'
                  ? `
                <button class="action-btn btn-delete btn-cancel" title="Cancel Appointment">
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
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #721c24;">
        Error loading appointments: ${error.message}</td></tr>`
    })
}

// Load all users
function loadUsers() {
  const tableBody = document.getElementById('users-data')
  const noUsersMsg = document.getElementById('no-users')

  // Show loading indicator
  tableBody.innerHTML =
    '<tr><td colspan="7" style="text-align: center;">Loading users...</td></tr>'

  // Fetch users from API
  fetch('http://localhost:3000/api/users')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    })
    .then((data) => {
      // Clear previous data
      tableBody.innerHTML = ''

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

        // Add users to table
        users.forEach((user) => {
          // Format date
          const joinDate = new Date(user.created_at)
          const formattedDate = joinDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          const row = document.createElement('tr')
          row.dataset.userId = user.id
          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="user-role role-${user.role}">${
            user.role
          }</span></td>
            <td>${formattedDate}</td>
            <td class="actions-cell">
              <button class="action-btn btn-view" title="View User Details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn btn-edit" title="Edit User Role">
                <i class="fas fa-user-edit"></i>
              </button>
            </td>
          `
          tableBody.appendChild(row)
        })
      }
    })
    .catch((error) => {
      console.error('Error loading users:', error)
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #721c24;">
        Error loading users: ${error.message}</td></tr>`
    })
}

// Load analytics data
function loadAnalytics() {
  // Set default date range (last 30 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  document.getElementById('analytics-start-date').value =
    formatDateForInput(startDate)
  document.getElementById('analytics-end-date').value =
    formatDateForInput(endDate)

  fetchAnalyticsData(formatDateForInput(startDate), formatDateForInput(endDate))
}

// Fetch analytics data from API
function fetchAnalyticsData(startDate, endDate) {
  // Update analytics cards with loading state
  document.getElementById('total-appointments').textContent = 'Loading...'
  document.getElementById('new-users').textContent = 'Loading...'
  document.getElementById('completion-rate').textContent = 'Loading...'
  document.getElementById('cancellation-rate').textContent = 'Loading...'

  // Fetch analytics data from API
  fetch(
    `http://localhost:3000/api/analytics?startDate=${startDate}&endDate=${endDate}`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load analytics')
      }

      // Update analytics cards
      document.getElementById('total-appointments').textContent =
        data.totalAppointments || 0
      document.getElementById('new-users').textContent = data.newUsers || 0
      document.getElementById('completion-rate').textContent = `${
        data.completionRate || 0
      }%`
      document.getElementById('cancellation-rate').textContent = `${
        data.cancellationRate || 0
      }%`

      // In a real implementation, you would update charts here
      // For now, we'll just show placeholder data
      console.log('Analytics data loaded:', data)
    })
    .catch((error) => {
      console.error('Error loading analytics:', error)
      document.getElementById('total-appointments').textContent = 'Error'
      document.getElementById('new-users').textContent = 'Error'
      document.getElementById('completion-rate').textContent = 'Error'
      document.getElementById('cancellation-rate').textContent = 'Error'
    })
}

// Helper function to format date for input fields
function formatDateForInput(date) {
  if (!date) return ''

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Open appointment details modal
function openAppointmentModal(appointmentId) {
  const modal = document.getElementById('appointment-modal')
  const detailsContainer = document.getElementById('appointment-details')

  // Show loading
  detailsContainer.innerHTML = '<p>Loading appointment details...</p>'

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

      // Format date for display
      const dateObj = new Date(apt.date)
      // Adjust for timezone if needed
      const timezoneOffset = new Date().getTimezoneOffset()
      if (timezoneOffset > 0) {
        dateObj.setDate(dateObj.getDate() + 1)
      }

      const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      // Format time if available
      let formattedTime = 'N/A'
      if (apt.time) {
        const [hours, minutes] = apt.time.split(':')
        const timeObj = new Date()
        timeObj.setHours(hours, minutes, 0)
        formattedTime = timeObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }

      // Populate details
      detailsContainer.innerHTML = `
        <div class="detail-item">
          <div class="detail-label">Appointment ID:</div>
          <div class="detail-value">${apt.id}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Patient:</div>
          <div class="detail-value">${
            apt.userName || apt.user_id || 'Unknown'
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">User ID:</div>
          <div class="detail-value">${apt.user_id}</div>
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
          <div class="detail-label">Dentist:</div>
          <div class="detail-value">${apt.dentist}</div>
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
        <div class="detail-item">
          <div class="detail-label">Created:</div>
          <div class="detail-value">${new Date(
            apt.created_at
          ).toLocaleString()}</div>
        </div>
      `

      // Set appointment ID for action buttons
      document.getElementById('appointment-modal').dataset.appointmentId =
        apt.id

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
    })
    .catch((error) => {
      console.error('Error loading appointment details:', error)
      detailsContainer.innerHTML = `<p style="color: #721c24;">Error loading appointment details: ${error.message}</p>`
    })
}

// Open user details modal
function openUserModal(userId) {
  const modal = document.getElementById('user-modal')
  const detailsContainer = document.getElementById('user-details')
  const appointmentsContainer = document.getElementById(
    'user-appointments-list'
  )

  // Show loading
  detailsContainer.innerHTML = '<p>Loading user details...</p>'
  appointmentsContainer.innerHTML = '<p>Loading user appointments...</p>'

  // Show the modal
  modal.style.display = 'block'

  // Fetch user details
  fetch(`http://localhost:3000/api/users/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load user details')
      }

      const user = data.user

      // Format date of birth if available
      let formattedDob = 'Not provided'
      if (user.dob) {
        const dobDate = new Date(user.dob)
        // Adjust for timezone if needed
        const timezoneOffset = new Date().getTimezoneOffset()
        if (timezoneOffset > 0) {
          dobDate.setDate(dobDate.getDate() + 1)
        }
        formattedDob = dobDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }

      // Format join date
      const joinDate = new Date(user.created_at)
      const formattedJoinDate = joinDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })

      // Populate details
      detailsContainer.innerHTML = `
        <div class="detail-item">
          <div class="detail-label">ID:</div>
          <div class="detail-value">${user.id}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Name:</div>
          <div class="detail-value">${user.name}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Email:</div>
          <div class="detail-value">${user.email}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Phone:</div>
          <div class="detail-value">${user.phone || 'Not provided'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Date of Birth:</div>
          <div class="detail-value">${formattedDob}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Gender:</div>
          <div class="detail-value">${user.gender || 'Not specified'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Role:</div>
          <div class="detail-value">${user.role}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Address:</div>
          <div class="detail-value">${user.address || 'Not provided'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Joined:</div>
          <div class="detail-value">${formattedJoinDate}</div>
        </div>
      `

      // Set user ID for action buttons
      document.getElementById('user-modal').dataset.userId = user.id

      // Load user appointments
      return fetch(`http://localhost:3000/api/appointments/user/${userId}`)
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch user appointments')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load user appointments')
      }

      const appointments = data.appointments

      if (appointments.length === 0) {
        appointmentsContainer.innerHTML =
          '<p class="no-data-message" style="display: block;">No appointments found for this user.</p>'
      } else {
        // Clear container
        appointmentsContainer.innerHTML = ''

        // Add appointments to list
        appointments.forEach((apt) => {
          const dateObj = new Date(apt.date)
          // Adjust for timezone if needed
          const timezoneOffset = new Date().getTimezoneOffset()
          if (timezoneOffset > 0) {
            dateObj.setDate(dateObj.getDate() + 1)
          }

          const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })

          // Format time if available
          let formattedTime = 'N/A'
          if (apt.time) {
            const [hours, minutes] = apt.time.split(':')
            const timeObj = new Date()
            timeObj.setHours(hours, minutes, 0)
            formattedTime = timeObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }

          const item = document.createElement('div')
          item.className = 'user-appointment-item'
          item.innerHTML = `
            <div>
              <strong>${apt.service}</strong> with ${apt.dentist}
            </div>
            <div>
              ${formattedDate} at ${formattedTime}
            </div>
            <div>
              Status: <span class="appointment-status status-${apt.status}">
                ${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
              </span>
            </div>
          `
          appointmentsContainer.appendChild(item)
        })
      }
    })
    .catch((error) => {
      console.error('Error loading user details:', error)
      detailsContainer.innerHTML = `<p style="color: #721c24;">Error loading user details: ${error.message}</p>`
      appointmentsContainer.innerHTML = `<p style="color: #721c24;">Error loading user appointments: ${error.message}</p>`
    })
}

// Open role change modal
function openRoleModal(userId) {
  // Fetch current user info first
  fetch(`http://localhost:3000/api/users/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to fetch user details')
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to load user details')
      }

      const user = data.user

      // Set user ID in hidden field
      document.getElementById('user-id').value = userId

      // Set current role in select
      document.getElementById('user-role').value = user.role

      // Show the modal
      document.getElementById('role-modal').style.display = 'block'
    })
    .catch((error) => {
      console.error('Error loading user details for role change:', error)
      alert(`Error: ${error.message}`)
    })
}

// Update appointment status
function updateAppointmentStatus(appointmentId, status) {
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
      closeModal('appointment-modal')
      loadAppointments()
    })
    .catch((error) => {
      console.error('Error updating appointment status:', error)
      alert(`Error: ${error.message}`)
    })
}

// Update user role
function updateUserRole(userId, role) {
  fetch(`http://localhost:3000/api/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  })
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.message || 'Failed to update user role')
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Failed to update user role')
      }

      // Close modals and reload users
      closeModal('role-modal')
      closeModal('user-modal')
      loadUsers()
    })
    .catch((error) => {
      console.error('Error updating user role:', error)
      alert(`Error: ${error.message}`)
    })
}

// Close any modal
function closeModal(modalId = null) {
  if (modalId) {
    document.getElementById(modalId).style.display = 'none'
  } else {
    // Close all modals
    const modals = document.querySelectorAll('.modal')
    modals.forEach((modal) => {
      modal.style.display = 'none'
    })
  }
}

// Filter appointments by status and/or date
function filterAppointments() {
  const statusFilter = document.getElementById('status-filter').value
  const dateFilter = document.getElementById('date-filter').value

  const rows = document.querySelectorAll('#admin-appointments-table tbody tr')
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
      const dateCell = row.querySelector('td:nth-child(4)').textContent
      const rowDate = new Date(dateCell.split('at')[0].trim())
      const filterDate = new Date(dateFilter)

      // Compare year, month, and day
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

// Filter users by role and/or search term
function filterUsers() {
  const roleFilter = document.getElementById('role-filter').value
  const searchTerm = document.getElementById('search-users').value.toLowerCase()

  const rows = document.querySelectorAll('#users-table tbody tr')
  let visibleCount = 0

  rows.forEach((row) => {
    let showRow = true

    // Filter by role
    if (roleFilter !== 'all') {
      const roleCell = row.querySelector('.user-role')
      const rowRole = roleCell.className.split('role-')[1].split(' ')[0]
      if (rowRole !== roleFilter) {
        showRow = false
      }
    }

    // Filter by search term
    if (searchTerm && showRow) {
      const nameCell = row
        .querySelector('td:nth-child(2)')
        .textContent.toLowerCase()
      const emailCell = row
        .querySelector('td:nth-child(3)')
        .textContent.toLowerCase()
      if (!nameCell.includes(searchTerm) && !emailCell.includes(searchTerm)) {
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

  // Show or hide "no users" message
  const noUsersMsg = document.getElementById('no-users')
  if (visibleCount === 0) {
    noUsersMsg.style.display = 'block'
  } else {
    noUsersMsg.style.display = 'none'
  }
}

// Setup all event listeners
function setupEventListeners() {
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

  // User filters
  document.getElementById('role-filter').addEventListener('change', filterUsers)
  document.getElementById('search-users').addEventListener('input', filterUsers)
  document
    .getElementById('clear-user-filters')
    .addEventListener('click', function () {
      document.getElementById('role-filter').value = 'all'
      document.getElementById('search-users').value = ''
      filterUsers()
    })

  // Analytics date range
  document
    .getElementById('update-analytics')
    .addEventListener('click', function () {
      const startDate = document.getElementById('analytics-start-date').value
      const endDate = document.getElementById('analytics-end-date').value
      fetchAnalyticsData(startDate, endDate)
    })

  // Appointment actions (delegation)
  document
    .getElementById('appointments-data')
    .addEventListener('click', function (e) {
      const target = e.target.closest('button')
      if (!target) return

      const row = target.closest('tr')
      const appointmentId = row.dataset.appointmentId

      if (target.classList.contains('btn-view')) {
        openAppointmentModal(appointmentId)
      } else if (target.classList.contains('btn-confirm')) {
        if (confirm('Confirm this appointment?')) {
          updateAppointmentStatus(appointmentId, 'confirmed')
        }
      } else if (target.classList.contains('btn-complete')) {
        if (confirm('Mark this appointment as completed?')) {
          updateAppointmentStatus(appointmentId, 'completed')
        }
      } else if (target.classList.contains('btn-cancel')) {
        if (confirm('Cancel this appointment?')) {
          updateAppointmentStatus(appointmentId, 'cancelled')
        }
      }
    })

  // User actions (delegation)
  document.getElementById('users-data').addEventListener('click', function (e) {
    const target = e.target.closest('button')
    if (!target) return

    const row = target.closest('tr')
    const userId = row.dataset.userId

    if (target.classList.contains('btn-view')) {
      openUserModal(userId)
    } else if (target.classList.contains('btn-edit')) {
      openRoleModal(userId)
    }
  })

  // Modal close buttons
  document
    .querySelectorAll('.close, #close-modal, #close-user-modal')
    .forEach((element) => {
      element.addEventListener('click', function () {
        closeModal()
      })
    })

  // Add explicit handler for the button to close appointment modal
  document.getElementById('close-modal').addEventListener('click', function () {
    closeModal('appointment-modal')
  })

  // Add explicit handler for the button to close user modal
  document
    .getElementById('close-user-modal')
    .addEventListener('click', function () {
      closeModal('user-modal')
    })

  document
    .getElementById('cancel-role-change')
    .addEventListener('click', function () {
      closeModal('role-modal')
    })

  // Appointment action buttons in modal
  document
    .getElementById('confirm-appointment')
    .addEventListener('click', function () {
      const appointmentId =
        document.getElementById('appointment-modal').dataset.appointmentId
      updateAppointmentStatus(appointmentId, 'confirmed')
    })

  document
    .getElementById('complete-appointment')
    .addEventListener('click', function () {
      const appointmentId =
        document.getElementById('appointment-modal').dataset.appointmentId
      updateAppointmentStatus(appointmentId, 'completed')
    })

  document
    .getElementById('cancel-appointment')
    .addEventListener('click', function () {
      const appointmentId =
        document.getElementById('appointment-modal').dataset.appointmentId
      updateAppointmentStatus(appointmentId, 'cancelled')
    })

  // Edit user role button in user modal
  document
    .getElementById('edit-user-role')
    .addEventListener('click', function () {
      const userId = document.getElementById('user-modal').dataset.userId
      openRoleModal(userId)
    })

  // Change role form submission
  document
    .getElementById('change-role-form')
    .addEventListener('submit', function (e) {
      e.preventDefault()
      const userId = document.getElementById('user-id').value
      const role = document.getElementById('user-role').value
      updateUserRole(userId, role)
    })

  // Close modals if clicked outside
  window.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal')) {
      closeModal(e.target.id)
    }
  })
}

// Admin auth check function
function checkAdminAuth() {
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

    if (user.role !== 'admin') {
      alert('Access denied. Admin privileges required.')
      window.location.replace('dashboard.html')
      return null
    }

    return user
  } catch (error) {
    console.error('Error checking admin authentication:', error)
    localStorage.removeItem('user')
    window.location.replace('login.html')
    return null
  }
}
