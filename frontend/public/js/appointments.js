document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in - use our auth utility
  const user = checkAuth()
  if (!user) {
    console.error('Not authenticated. Stopping script execution.')
    return // Stop execution if not authenticated
  }

  // Make sure user can book appointments (not a dentist)
  if (user.role === 'dentist') {
    console.error('Dentists cannot book appointments. Redirecting...')
    showNotificationDialog(
      'As a dentist, you cannot book appointments. Please use your dentist dashboard.',
      'Access Restricted',
      () => window.location.replace('dentist-dashboard.html')
    )
    return
  }

  // Initialize variables
  let currentStep = 1
  let selectedTimeSlot = null
  let selectedDate = null
  let selectedService = 'General Checkup' // Default service
  let selectedPaymentMethod = 'online' // Default to online payment for new users
  let isTrustedPatient = false // Default to false until we check

  // Define downpayment amounts for different services
  const DOWNPAYMENT_AMOUNTS = {
    'General Checkup': 200,
    'Teeth Cleaning': 500,
    'Teeth Whitening': 1000,
    'Dental Filling': 500,
    'Root Canal': 1000,
    'Tooth Extraction': 500,
  }

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
  const DENTIST_API_URL = 'http://localhost:3000/api/dentist/all'
  const CLINIC_API_URL = 'http://localhost:3000/api/clinic' // Added Clinic API base URL

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

  // Set minimum date to today and maximum date to a reasonable future date (1 year)
  const today = new Date()
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const formattedToday = `${yyyy}-${mm}-${dd}`

  // Set maximum date to 1 year from now to prevent typos like '20205'
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  const maxYyyy = maxDate.getFullYear()
  const maxMm = String(maxDate.getMonth() + 1).padStart(2, '0')
  const maxDd = String(maxDate.getDate()).padStart(2, '0')
  const formattedMaxDate = `${maxYyyy}-${maxMm}-${maxDd}`

  dateInput.min = formattedToday
  dateInput.max = formattedMaxDate

  // Initialize navbar
  initNavbarToggle()
  loadDentists() // Add this line to load dentists

  // Check if user is a returning/trusted patient
  checkUserTrustStatus(user.id)

  // Event Listeners
  nextButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault() // Prevent default button behavior
      goToNextStep()
    })
  })

  prevButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault() // Prevent default button behavior
      goToPrevStep()
    })
  })

  dateInput.addEventListener('change', function () {
    const inputDate = this.value

    // Additional validation to prevent typos like '20205'
    if (inputDate) {
      const dateObj = new Date(inputDate)
      const currentYear = new Date().getFullYear()
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time portion for date comparison
      dateObj.setHours(0, 0, 0, 0)

      if (isNaN(dateObj.getTime()) || dateObj.getFullYear() > currentYear + 5) {
        showToast('Please select a valid date', TOAST_LEVELS.ERROR)
        this.value = ''
        selectedDate = null
        return
      }

      // Check if date is in the past
      if (dateObj < today) {
        showToast('Cannot book appointments for past dates', TOAST_LEVELS.ERROR)
        this.value = ''
        selectedDate = null
        return
      }

      selectedDate = inputDate
      loadAvailableTimeSlots(selectedDate)
    } else {
      selectedDate = null
      // Clear time slots if date is cleared
      timeSlotContainer.innerHTML =
        '<p class="no-slots-message">Please select a date to see available time slots</p>'
    }

    // Reset time slot selection when date changes
    selectedTimeSlot = null
    updateSummary()
    dateNextBtn.disabled = !selectedTimeSlot
  })

  // Service selection change
  document.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      selectedService = this.value
      updateSummary()
    })
  })

  // Dentist selection change
  document.getElementById('dentist').addEventListener('change', function () {
    if (selectedDate) {
      loadAvailableTimeSlots(selectedDate)
    }
    updateSummary()
  })

  // Payment method selection
  document.querySelectorAll('input[name="payment-method"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      selectedPaymentMethod = this.value
      updateSummary()

      // Toggle visibility of online payment instructions
      const onlineInstructions = document.getElementById(
        'online-payment-instructions'
      )
      if (onlineInstructions) {
        onlineInstructions.style.display =
          selectedPaymentMethod === 'online' ? 'block' : 'none'
      }
    })
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

    // Additional validation for date (check if it's not in the past)
    const selectedDateObj = new Date(selectedDate)
    const today = new Date()
    selectedDateObj.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (selectedDateObj < today) {
      showBookingStatus('Cannot book appointments for past dates', 'error')
      return
    }

    // Show loading status
    showBookingStatus('Processing your booking...', 'info')

    // Get downpayment amount based on selected service
    const downpaymentAmount = DOWNPAYMENT_AMOUNTS[service] || 500

    // Prepare appointment data with downpayment information
    const appointmentData = {
      userId: user.id,
      service,
      dentist,
      date: selectedDate,
      time: selectedTimeSlot,
      notes,
      downpaymentAmount,
      downpaymentStatus: 'pending', // Default status
      paymentMethod: selectedPaymentMethod,
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
        if (selectedPaymentMethod === 'online') {
          // If online payment is selected, redirect to payment page
          localStorage.setItem(
            'pendingAppointment',
            JSON.stringify({
              appointmentId: data.appointment.id,
              service: service,
              amount: downpaymentAmount,
              date: selectedDate,
              time: selectedTimeSlot,
              dentist: dentist,
            })
          )
          window.location.href = 'payment.html'
        } else {
          showBookingSuccess(data)
        }
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
    if (currentStep === 1) {
      if (!document.getElementById('dentist').value) {
        showToast('Please select a dentist', TOAST_LEVELS.WARNING)
        return
      }
      // Step 1 is valid, proceed
    } else if (currentStep === 2) {
      if (!selectedTimeSlot) {
        showToast('Please select a time slot', TOAST_LEVELS.WARNING)
        return
      }
      // Step 2 is valid, proceed
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
      dateNextBtn.disabled = true
      return
    }

    // Validate date format to prevent issues with backend
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      timeSlotContainer.innerHTML =
        '<p class="no-slots-message error-message">Invalid date format. Please select a date from the calendar.</p>'
      dateNextBtn.disabled = true
      return
    }

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      timeSlotContainer.innerHTML =
        '<p class="no-slots-message error-message">Invalid date. Please select a valid date.</p>'
      dateNextBtn.disabled = true
      return
    }

    const dentist = document.getElementById('dentist').value
    if (!dentist) {
      timeSlotContainer.innerHTML =
        '<p class="no-slots-message">Please select a dentist to see available time slots</p>'
      dateNextBtn.disabled = true
      return
    }

    // Show loading message
    timeSlotContainer.innerHTML =
      '<p class="no-slots-message"><i class="fas fa-spinner fa-spin"></i> Checking availability...</p>'
    dateNextBtn.disabled = true

    // --- 1. Check Clinic Availability First ---
    fetch(`${CLINIC_API_URL}/check-availability?date=${date}`)
      .then((response) => {
        if (!response.ok) {
          // Try to parse error message from backend
          return response
            .json()
            .then((errData) => {
              throw new Error(
                errData.message || 'Failed to check clinic availability'
              )
            })
            .catch(() => {
              // Fallback if parsing fails
              throw new Error(
                `Clinic availability check failed with status: ${response.status}`
              )
            })
        }
        return response.json()
      })
      .then((clinicData) => {
        if (!clinicData.success) {
          throw new Error(
            clinicData.message || 'Failed to check clinic availability'
          )
        }

        // If clinic is NOT available, show message and stop
        if (!clinicData.available) {
          timeSlotContainer.innerHTML = `
            <div class="unavailable-date-message">
              <i class="fas fa-store-alt-slash"></i> <!-- Changed icon -->
              <p>${
                clinicData.reason ||
                'The clinic is closed on this date. Please select another date.'
              }</p>
            </div>
          `
          dateNextBtn.disabled = true
          return // Stop processing
        }

        // --- 2. If Clinic is Available, Check Dentist Availability ---
        return fetch(
          `http://localhost:3000/api/dentist/check-availability?date=${date}&dentistName=${encodeURIComponent(
            dentist
          )}`
        )
      })
      .then((dentistResponse) => {
        // This block only runs if the clinic check passed and returned a response object
        if (!dentistResponse) return // Exit if clinic check stopped processing

        if (!dentistResponse.ok) {
          // Try to parse error message from backend
          return dentistResponse
            .json()
            .then((errData) => {
              throw new Error(
                errData.message || 'Failed to check dentist availability'
              )
            })
            .catch(() => {
              // Fallback if parsing fails
              throw new Error(
                `Dentist availability check failed with status: ${dentistResponse.status}`
              )
            })
        }
        return dentistResponse.json()
      })
      .then((dentistData) => {
        // This block only runs if the dentist check fetch was successful
        if (!dentistData) return // Exit if clinic check stopped processing

        if (!dentistData.success) {
          throw new Error(dentistData.message || 'Failed to check availability')
        }

        // If dentist is NOT available on this date, show message and don't load time slots
        if (!dentistData.available) {
          timeSlotContainer.innerHTML = `
            <div class="unavailable-date-message">
              <i class="fas fa-user-clock"></i> <!-- Changed icon -->
              <p>${
                dentistData.reason || // Use the reason from the backend
                'The selected dentist is not available on this date. Please select another date or dentist.' // Updated message
              }</p>
            </div>
          `
          dateNextBtn.disabled = true
          return // Stop processing
        }

        // --- 3. If Both Clinic and Dentist are Available, Load Time Slots ---
        fetchAvailableTimeSlots(date, dentist)
      })
      .catch((error) => {
        console.error('Error checking availability:', error)
        // Display a generic error or the specific one caught
        timeSlotContainer.innerHTML = `<p class="no-slots-message error-message">Error checking availability: ${error.message}. Please try again.</p>`
        dateNextBtn.disabled = true
      })
  }

  // New function to fetch available time slots (extracted from loadAvailableTimeSlots)
  function fetchAvailableTimeSlots(date, dentist) {
    // Show loading message for time slots
    timeSlotContainer.innerHTML =
      '<p class="no-slots-message"><i class="fas fa-spinner fa-spin"></i> Loading available time slots...</p>'

    // Fetch booked slots from the server
    fetch(
      `${API_URL}/booked-slots?date=${date}&dentist=${encodeURIComponent(
        dentist
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch time slots')
        }
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
          '<p class="no-slots-message error-message">Error loading time slots. Please try again or select another date.</p>'
        dateNextBtn.disabled = true
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

    // Get downpayment amount
    const downpaymentAmount = DOWNPAYMENT_AMOUNTS[service] || 500

    // Update summary section
    document.getElementById('summary-service').textContent = service
    document.getElementById('summary-dentist').textContent = dentist
    document.getElementById('summary-date').textContent = selectedDate
      ? formatDate(selectedDate)
      : 'Not selected'
    document.getElementById('summary-time').textContent = selectedTimeSlot
      ? formatTime(selectedTimeSlot)
      : 'Not selected'

    // Add downpayment information to summary
    document.getElementById(
      'summary-downpayment'
    ).textContent = `₱${downpaymentAmount}.00`

    // Update payment method if available in summary
    const summaryPaymentMethod = document.getElementById(
      'summary-payment-method'
    )
    if (summaryPaymentMethod) {
      let paymentText =
        selectedPaymentMethod === 'clinic'
          ? 'Pay at clinic before appointment'
          : 'Online payment (proceed after booking)'
      summaryPaymentMethod.textContent = paymentText
    }
  }

  function formatDate(dateString) {
    // Create a date object with Philippine timezone in mind
    const [year, month, day] = dateString
      .split('-')
      .map((num) => parseInt(num, 10))

    // Use the proper date string format with Philippine timezone (+08:00)
    const date = new Date(
      `${year}-${month.toString().padStart(2, '0')}-${day
        .toString()
        .padStart(2, '0')}T00:00:00+08:00`
    )

    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Manila', // Explicitly use Philippine timezone
    }
    return date.toLocaleDateString(undefined, options)
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
    statusElement.innerHTML = message // Changed from textContent to innerHTML
    statusElement.className = 'booking-status'
    statusElement.classList.add(type)
  }

  function showBookingSuccess(data) {
    // Get downpayment amount
    const service = document.querySelector(
      'input[name="service"]:checked'
    ).value
    const downpaymentAmount = DOWNPAYMENT_AMOUNTS[service] || 500
    const paymentMethod = selectedPaymentMethod

    let paymentInstructions = ''
    if (paymentMethod === 'clinic') {
      paymentInstructions = `
        <div class="important-note">
          <i class="fas fa-info-circle"></i>
          Please note: A downpayment of ₱${downpaymentAmount}.00 is required to confirm your appointment.
          <br>Please arrive 15 minutes before your appointment to process the payment at our clinic.
        </div>
      `
    } else {
      paymentInstructions = `
        <div class="important-note">
          <i class="fas fa-info-circle"></i>
          You will be redirected to our payment page to complete your downpayment of ₱${downpaymentAmount}.00.
        </div>
      `
    }

    // Show success message with downpayment information
    showBookingStatus(
      `Your appointment has been booked successfully!<br>${paymentInstructions}`,
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

  // Load available dentists from the database
  function loadDentists() {
    const dentistSelect = document.getElementById('dentist')

    // Show loading option
    dentistSelect.innerHTML = '<option value="">Loading dentists...</option>'

    fetch(DENTIST_API_URL)
      .then((response) => {
        if (!response.ok) {
          const error = new Error(`HTTP error! Status: ${response.status}`)
          error.status = response.status
          throw error
        }
        return response.json()
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || 'Failed to load dentists')
        }

        // Clear loading option
        dentistSelect.innerHTML =
          '<option value="">Choose a dentist...</option>'

        // Add dentists from the database
        if (data.dentists && data.dentists.length > 0) {
          data.dentists.forEach((dentist) => {
            const option = document.createElement('option')
            option.value = dentist.name

            // Add specialization if available
            let optionText = dentist.name
            if (dentist.specialization) {
              optionText += ` (${dentist.specialization})`
            }

            option.textContent = optionText
            dentistSelect.appendChild(option)
          })
        } else {
          // If no dentists found
          dentistSelect.innerHTML =
            '<option value="">No dentists available</option>'
        }
      })
      .catch((error) => {
        console.error('Error loading dentists:', error)
        dentistSelect.innerHTML =
          '<option value="">Error loading dentists</option>'

        // More informative error message
        const errorMessage = error.status
          ? `Server error (${error.status})`
          : error.message || 'Network error'

        showToast(`Error loading dentists: ${errorMessage}`, TOAST_LEVELS.ERROR)
      })
  }

  /**
   * Check if user is a returning/trusted patient
   * @param {number} userId - User ID to check
   */
  function checkUserTrustStatus(userId) {
    // Show loading state for payment options
    togglePaymentOptionsLoading(true)

    // Fetch user's past appointments to determine if they're a returning patient
    fetch(`http://localhost:3000/api/appointments/user/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch user appointment history')
        }
        return response.json()
      })
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || 'Failed to check user history')
        }

        // Check if user has any completed appointments
        const completedAppointments = data.appointments.filter(
          (apt) => apt.status === 'completed'
        )

        isTrustedPatient = completedAppointments.length > 0

        // Configure payment options based on trust status
        configurePaymentOptions(isTrustedPatient)

        // Hide loading state
        togglePaymentOptionsLoading(false)
      })
      .catch((error) => {
        console.error('Error checking user trust status:', error)
        // Default to treating as new patient if there's an error
        configurePaymentOptions(false)
        togglePaymentOptionsLoading(false)
      })
  }

  /**
   * Configure payment options based on user trust status
   * @param {boolean} isTrusted - Whether the user is a trusted patient
   */
  function configurePaymentOptions(isTrusted) {
    const clinicPaymentOption = document.getElementById('payment-clinic')
    const clinicPaymentLabel = document.querySelector(
      'label[for="payment-clinic"]'
    )
    const paymentNotice = document.getElementById('payment-restriction-notice')

    if (!isTrusted) {
      // For new patients, disable clinic payment and select online payment
      clinicPaymentOption.disabled = true
      clinicPaymentOption.checked = false

      // Add visual indication that the option is disabled
      clinicPaymentLabel.classList.add('disabled-option')

      // Select online payment by default
      document.getElementById('payment-online').checked = true
      selectedPaymentMethod = 'online'

      // Show notice explaining why clinic payment is disabled
      if (paymentNotice) {
        paymentNotice.style.display = 'block'
      } else {
        // Create notice if it doesn't exist
        const notice = document.createElement('div')
        notice.id = 'payment-restriction-notice'
        notice.className = 'payment-restriction-notice'
        notice.innerHTML = `
          <i class="fas fa-info-circle"></i>
          <p>"Pay at Clinic" is only available for returning patients. As a new patient, 
          please secure your appointment with an online payment.</p>
        `

        // Insert after payment options
        document
          .querySelector('.payment-options')
          .insertAdjacentElement('afterend', notice)
      }

      // Show online payment instructions
      const onlineInstructions = document.getElementById(
        'online-payment-instructions'
      )
      if (onlineInstructions) {
        onlineInstructions.style.display = 'block'
      }
    } else {
      // For returning patients, enable all payment options
      clinicPaymentOption.disabled = false
      clinicPaymentLabel.classList.remove('disabled-option')

      // Hide the restriction notice if it exists
      if (paymentNotice) {
        paymentNotice.style.display = 'none'
      }
    }

    // Update summary with selected payment method
    updateSummary()
  }

  /**
   * Toggle loading state for payment options
   * @param {boolean} isLoading - Whether the payment options are loading
   */
  function togglePaymentOptionsLoading(isLoading) {
    const paymentSection = document.querySelector('.payment-method-section')

    if (isLoading) {
      // Add loading overlay
      paymentSection.classList.add('loading')
      paymentSection.insertAdjacentHTML(
        'afterbegin',
        '<div class="loading-overlay"><i class="fas fa-spinner fa-spin"></i> Checking account status...</div>'
      )
    } else {
      // Remove loading overlay
      paymentSection.classList.remove('loading')
      const overlay = paymentSection.querySelector('.loading-overlay')
      if (overlay) {
        overlay.remove()
      }
    }
  }
})
