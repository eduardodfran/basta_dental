document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contact-form')
  const formStatus = document.getElementById('form-status')
  const API_BASE_URL = 'http://localhost:3000/api' // Define base URL for backend

  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault()

      // Animate button during submission
      const submitButton = contactForm.querySelector('button[type="submit"]')
      const originalButtonText = submitButton.innerHTML
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
        timestamp: new Date().toISOString(),
      }

      try {
        const response = await fetch(`${API_BASE_URL}/contacts/submit`, {
          // Use absolute URL
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        // Check if the response is OK *before* trying to parse JSON
        if (!response.ok) {
          // Attempt to get error details, but handle cases where it's not JSON
          let errorData = { message: `HTTP error! status: ${response.status}` }
          try {
            errorData = await response.json()
          } catch (jsonError) {
            console.warn('Could not parse error response as JSON:', jsonError)
            // Use the status text if available, otherwise the generic message
            errorData.message = response.statusText || errorData.message
          }
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          )
        }

        const result = await response.json() // Now safe to parse

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
            formStatus.style.opacity = '0'
            formStatus.style.display = 'block'

            // Animate the message appearance
            setTimeout(() => {
              formStatus.style.transition = 'opacity 0.5s ease'
              formStatus.style.opacity = '1'
            }, 100)

            // Fade out the success message after some time
            setTimeout(() => {
              formStatus.style.opacity = '0'
              setTimeout(() => {
                formStatus.style.display = 'none'
              }, 500)
            }, 8000)
          }

          // Reset the form on success
          contactForm.reset()

          // For demo purposes, show a preview link
          const previewDiv = document.createElement('div')
          previewDiv.className = 'preview-link'
          previewDiv.innerHTML = `<p>Demo mode: Your message was not actually sent.</p>
                                      <p>Name: ${formData.name}<br>
                                      Email: ${formData.email}<br>
                                      Phone: ${
                                        formData.phone || 'Not provided'
                                      }<br>
                                      Message: ${formData.message}</p>`
          formStatus.appendChild(previewDiv)
        } else {
          // Error message
          if (formStatus) {
            formStatus.innerHTML =
              '<i class="fas fa-exclamation-triangle"></i> ' +
              (result.message || 'Something went wrong. Please try again.')
            formStatus.className = 'form-status error-message'
            formStatus.style.opacity = '0'
            formStatus.style.display = 'block'

            setTimeout(() => {
              formStatus.style.transition = 'opacity 0.5s ease'
              formStatus.style.opacity = '1'
            }, 100)
          }
        }
      } catch (error) {
        // Network error or error thrown from !response.ok block
        console.error('Form submission error:', error)
        if (formStatus) {
          formStatus.innerHTML =
            '<i class="fas fa-exclamation-triangle"></i> ' +
            (error.message || 'Unable to send message. Please try again later.')
          formStatus.className = 'form-status error-message'
          formStatus.style.opacity = '0'
          formStatus.style.display = 'block'

          setTimeout(() => {
            formStatus.style.transition = 'opacity 0.5s ease'
            formStatus.style.opacity = '1'
          }, 100)
        }
      } finally {
        // Reset button
        submitButton.disabled = false
        submitButton.innerHTML = originalButtonText
      }
    })
  }
})
