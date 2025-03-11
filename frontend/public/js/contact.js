document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contact-form')
  const formStatus = document.getElementById('form-status')

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault()

      // Show loading state
      const submitButton = contactForm.querySelector('button[type="submit"]')
      submitButton.disabled = true
      submitButton.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Sending...'

      // Clear previous status message
      if (formStatus) {
        formStatus.textContent = ''
        formStatus.className = 'form-status'
      }

      // Collect form data
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        message: document.getElementById('message').value,
      }

      try {
        const response = await fetch('/api/contacts/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        const result = await response.json()

        if (response.ok) {
          // Success message
          let message =
            '<i class="fas fa-check-circle"></i> Thank you! Your message has been sent successfully.'

          // Handle test mode
          if (result.testMode) {
            message =
              '<i class="fas fa-info-circle"></i> Thank you! Your message was processed in test mode.'

            // Add preview link if available
            if (result.previewUrl) {
              message += `<div class="preview-link">View test email: 
                <a href="${result.previewUrl}" target="_blank">Click here <i class="fas fa-external-link-alt"></i></a>
              </div>`
              console.log('Test email preview at:', result.previewUrl)
            } else {
              message +=
                '<div class="preview-link">Email processed in log-only mode.</div>'
            }
          }

          if (formStatus) {
            formStatus.innerHTML = message
            formStatus.className = 'form-status success-message'
          }

          // Reset the form on success
          contactForm.reset()
        } else {
          // Error message
          if (formStatus) {
            formStatus.innerHTML =
              '<i class="fas fa-exclamation-triangle"></i> ' +
              (result.message || 'Something went wrong. Please try again.')
            formStatus.className = 'form-status error-message'
          }
        }
      } catch (error) {
        // Network error
        console.error('Form submission error:', error)
        if (formStatus) {
          formStatus.innerHTML =
            '<i class="fas fa-wifi"></i> Unable to connect to the server. Please try again later.'
          formStatus.className = 'form-status error-message'
        }
      } finally {
        // Reset button
        submitButton.disabled = false
        submitButton.innerHTML =
          '<i class="fas fa-paper-plane"></i> Send Message'
      }
    })
  }
})
