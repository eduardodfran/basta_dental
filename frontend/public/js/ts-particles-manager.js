/**
 * tsParticles Manager
 * Controls the initialization and configuration of tsParticles
 * with special handling to hide particles in the hero section
 */
document.addEventListener('DOMContentLoaded', async function () {
  // Check if tsParticles is loaded
  if (typeof tsParticles !== 'undefined') {
    try {
      // Initialize tsParticles
      await tsParticles.load('particles-js', {
        fullScreen: {
          enable: false, // We're targeting a specific div, not full screen
          zIndex: 0, // Behind all content
        },
        fpsLimit: 120,
        particles: {
          color: {
            value: '#2a7db7',
          },
          links: {
            color: '#2a7db7',
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
          },
          move: {
            direction: 'none',
            enable: true,
            outModes: 'out',
            random: false,
            speed: 2,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80, // More particles for better visibility
          },
          opacity: {
            value: 0.7, // Increased opacity
          },
          shape: {
            type: 'circle',
          },
          size: {
            value: { min: 1, max: 5 },
          },
        },
        detectRetina: true,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: 'grab',
            },
            onClick: {
              enable: true,
              mode: 'push',
            },
          },
          modes: {
            grab: {
              distance: 140,
              links: {
                opacity: 1,
              },
            },
            push: {
              quantity: 4,
            },
          },
        },
      })

      console.log('tsParticles initialized successfully')

      // Get the particles container element
      const particlesContainer = document.getElementById('particles-js')

      // Special handling for hero section
      const heroSection = document.querySelector('.hero')

      if (particlesContainer && heroSection) {
        // Function to check if we're in the hero section and update visibility
        const updateParticlesVisibility = () => {
          const heroRect = heroSection.getBoundingClientRect()

          // Check if hero is in viewport
          const heroVisible =
            heroRect.bottom > 0 && heroRect.top < window.innerHeight

          if (heroVisible) {
            // Hide particles when in hero section
            particlesContainer.style.opacity = '0'
          } else {
            // Show particles when out of hero section
            particlesContainer.style.opacity = '1'
          }
        }

        // Set initial state
        updateParticlesVisibility()

        // Update on scroll
        window.addEventListener('scroll', updateParticlesVisibility)

        // Make sure particles container has the right styling
        particlesContainer.style.position = 'fixed'
        particlesContainer.style.width = '100%'
        particlesContainer.style.height = '100%'
        particlesContainer.style.top = '0'
        particlesContainer.style.left = '0'
        particlesContainer.style.zIndex = '0'
        particlesContainer.style.pointerEvents = 'none'
        particlesContainer.style.transition = 'opacity 0.3s ease' // Smooth transition
      }
    } catch (error) {
      console.error('Error initializing tsParticles:', error)
    }
  } else {
    console.error('tsParticles library not loaded')
  }
})
