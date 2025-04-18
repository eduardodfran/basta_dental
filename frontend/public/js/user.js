document.addEventListener('DOMContentLoaded', function () {
  // Get elements
  const loginBtn = document.querySelector('.login-btn')
  const signupBtn = document.querySelector('.signup-btn')
  const loginForm = document.getElementById('login-form')
  const signupForm = document.getElementById('signup-form')
  const forgotPasswordForm = document.getElementById('forgot-password-form')
  const resetPasswordForm = document.getElementById('reset-password-form')
  const feedbackMessage = document.getElementById('feedback-message')

  // Define the backend API URL
  const API_URL = 'http://localhost:3000/api' // Base API URL

  // Add toggle password visibility functionality
  setupPasswordToggles()

  // Toggle between login and signup forms
  if (loginBtn && signupBtn) {
    loginBtn.addEventListener('click', function () {
      loginBtn.style.backgroundColor = '#2a7db7'
      loginBtn.style.color = 'white'
      signupBtn.style.backgroundColor = '#f0f0f0'
      signupBtn.style.color = '#333'
      loginForm.style.display = 'flex'
      signupForm.style.display = 'none'
    })

    signupBtn.addEventListener('click', function () {
      signupBtn.style.backgroundColor = '#2a7db7'
      signupBtn.style.color = 'white'
      loginBtn.style.backgroundColor = '#f0f0f0'
      loginBtn.style.color = '#333'
      signupForm.style.display = 'flex'
      loginForm.style.display = 'none'
    })
  }

  // Function to setup password toggle visibility for all password fields
  function setupPasswordToggles() {
    // Find all password toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-password')

    toggleButtons.forEach((button) => {
      button.addEventListener('click', function (e) {
        e.preventDefault()

        // Find the password input that this button toggles
        const passwordInput = this.previousElementSibling

        // Toggle between password and text type
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text'
          this.innerHTML = '<i class="fas fa-eye-slash"></i>'
          this.setAttribute('title', 'Hide password')
        } else {
          passwordInput.type = 'password'
          this.innerHTML = '<i class="fas fa-eye"></i>'
          this.setAttribute('title', 'Show password')
        }
      })
    })
  }

  // Function to show feedback message
  function showFeedback(message, type = 'info', autoHide = false) {
    if (!feedbackMessage) return

    // Clear any existing classes and set new ones
    feedbackMessage.className = 'feedback-message'
    feedbackMessage.classList.add(type)

    // Set message content with icon
    let icon = ''
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle"></i> '
        break
      case 'error':
        icon = '<i class="fas fa-exclamation-circle"></i> '
        break
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle"></i> '
        break
      default:
        icon = '<i class="fas fa-info-circle"></i> '
        break
    }

    feedbackMessage.innerHTML = icon + message
    feedbackMessage.classList.add('show')

    // Auto-hide after 5 seconds if requested
    if (autoHide) {
      setTimeout(() => {
        feedbackMessage.classList.remove('show')
      }, 5000)
    }
  }

  // Function to show button loading state
  function setButtonLoading(button, isLoading) {
    const textSpan = button.querySelector('.btn-text')
    const loaderSpan = button.querySelector('.btn-loader')

    if (isLoading) {
      button.disabled = true
      if (textSpan) textSpan.style.display = 'none'
      if (loaderSpan) loaderSpan.style.display = 'inline-block'
    } else {
      button.disabled = false
      if (textSpan) textSpan.style.display = 'inline-block'
      if (loaderSpan) loaderSpan.style.display = 'none'
    }
  }

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault()
      const email = document.querySelector('#login-email').value
      const password = document.querySelector('#login-password').value
      const submitButton = loginForm.querySelector('button[type="submit"]')

      // Show loading state
      setButtonLoading(submitButton, true)

      // Clear previous feedback
      showFeedback('Logging in... Please wait.', 'info')

      fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
        .then((response) => {
          if (!response.ok) {
            const statusCode = response.status

            if (statusCode === 401) {
              throw new Error('Invalid email or password')
            } else if (statusCode === 400) {
              throw new Error('Please provide both email and password')
            } else {
              return response
                .json()
                .then((errData) => {
                  throw new Error(
                    errData.message ||
                      `Server error (${response.status}). Please try again.`
                  )
                })
                .catch(() => {
                  throw new Error(
                    `Server error (${response.status}). Please try again.`
                  )
                })
            }
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user))

            // Show success message
            showFeedback('Login successful! Redirecting...', 'success')

            // Redirect after a brief delay
            setTimeout(() => {
              window.location.href = 'dashboard.html'
            }, 1500)
          } else {
            showFeedback(
              data.message || 'Login failed. Please try again.',
              'error'
            )
          }
        })
        .catch((error) => {
          console.error('Error:', error)
          showFeedback(
            error.message || 'An error occurred. Please try again later.',
            'error'
          )
        })
        .finally(() => {
          // Reset loading state
          setButtonLoading(submitButton, false)
        })
    })
  }

  // Handle signup form submission
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault()
      const name = document.querySelector('#signup-name').value
      const email = document.querySelector('#signup-email').value
      const password = document.querySelector('#signup-password').value
      const dob = document.querySelector('#signup-dob').value
      const phone = document.querySelector('#signup-phone').value
      const gender = document.querySelector('#signup-gender').value
      const address = document.querySelector('#signup-address').value
      const submitButton = signupForm.querySelector('button[type="submit"]')

      // Validate form data
      if (!validateForm()) {
        return
      }

      // Show loading state
      setButtonLoading(submitButton, true)

      // Show initial feedback
      showFeedback('Creating your account... Please wait.', 'info')

      fetch(`${API_URL}/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          dob,
          phone,
          gender,
          address,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            const statusCode = response.status

            if (statusCode === 400) {
              return response
                .json()
                .then((data) => {
                  throw new Error(
                    data.message || 'Invalid data. Please check your form.'
                  )
                })
                .catch(() => {
                  throw new Error(
                    `Server error (${response.status}). Please try again.`
                  )
                })
            } else if (statusCode === 409) {
              throw new Error(
                'Email is already in use. Please use a different email.'
              )
            } else {
              throw new Error(`Server error (${statusCode}). Please try again.`)
            }
          }
          return response.json()
        })
        .then((data) => {
          if (data.success) {
            // Show success message
            showFeedback(
              'Account created successfully! You can now log in.',
              'success'
            )

            // Reset the form
            signupForm.reset()

            // Switch to login form or redirect after delay
            if (loginBtn) {
              setTimeout(() => loginBtn.click(), 2000)
            } else {
              setTimeout(() => {
                window.location.href = 'login.html'
              }, 2000)
            }
          } else {
            showFeedback(
              data.message || 'Registration failed. Please try again.',
              'error'
            )
          }
        })
        .catch((error) => {
          console.error('Error:', error)
          showFeedback(
            error.message || 'An error occurred. Please try again later.',
            'error'
          )
        })
        .finally(() => {
          // Reset loading state
          setButtonLoading(submitButton, false)
        })
    })
  }

  // Handle Forgot Password form submission
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function (e) {
      e.preventDefault()
      const email = document.getElementById('forgot-email').value
      const submitButton = forgotPasswordForm.querySelector(
        'button[type="submit"]'
      )

      setButtonLoading(submitButton, true)
      showFeedback('Sending reset link...', 'info')

      fetch(`${API_URL}/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
        .then((response) => response.json())
        .then((data) => {
          showFeedback(data.message, data.success ? 'success' : 'error')
          if (data.success) {
            forgotPasswordForm.reset()
          }
        })
        .catch((error) => {
          console.error('Forgot Password Error:', error)
          showFeedback('An error occurred. Please try again later.', 'error')
        })
        .finally(() => {
          setButtonLoading(submitButton, false)
        })
    })
  }

  // Handle Reset Password form submission
  if (resetPasswordForm) {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const tokenInput = document.getElementById('reset-token')

    if (token && tokenInput) {
      tokenInput.value = token
    } else if (tokenInput) {
      showFeedback(
        'Invalid or missing password reset link. Please request a new one.',
        'error'
      )
      resetPasswordForm
        .querySelectorAll('input, button')
        .forEach((el) => (el.disabled = true))
    }

    resetPasswordForm.addEventListener('submit', function (e) {
      e.preventDefault()
      const storedToken = document.getElementById('reset-token').value
      const password = document.getElementById('reset-password').value
      const confirmPassword = document.getElementById(
        'reset-confirm-password'
      ).value
      const submitButton = resetPasswordForm.querySelector(
        'button[type="submit"]'
      )

      if (!storedToken) {
        showFeedback('Invalid reset request. No token found.', 'error')
        return
      }

      if (password !== confirmPassword) {
        showFeedback('Passwords do not match.', 'error')
        return
      }

      if (password.length < 6) {
        showFeedback('Password must be at least 6 characters long.', 'error')
        return
      }

      setButtonLoading(submitButton, true)
      showFeedback('Resetting password...', 'info')

      fetch(`${API_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedToken, password, confirmPassword }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showFeedback(
              'Password reset successfully! Redirecting to login...',
              'success'
            )
            resetPasswordForm.reset()
            setTimeout(() => {
              window.location.href = 'login.html'
            }, 2500)
          } else {
            showFeedback(
              data.message || 'Failed to reset password. Please try again.',
              'error'
            )
          }
        })
        .catch((error) => {
          console.error('Reset Password Error:', error)
          showFeedback('An error occurred. Please try again later.', 'error')
        })
        .finally(() => {
          setButtonLoading(submitButton, false)
        })
    })
  }

  // Form validation function
  function validateForm() {
    let isValid = true
    let errorMessage = ''

    // Get form field values if we're on the signup form
    if (signupForm) {
      const name = document.querySelector('#signup-name').value.trim()
      const email = document.querySelector('#signup-email').value.trim()
      const password = document.querySelector('#signup-password').value
      const dob = document.querySelector('#signup-dob').value

      // Validate name
      if (!name) {
        errorMessage = 'Please enter your name'
        isValid = false
      }
      // Validate email format
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorMessage = 'Please enter a valid email address'
        isValid = false
      }
      // Validate password length
      else if (password.length < 6) {
        errorMessage = 'Password must be at least 6 characters long'
        isValid = false
      }
      // Validate date of birth
      else if (!dob) {
        errorMessage = 'Please enter your date of birth'
        isValid = false
      }
    }

    // Display error message if validation failed
    if (!isValid) {
      showFeedback(errorMessage, 'error')
    }

    return isValid
  }
})
