// Theme Manager
document.addEventListener('DOMContentLoaded', function () {
  // Initialize theme based on local storage or system preference
  const themeToggleBtn = document.createElement('button')
  themeToggleBtn.className = 'theme-toggle'
  themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>'
  themeToggleBtn.setAttribute('aria-label', 'Toggle dark mode')
  document.body.appendChild(themeToggleBtn)

  const currentTheme = localStorage.getItem('theme')

  // Check if theme preference exists in localStorage
  if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme)
    updateThemeIcon(currentTheme)
  } else {
    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
      updateThemeIcon('dark')
    }
  }

  // Theme toggle event listener
  themeToggleBtn.addEventListener('click', function () {
    this.classList.add('animate')

    let theme = 'light'
    if (document.documentElement.getAttribute('data-theme') === 'light') {
      theme = 'dark'
    }

    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
    updateThemeIcon(theme)

    setTimeout(() => {
      this.classList.remove('animate')
    }, 500)
  })

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>'
    } else {
      themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>'
    }
  }

  // Listen for system preference changes
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        const newTheme = e.matches ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', newTheme)
        localStorage.setItem('theme', newTheme)
        updateThemeIcon(newTheme)
      })
  }
})
