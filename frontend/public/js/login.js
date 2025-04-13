// ...existing code...

async function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById('email').value
  const password = document.getElementById('password').value

  try {
    const response = await fetch(`${config.apiUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect based on user role
      if (data.user.role === 'admin') {
        window.location.href = '/admin/dashboard.html'
      } else if (data.user.role === 'dentist') {
        window.location.href = '/dentist/dashboard.html'
      } else {
        window.location.href = '/dashboard.html'
      }
    } else {
      showError(data.message || 'Login failed. Please check your credentials.')
    }
  } catch (error) {
    console.error('Login error:', error)
    showError('Unable to connect to the server. Please try again later.')
  }
}

function showError(message) {
  const errorElement = document.getElementById('error-message')
  if (errorElement) {
    errorElement.textContent = message
    errorElement.style.display = 'block'
  } else {
    alert(message)
  }
}

// ...existing code...
