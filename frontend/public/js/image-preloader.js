/**
 * Image preloader utility
 * Preloads important images to ensure smooth transitions and animations
 */
document.addEventListener('DOMContentLoaded', function () {
  // List of images to preload
  const imagesToPreload = [
    'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1590424693420-704dfb6094ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80',
  ]

  // Preload each image
  imagesToPreload.forEach((src) => {
    const img = new Image()
    img.src = src
  })

  // Add a subtle loading indicator
  const body = document.querySelector('body')
  body.classList.add('images-loading')

  // Remove loading class when all critical images are loaded
  window.addEventListener('load', function () {
    body.classList.remove('images-loading')
    body.classList.add('images-loaded')
  })
})
