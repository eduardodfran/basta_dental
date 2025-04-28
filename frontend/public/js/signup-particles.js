/**
 * Signup Page tsParticles Configuration
 * Different style from both the homepage and login page particles
 */
document.addEventListener('DOMContentLoaded', async function () {
  // Check if tsParticles is loaded and if the container exists
  if (
    typeof tsParticles !== 'undefined' &&
    document.getElementById('signup-particles')
  ) {
    try {
      // Initialize tsParticles with a unique configuration for signup page
      await tsParticles.load('signup-particles', {
        fullScreen: {
          enable: false,
          zIndex: 0,
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: '#50c878', // Emerald green color
          },
          shape: {
            type: ['circle', 'triangle', 'polygon'],
            options: {
              polygon: {
                sides: 6,
              },
            },
          },
          opacity: {
            value: 0.5,
            random: true,
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.1,
              sync: false,
            },
          },
          size: {
            value: 4,
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
            distance: 125,
            color: '#50c878',
            opacity: 0.4,
            width: 1,
            triangles: {
              enable: true,
              opacity: 0.1,
            },
          },
          move: {
            enable: true,
            speed: 0.8,
            direction: 'none',
            random: true,
            straight: false,
            outMode: 'bounce',
            bounce: true,
            attract: {
              enable: true,
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
              mode: 'connect',
            },
            onClick: {
              enable: true,
              mode: 'repulse',
            },
            resize: true,
          },
          modes: {
            connect: {
              distance: 150,
              radius: 120,
              links: {
                opacity: 0.5,
              },
            },
            repulse: {
              distance: 150,
              duration: 0.4,
            },
          },
        },
        detectRetina: true,
      })

      console.log('Signup page particles initialized successfully')
    } catch (error) {
      console.error('Error initializing signup page particles:', error)
    }
  } else {
    console.warn('tsParticles or signup-particles container not found')
  }
})
