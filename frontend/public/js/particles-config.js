/**
 * Particles.js configuration
 * Controls the appearance and behavior of background particles
 */
document.addEventListener('DOMContentLoaded', function() {
  if (typeof particlesJS !== 'undefined') {
    particlesJS('particles-js', {
      particles: {
        number: {
          value: 50,
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
          value: 0.5,
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
          opacity: 0.4,
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
    });
    
    // Add particle masking for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
      const particlesCanvas = document.querySelector('#particles-js canvas');
      
      const updateParticlesMasking = () => {
        // When scrolling, check if hero section is in view
        const heroRect = hero.getBoundingClientRect();
        if (particlesCanvas && heroRect.bottom > 0) {
          // Hero is visible, apply CSS that hides particles in hero
          particlesCanvas.style.opacity = '0';
        } else {
          // Hero is scrolled out of view, show particles
          particlesCanvas.style.opacity = '1';
        }
      };
      
      // Initial check
      updateParticlesMasking();
      
      // Update on scroll
      window.addEventListener('scroll', updateParticlesMasking);
    }
  }
});
