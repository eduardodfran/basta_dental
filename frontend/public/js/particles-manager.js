/**
 * Particles.js Manager
 * Controls particles visibility and interaction
 */
document.addEventListener('DOMContentLoaded', function () {
  // Initialize particles
  if (typeof particlesJS !== 'undefined') {
    // Configure and initialize particles
    particlesJS('particles-js', {
      particles: {
        number: {
          value: 80, // Increase number of particles for more visibility
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: '#2a7db7',
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: 0.6, // Increase opacity for better visibility
          random: false,
        },
        size: {
          value: 3,
          random: true,
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: '#2a7db7',
          opacity: 0.5, // Increase line opacity
          width: 1,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: {
            enable: true,
            mode: 'grab',
          },
          onclick: {
            enable: true,
            mode: 'push',
          },
          resize: true,
        },
      },
      retina_detect: true,
    })

    // Get the particles canvas element
    const particlesCanvas = document.querySelector('#particles-js canvas')
    if (particlesCanvas) {
      // Make sure it's visible and properly positioned
      particlesCanvas.style.position = 'fixed'
      particlesCanvas.style.top = '0'
      particlesCanvas.style.left = '0'
      particlesCanvas.style.width = '100%'
      particlesCanvas.style.height = '100%'
      particlesCanvas.style.zIndex = '0'
      particlesCanvas.style.opacity = '1'

      // Handle hero section special case
      const heroSection = document.querySelector('.hero')
      if (heroSection) {
        // Check if user is in hero section
        const isInHero = () => {
          const heroRect = heroSection.getBoundingClientRect()
          // If hero section is in viewport, hide particles
          return heroRect.bottom > 0 && heroRect.top < window.innerHeight
        }

        // Function to update particles visibility
        const updateParticlesVisibility = () => {
          // Hide particles when in hero section
          particlesCanvas.style.opacity = isInHero() ? '0' : '1'
        }

        // Initial check
        updateParticlesVisibility()

        // Update on scroll
        window.addEventListener('scroll', updateParticlesVisibility)
      }
    }
  }
})
