/**
 * Login/Sign-in Page tsParticles Configuration
 * Different style than the homepage particles
 */
document.addEventListener('DOMContentLoaded', async function () {
  // Check if tsParticles is loaded and if the container exists
  if (
    typeof tsParticles !== 'undefined' &&
    document.getElementById('login-particles')
  ) {
    try {
      // Initialize tsParticles with a different configuration for login page
      await tsParticles.load('login-particles', {
        fullScreen: {
          enable: false,
          zIndex: 0,
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: 50,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: '#4e85c5', // Different color than homepage
          },
          shape: {
            type: 'circle',
          },
          opacity: {
            value: 0.6,
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.1,
              sync: false,
            },
          },
          size: {
            value: 3,
            random: true,
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 0.1,
              sync: false,
            },
          },
          links: {
            enable: true,
            distance: 150,
            color: '#4e85c5',
            opacity: 0.4,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: true,
            straight: false,
            outMode: 'out',
            bounce: false,
            attract: {
              enable: false,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detectOn: 'canvas',
          events: {
            onHover: {
              enable: true,
              mode: 'bubble',
            },
            onClick: {
              enable: true,
              mode: 'push',
            },
            resize: true,
          },
          modes: {
            bubble: {
              distance: 150,
              size: 6,
              duration: 2,
              opacity: 0.8,
              speed: 3,
            },
            push: {
              quantity: 4,
            },
          },
        },
        detectRetina: true,
      })

      console.log('Login page particles initialized successfully')
    } catch (error) {
      console.error('Error initializing login page particles:', error)
    }
  } else {
    console.warn('tsParticles or login-particles container not found')
  }
})
