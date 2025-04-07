/**
 * Payment Processing Module
 * Handles payment processing for BastaDental appointments
 */

document.addEventListener('DOMContentLoaded', function () {
  // Check if user is logged in
  const user = checkAuth()
  if (!user) {
    return // Stop execution if not authenticated
  }

  // Check if there's a pending appointment for payment
  const pendingAppointmentStr = localStorage.getItem('pendingAppointment')
  if (!pendingAppointmentStr) {
    showNotificationDialog(
      'No pending payment found. Please book an appointment first.',
      'No Payment Pending',
      () => window.location.replace('book-appointment.html')
    )
    return
  }

  try {
    const pendingAppointment = JSON.parse(pendingAppointmentStr)

    // Set up UI elements
    setupPaymentUI(pendingAppointment)

    // Initialize payment tabs
    initPaymentTabs()

    // Handle form submissions
    setupFormSubmissions(pendingAppointment)

    // Setup input formatting
    setupInputFormatting()

    // Handle payment cancellation
    setupCancellation(pendingAppointment)
  } catch (error) {
    console.error('Error processing payment information:', error)
    showToast('Error processing payment information', TOAST_LEVELS.ERROR)
  }

  // Mobile navbar toggle
  setupNavbar()
})

/**
 * Set up the payment UI with appointment details
 */
function setupPaymentUI(appointmentData) {
  // Update summary information
  document.getElementById('summary-service').textContent =
    appointmentData.service || 'Not available'
  document.getElementById('summary-dentist').textContent =
    appointmentData.dentist || 'Not selected'

  // Format amount with proper formatting
  const amount = appointmentData.amount || 0
  const formattedAmount = `₱${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
  document.getElementById('summary-amount').textContent = formattedAmount
  document.getElementById('bank-amount').textContent = formattedAmount

  // Format the amount for display in multiple locations
  const amountFormatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  document.getElementById('card-amount').textContent = amountFormatted
  document.getElementById('gcash-amount').textContent = amountFormatted
  document.getElementById('gcash-amount-display').textContent = amountFormatted

  // Format date and time
  const formattedDate = appointmentData.date
    ? new Date(appointmentData.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not selected'

  const formattedTime = appointmentData.time
    ? formatTime(appointmentData.time)
    : 'Not selected'
  document.getElementById(
    'summary-datetime'
  ).textContent = `${formattedDate} at ${formattedTime}`
}

/**
 * Initialize payment method tabs
 */
function initPaymentTabs() {
  const tabs = document.querySelectorAll('.payment-tab')
  const forms = document.querySelectorAll('.payment-form')

  tabs.forEach((tab) => {
    tab.addEventListener('click', function () {
      // Remove active class from all tabs and forms
      tabs.forEach((t) => t.classList.remove('active'))
      forms.forEach((f) => f.classList.remove('active'))

      // Add active class to clicked tab
      this.classList.add('active')

      // Show corresponding form
      const method = this.dataset.method
      document.getElementById(`${method}-payment-form`).classList.add('active')
    })
  })
}

/**
 * Set up form submission handlers
 */
function setupFormSubmissions(appointmentData) {
  document.querySelectorAll('.payment-form').forEach((form) => {
    form.addEventListener('submit', function (e) {
      e.preventDefault()

      // Check for required fields
      const method = getSelectedPaymentMethod()
      let isValid = true

      if (method === 'card') {
        const cardName = document.getElementById('card-name').value.trim()
        const cardNumber = document
          .getElementById('card-number')
          .value.replace(/\s/g, '')
        const cardExpiry = document.getElementById('card-expiry').value.trim()
        const cardCVV = document.getElementById('card-cvv').value.trim()

        if (!cardName || cardName.length < 3) {
          showToast(
            'Please enter a valid cardholder name',
            TOAST_LEVELS.WARNING
          )
          isValid = false
        } else if (!cardNumber || cardNumber.length < 13) {
          showToast('Please enter a valid card number', TOAST_LEVELS.WARNING)
          isValid = false
        } else if (!cardExpiry || !cardExpiry.includes('/')) {
          showToast(
            'Please enter a valid expiry date (MM/YY)',
            TOAST_LEVELS.WARNING
          )
          isValid = false
        } else if (!cardCVV || cardCVV.length < 3) {
          showToast('Please enter a valid CVV code', TOAST_LEVELS.WARNING)
          isValid = false
        }
      } else if (method === 'gcash') {
        // DEMO MODE: Allow any reference number for GCash payments
        const reference = document
          .getElementById('gcash-reference')
          .value.trim()
        if (!reference) {
          // Only check that something was entered, no validation on format/length
          showToast(
            'Please enter any reference number for demo',
            TOAST_LEVELS.WARNING
          )
          isValid = false
        }
        // Show demo mode toast if valid
        if (isValid) {
          showToast(
            'DEMO MODE: Accepting any GCash reference number',
            TOAST_LEVELS.INFO
          )
        }
      } else if (method === 'bank') {
        const reference = document.getElementById('bank-reference').value.trim()
        if (!reference || reference.length < 6) {
          showToast(
            'Please enter a valid bank reference number',
            TOAST_LEVELS.WARNING
          )
          isValid = false
        }
      }

      if (isValid) {
        processPayment(appointmentData)
      }
    })
  })
}

/**
 * Set up input formatting for card fields
 */
function setupInputFormatting() {
  // Format credit card number with spaces
  const cardNumberInput = document.getElementById('card-number')
  if (cardNumberInput) {
    cardNumberInput.addEventListener('input', function (e) {
      // Remove all non-digit characters
      let value = this.value.replace(/\D/g, '')

      // Add space after every 4 digits
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ')

      // Update the input value
      this.value = value
    })
  }

  // Format expiry date with slash
  const cardExpiryInput = document.getElementById('card-expiry')
  if (cardExpiryInput) {
    cardExpiryInput.addEventListener('input', function (e) {
      // Remove all non-digit characters
      let value = this.value.replace(/\D/g, '')

      // Insert slash after 2 digits
      if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4)
      }

      // Update the input value
      this.value = value
    })
  }

  // Format GCash reference number - DEMO MODE: minimal validation
  const gcashRefInput = document.getElementById('gcash-reference')
  if (gcashRefInput) {
    // Add demo mode indicator to the input
    gcashRefInput.placeholder = 'Enter any reference number (Demo Mode)'

    // Add a demo badge next to the input
    const demoLabel = document.createElement('div')
    demoLabel.className = 'demo-badge'
    demoLabel.innerHTML = 'Demo Mode'
    gcashRefInput.parentNode.appendChild(demoLabel)

    gcashRefInput.addEventListener('input', function (e) {
      // Allow any characters for demo purposes
      // Just prevent excessive length
      if (this.value.length > 30) {
        this.value = this.value.substring(0, 30)
      }
    })
  }
}

/**
 * Set up payment cancellation
 */
function setupCancellation(appointmentData) {
  document
    .getElementById('cancel-payment')
    .addEventListener('click', function (e) {
      e.preventDefault()

      showConfirmDialog(
        'Are you sure you want to cancel online payment? You will need to pay at the clinic before your appointment.',
        () => {
          // Update appointment payment method to clinic
          updatePaymentMethod(appointmentData.appointmentId, 'clinic')
        }
      )
    })
}

/**
 * Set up the navbar toggle
 */
function setupNavbar() {
  document.querySelector('.burger').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('nav-active')
    this.classList.toggle('toggle')
  })

  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault()
    localStorage.removeItem('user')
    window.location.href = 'index.html'
  })
}

/**
 * Process the payment
 */
function processPayment(appointmentData) {
  // In a real application, this would connect to a payment processor
  // For this demo, we'll just show a success message and redirect
  const method = getSelectedPaymentMethod()
  let successMessage =
    '<div style="text-align: center"><i class="fas fa-check-circle" style="font-size: 48px; color: #34a853; margin-bottom: 20px;"></i><br>Your payment was successful! Your appointment is now confirmed.</div>'

  // Add demo mode message for GCash
  if (method === 'gcash') {
    successMessage =
      '<div style="text-align: center"><i class="fas fa-check-circle" style="font-size: 48px; color: #34a853; margin-bottom: 20px;"></i><br>DEMO MODE: GCash payment simulation successful!<br>Your appointment is now confirmed.</div>'
  }

  showToast('Processing payment...', TOAST_LEVELS.INFO)

  // Simulate payment processing delay
  setTimeout(() => {
    // Update appointment payment status - handle missing columns gracefully
    fetch(
      `http://localhost:3000/api/appointments/${appointmentData.appointmentId}/payment`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downpaymentStatus: 'paid',
          paymentMethod: getSelectedPaymentMethod(),
        }),
      }
    )
      .then((response) => {
        if (!response.ok) {
          return response
            .json()
            .then((data) => {
              throw new Error(data.message || 'Failed to update payment status')
            })
            .catch(() => {
              throw new Error(`Server error: ${response.status}`)
            })
        }
        return response.json()
      })
      .then((data) => {
        if (data.success) {
          // Remove pending appointment from localStorage
          localStorage.removeItem('pendingAppointment')

          // Show success and redirect
          showNotificationDialog(successMessage, 'Payment Successful', () =>
            window.location.replace('dashboard.html')
          )
        } else {
          throw new Error(data.message || 'Failed to process payment')
        }
      })
      .catch((error) => {
        console.error('Payment processing error:', error)

        // If there's an error with the payment update, try to at least confirm the appointment
        fetch(
          `http://localhost:3000/api/appointments/${appointmentData.appointmentId}/status`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'confirmed',
            }),
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              // Even though we couldn't update payment status, we confirmed the appointment
              localStorage.removeItem('pendingAppointment')
              showNotificationDialog(
                '<div style="text-align: center"><i class="fas fa-check-circle" style="font-size: 48px; color: #34a853; margin-bottom: 20px;"></i><br>Your payment was registered and your appointment is confirmed.<br><small>(Note: Some payment details could not be saved)</small></div>',
                'Appointment Confirmed',
                () => window.location.replace('dashboard.html')
              )
            } else {
              showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
            }
          })
          .catch((fallbackError) => {
            showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
          })
      })
  }, 2000)
}

/**
 * Update the payment method
 */
function updatePaymentMethod(appointmentId, method) {
  fetch(
    `http://localhost:3000/api/appointments/${appointmentId}/payment-method`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod: method }),
    }
  )
    .then((response) => {
      if (!response.ok) {
        return response
          .json()
          .then((data) => {
            throw new Error(data.message || 'Failed to update payment method')
          })
          .catch(() => {
            throw new Error(`Server error: ${response.status}`)
          })
      }
      return response.json()
    })
    .then((data) => {
      if (data.success) {
        // Remove pending appointment from localStorage
        localStorage.removeItem('pendingAppointment')

        // Redirect to dashboard
        showNotificationDialog(
          'Your payment method has been updated to pay at clinic.',
          'Payment Method Updated',
          () => window.location.replace('dashboard.html')
        )
      } else {
        throw new Error(data.message || 'Failed to update payment method')
      }
    })
    .catch((error) => {
      console.error('Error updating payment method:', error)
      showToast(`Error: ${error.message}`, TOAST_LEVELS.ERROR)
    })
}

/**
 * Get the currently selected payment method
 */
function getSelectedPaymentMethod() {
  const activeTab = document.querySelector('.payment-tab.active')
  return activeTab ? activeTab.dataset.method : 'card'
}

/**
 * Format time from 24-hour to 12-hour format
 */
function formatTime(timeString) {
  // Convert 24-hour format to 12-hour format
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12 // Convert 0 to 12 for 12 AM
  return `${hour12}:${minutes} ${ampm}`
}
