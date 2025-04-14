/**
 * Appointment Transfer Functionality
 * Allows dentists to claim transferable appointments from other dentists
 */

document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in as dentist
  const user = checkAuth()
  if (!user || user.role !== 'dentist') {
    console.error(
      'Not authenticated as dentist. Not loading transfer functionality.'
    )
    return
  }

  // Add tab for transferable appointments if it doesn't exist already
  setupTransferableTab()
})

// Setup the transferable appointments tab
function setupTransferableTab() {
  const tabsContainer = document.querySelector('.dentist-tabs')
  if (tabsContainer && !document.querySelector('[data-tab="transferable"]')) {
    const transferableTab = document.createElement('button')
    transferableTab.className = 'tab-btn'
    transferableTab.setAttribute('data-tab', 'transferable')
    transferableTab.innerHTML =
      '<i class="fas fa-exchange-alt"></i> Transferable'
    tabsContainer.appendChild(transferableTab)

    // Create the tab content pane
    createTransferableTabPane()

    // Add event listener to the tab
    transferableTab.addEventListener('click', function () {
      document
        .querySelectorAll('.tab-btn')
        .forEach((btn) => btn.classList.remove('active'))
      document
        .querySelectorAll('.tab-pane')
        .forEach((pane) => pane.classList.remove('active'))
      transferableTab.classList.add('active')
      document.getElementById('transferable-tab').classList.add('active')

      // Load transferable appointments when tab is clicked
      loadTransferableAppointments()
    })
  }
}

// Create the tab pane for transferable appointments
function createTransferableTabPane() {
  const tabContent = document.querySelector('.tab-content')
  if (!tabContent || document.getElementById('transferable-tab')) return

  const transferablePane = document.createElement('div')
  transferablePane.className = 'tab-pane'
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

  tabContent.appendChild(transferablePane)

  // Add event listeners for filters
  setupTransferableFilters()
}

// Setup event listeners for transferable appointment filters
function setupTransferableFilters() {
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
          (apt) => apt.originalDentist !== currentUser.name
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

          row.innerHTML = `
            <td>${formattedDate}<br>${formattedTime}</td>
            <td>${apt.userName || 'Unknown'}</td>
            <td>${apt.service}</td>
            <td>${apt.originalDentist || 'N/A'}</td>
            <td>
              <span class="appointment-status status-${
                apt.transferStatus || 'available'
              }">
                ${
                  (apt.transferStatus || 'available').charAt(0).toUpperCase() +
                  (apt.transferStatus || 'available').slice(1)
                }
              </span>
            </td>
            <td>
              <button class="action-btn btn-view" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              ${
                apt.transferStatus === 'available'
                  ? `
                <button class="action-btn btn-claim" title="Claim Appointment">
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
        setupTransferableButtonListeners(tableBody, currentUser.id)
      }
    })
    .catch((error) => {
      console.error('Error loading transferable appointments:', error)
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #721c24;">
        Error loading appointments: ${error.message}</td></tr>`
    })
}

// Setup event listeners for the buttons in the transferable appointments table
function setupTransferableButtonListeners(tableBody, userId) {
  tableBody.querySelectorAll('.btn-view').forEach((btn) => {
    btn.addEventListener('click', function () {
      const row = this.closest('tr')
      const appointmentId = row.dataset.appointmentId
      // Use the existing modal function from dentist.js
      openAppointmentModal(appointmentId, userId)
    })
  })

  tableBody.querySelectorAll('.btn-claim').forEach((btn) => {
    btn.addEventListener('click', function () {
      const row = this.closest('tr')
      const appointmentId = row.dataset.appointmentId
      claimTransferableAppointment(appointmentId)
    })
  })
}

// Claim a transferable appointment
function claimTransferableAppointment(appointmentId) {
  const currentUser = JSON.parse(localStorage.getItem('user'))

  // Show confirmation dialog
  showConfirmDialog(
    'Claim this appointment and add it to your schedule?',
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
                throw new Error(data.message || 'Failed to claim appointment')
              })
              .catch(() => {
                throw new Error(`Server error: ${response.status}`)
              })
          }
          return response.json()
        })
        .then((data) => {
          if (!data.success) {
            throw new Error(data.message || 'Failed to claim appointment')
          }

          // Show success message
          showToast(
            'Appointment successfully claimed and added to your schedule',
            TOAST_LEVELS.SUCCESS
          )

          // Reload both appointment lists
          loadTransferableAppointments()
          loadAppointments(currentUser.id)
        })
        .catch((error) => {
          console.error('Error claiming appointment:', error)
          showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
        })
    }
  )
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
      const statusCell = row.querySelector('.appointment-status')
      if (statusCell) {
        const rowStatus = statusCell.className.split('status-')[1].split(' ')[0]
        if (rowStatus !== statusFilter) {
          showRow = false
        }
      }
    }

    // Filter by date
    if (dateFilter && showRow) {
      const dateCell = row.querySelector('td:nth-child(1)').textContent
      const datePart = dateCell.split('<br>')[0].trim()

      try {
        const rowDate = new Date(datePart)
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
