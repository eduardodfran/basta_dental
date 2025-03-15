document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in - use our auth utility
  const user = checkAuth()
  if (!user) {
    console.error('Not authenticated. Stopping script execution.')
    return // Stop execution if not authenticated
  }

  // Initialize variables
  let currentStep = 1
  let selectedTimeSlot = null
  let selectedDate = null

  // Available time slots (24-hour format)
  const timeSlots = [
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
  ]

  // API endpoint
  const API_URL = 'http://localhost:3000/api/appointments'

  // Elements
  const progressSteps = document.querySelectorAll('.progress-step')
  const progressConnectors = document.querySelectorAll('.progress-connector')
  const formSteps = document.querySelectorAll('.form-step')
  const nextButtons = document.querySelectorAll('.btn-next')
  const prevButtons = document.querySelectorAll('.btn-prev')
  const bookingForm = document.getElementById('booking-form')
  const dateInput = document.getElementById('appointment-date')
  const timeSlotContainer = document.getElementById('time-slots')
  const dateNextBtn = document.getElementById('date-next-btn')
  const logoutBtn = document.getElementById('logout-btn')

  // Set minimum date to today
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const formattedToday = `${yyyy}-${mm}-${dd}`
  dateInput.min = formattedToday

  // Initialize navbar
  initNavbarToggle()

  // Event Listeners
  nextButtons.forEach((button) => {
    button.addEventListener('click', () => {
      goToNextStep()
    })
  })

  prevButtons.forEach((button) => {
    button.addEventListener('click', () => {
      goToPrevStep()
    })
  })

  dateInput.addEventListener('change', function () {
    selectedDate = this.value
    selectedTimeSlot = null
    loadAvailableTimeSlots(selectedDate)
    updateSummary()
    dateNextBtn.disabled = !selectedTimeSlot
  })

  // Service selection change
  document.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener('change', updateSummary)
  })

  // Dentist selection change
  document.getElementById('dentist').addEventListener('change', function () {
    if (selectedDate) {
      loadAvailableTimeSlots(selectedDate)
    }
    updateSummary()
  })

  // Form submission
  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault()

    // Get form data
    const service = document.querySelector(
      'input[name="service"]:checked'
    ).value
    const dentist = document.getElementById('dentist').value
    const notes = document.getElementById('notes').value

    if (!selectedDate || !selectedTimeSlot || !dentist) {
      showBookingStatus('Please complete all required fields', 'error')
      return
    }

    // Show loading status
    showBookingStatus('Processing your booking...', 'info')

    // Prepare appointment data
    const appointmentData = {
      userId: user.id,
      service,
      dentist,
      date: selectedDate,
      time: selectedTimeSlot,
      notes,
    }

    // Send data to the server
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message || 'Failed to book appointment')
          })
        }
        return response.json()
      })
      .then((data) => {
        showBookingSuccess(data)
      })
      .catch((error) => {
        showBookingStatus('Error: ' + error.message, 'error')
      })
  })

  logoutBtn.addEventListener('click', function (e) {
    e.preventDefault()
    localStorage.removeItem('user')
    window.location.href = 'index.html'
  })

  // Functions
  function goToNextStep() {
    // Validate current step before proceeding
    if (currentStep === 1 && !document.getElementById('dentist').value) {
      alert('Please select a dentist')
      return
    }

    if (currentStep === 2 && !selectedTimeSlot) {
      alert('Please select a time slot')
      return
    }

    // Hide current step
    formSteps[currentStep - 1].classList.remove('active')

    // Update progress
    progressSteps[currentStep - 1].classList.add('completed')
    if (currentStep < progressConnectors.length + 1) {
      progressConnectors[currentStep - 1].classList.add('active')
    }

    // Show next step
    currentStep++
    formSteps[currentStep - 1].classList.add('active')
    formSteps[currentStep - 1].classList.add('animate-right')

    // Update progress steps
    updateProgressSteps()

    // Update summary if going to review step
    if (currentStep === 3) {
      updateSummary()
    }
  }

  function goToPrevStep() {
    // Hide current step
    formSteps[currentStep - 1].classList.remove('active')

    // Update progress (remove completed status from previous step)
    progressSteps[currentStep - 2].classList.remove('completed')
    if (currentStep - 2 < progressConnectors.length) {
      progressConnectors[currentStep - 2].classList.remove('active')
    }

    // Show previous step
    currentStep--
    formSteps[currentStep - 1].classList.add('active')
    formSteps[currentStep - 1].classList.add('animate-left')

    // Update progress steps
    updateProgressSteps()
  }

  function updateProgressSteps() {
    // Reset all steps
    progressSteps.forEach((step) => {
      step.classList.remove('active')
    })

    // Set active step
    progressSteps[currentStep - 1].classList.add('active')

    // Remove animation classes after animation completes
    setTimeout(() => {
      formSteps.forEach((step) => {
        step.classList.remove('animate-right', 'animate-left')
      })
    }, 300)
  }

  function loadAvailableTimeSlots(date) {
    if (!date) {
      timeSlotContainer.innerHTML =
        '<p class="no-slots-message">Please select a date to see available time slots</p>'
      return
    }

    const dentist = document.getElementById('dentist').value
    if (!dentist) {
      timeSlotContainer.innerHTML =
        '<p class="no-slots-message">Please select a dentist to see available time slots</p>'
      return
    }

    // Show loading message
    timeSlotContainer.innerHTML =
      '<p class="no-slots-message"><i class="fas fa-spinner fa-spin"></i> Loading available time slots...</p>'

    // Fetch booked slots from the server
    fetch(
      `${API_URL}/booked-slots?date=${date}&dentist=${encodeURIComponent(
        dentist
      )}`
    )
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch time slots')
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          generateTimeSlots(date, dentist, data.bookedSlots)
        } else {
          throw new Error(data.message || 'Failed to load time slots')
        }
      })
      .catch((error) => {
        console.error('Error loading time slots:', error)
        timeSlotContainer.innerHTML =
          '<p class="no-slots-message error-message">Error loading time slots. Please try again.</p>'
      })
  }

  function generateTimeSlots(date, dentist, bookedSlots) {
    // Clear existing time slots
    timeSlotContainer.innerHTML = ''

    // Generate time slots
    timeSlots.forEach((time) => {
      const slot = document.createElement('div')
      slot.className = 'time-slot'
      slot.textContent = formatTime(time)
      slot.dataset.time = time

      // Check if slot is already booked
      const isBooked = bookedSlots.includes(time)

      if (isBooked) {
        slot.classList.add('booked')
        slot.title = 'This time slot is already booked'
      } else {
        // Add click event to selectable slots
        slot.addEventListener('click', () => {
          // Deselect all time slots
          document.querySelectorAll('.time-slot').forEach((ts) => {
            ts.classList.remove('selected')
          })

          // Select this time slot
          slot.classList.add('selected')
          selectedTimeSlot = time
          dateNextBtn.disabled = false
          updateSummary()
        })
      }

      // If this was previously selected, keep the selection
      if (time === selectedTimeSlot) {
        slot.classList.add('selected')
      }

      timeSlotContainer.appendChild(slot)
    })
  }

  function updateSummary() {
    // Get selected values
    const service = document.querySelector(
      'input[name="service"]:checked'
    ).value
    const dentist = document.getElementById('dentist').value || 'Not selected'

    // Update summary section
    document.getElementById('summary-service').textContent = service
    document.getElementById('summary-dentist').textContent = dentist
    document.getElementById('summary-date').textContent = selectedDate
      ? formatDate(selectedDate)
      : 'Not selected'
    document.getElementById('summary-time').textContent = selectedTimeSlot
      ? formatTime(selectedTimeSlot)
      : 'Not selected'
  }

  function formatDate(dateString) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  function formatTime(timeString) {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12 // Convert 0 to 12 for 12 AM

    return `${hour12}:${minutes} ${ampm}`
  }

  function showBookingStatus(message, type) {
    const statusElement = document.getElementById('booking-status')
    statusElement.textContent = message
    statusElement.className = 'booking-status'
    statusElement.classList.add(type)
  }

  function showBookingSuccess(data) {
    // Show success message
    showBookingStatus(
      'Your appointment has been booked successfully!',
      'success'
    )

    // Add a simple redirect button to the dashboard
    const statusElement = document.getElementById('booking-status')

    // Create container for dashboard link
    const dashboardLinkContainer = document.createElement('div')
    dashboardLinkContainer.style.marginTop = '15px'
    dashboardLinkContainer.style.textAlign = 'center'

    // Create dashboard link
    const dashboardLink = document.createElement('a')
    dashboardLink.href = 'dashboard.html'
    dashboardLink.className = 'btn btn-confirm'
    dashboardLink.innerHTML = '<i class="fas fa-home"></i> Go to Dashboard'
    dashboardLink.style.textDecoration = 'none'
    dashboardLink.style.marginTop = '10px'
    dashboardLink.style.display = 'inline-block'

    // Append elements
    dashboardLinkContainer.appendChild(dashboardLink)
    statusElement.appendChild(dashboardLinkContainer)

    // Disable form submission
    document.querySelector('.btn-confirm').disabled = true
  }

  function initNavbarToggle() {
    const burger = document.querySelector('.burger')
    if (burger) {
      burger.addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('nav-active')
        burger.classList.toggle('toggle')
      })
    }
  }
})
