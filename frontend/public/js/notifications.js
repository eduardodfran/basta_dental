/**
 * Global notification system for the BastaDental website
 * Provides toast notifications and modal dialogs as alternatives to alerts
 */

// Toast notification levels
const TOAST_LEVELS = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} level - The notification level (success, error, info, warning)
 * @param {number} duration - How long to show the notification in ms (default 3000)
 */
function showToast(message, level = TOAST_LEVELS.INFO, duration = 3000) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container')
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.id = 'toast-container'
    document.body.appendChild(toastContainer)

    // Add styles for the toast container
    toastContainer.style.position = 'fixed'
    toastContainer.style.top = '20px'
    toastContainer.style.right = '20px'
    toastContainer.style.zIndex = '1000'
    toastContainer.style.width = '350px'
  }

  // Create the toast element
  const toast = document.createElement('div')
  toast.className = `toast toast-${level}`
  toast.style.padding = '15px'
  toast.style.marginBottom = '10px'
  toast.style.borderRadius = '4px'
  toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'
  toast.style.animation = 'fadeIn 0.3s ease'
  toast.style.display = 'flex'
  toast.style.alignItems = 'center'
  toast.style.justifyContent = 'space-between'
  toast.style.opacity = '0'
  toast.style.transition = 'opacity 0.3s ease'

  // Set colors based on level
  switch (level) {
    case TOAST_LEVELS.SUCCESS:
      toast.style.backgroundColor = '#d4edda'
      toast.style.color = '#155724'
      toast.style.borderLeft = '5px solid #28a745'
      break
    case TOAST_LEVELS.ERROR:
      toast.style.backgroundColor = '#f8d7da'
      toast.style.color = '#721c24'
      toast.style.borderLeft = '5px solid #dc3545'
      break
    case TOAST_LEVELS.WARNING:
      toast.style.backgroundColor = '#fff3cd'
      toast.style.color = '#856404'
      toast.style.borderLeft = '5px solid #ffc107'
      break
    case TOAST_LEVELS.INFO:
    default:
      toast.style.backgroundColor = '#d1ecf1'
      toast.style.color = '#0c5460'
      toast.style.borderLeft = '5px solid #17a2b8'
      break
  }

  // Add icon based on level
  let icon = ''
  switch (level) {
    case TOAST_LEVELS.SUCCESS:
      icon = '<i class="fas fa-check-circle"></i> '
      break
    case TOAST_LEVELS.ERROR:
      icon = '<i class="fas fa-exclamation-circle"></i> '
      break
    case TOAST_LEVELS.WARNING:
      icon = '<i class="fas fa-exclamation-triangle"></i> '
      break
    case TOAST_LEVELS.INFO:
    default:
      icon = '<i class="fas fa-info-circle"></i> '
      break
  }

  // Message content
  const messageContent = document.createElement('div')
  messageContent.innerHTML = icon + message

  // Close button
  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '&times;'
  closeBtn.style.background = 'none'
  closeBtn.style.border = 'none'
  closeBtn.style.fontSize = '20px'
  closeBtn.style.cursor = 'pointer'
  closeBtn.style.marginLeft = '10px'
  closeBtn.style.opacity = '0.5'
  closeBtn.style.transition = 'opacity 0.3s'
  closeBtn.onmouseover = () => {
    closeBtn.style.opacity = '1'
  }
  closeBtn.onmouseout = () => {
    closeBtn.style.opacity = '0.5'
  }
  closeBtn.onclick = () => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300) // Remove after fade out
  }

  // Append elements to toast
  toast.appendChild(messageContent)
  toast.appendChild(closeBtn)

  // Add toast to container
  toastContainer.appendChild(toast)

  // Trigger fade in
  setTimeout(() => {
    toast.style.opacity = '1'
  }, 10)

  // Auto-close after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.opacity = '0'
        setTimeout(() => toast.remove(), 300)
      }
    }, duration)
  }
}

/**
 * Show a confirmation dialog
 * @param {string} message - The message to display
 * @param {Function} onConfirm - Callback function when confirmed
 * @param {Function} onCancel - Callback function when canceled
 * @param {string} confirmText - Text for the confirm button
 * @param {string} cancelText - Text for the cancel button
 */
function showConfirmDialog(
  message,
  onConfirm,
  onCancel = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
) {
  // Create modal backdrop
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.style.position = 'fixed'
  backdrop.style.top = '0'
  backdrop.style.left = '0'
  backdrop.style.width = '100%'
  backdrop.style.height = '100%'
  backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)'
  backdrop.style.zIndex = '1050'
  backdrop.style.display = 'flex'
  backdrop.style.justifyContent = 'center'
  backdrop.style.alignItems = 'center'

  // Create modal dialog
  const dialog = document.createElement('div')
  dialog.className = 'confirm-dialog'
  dialog.style.backgroundColor = 'white'
  dialog.style.borderRadius = '8px'
  dialog.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
  dialog.style.padding = '20px'
  dialog.style.maxWidth = '400px'
  dialog.style.width = '90%'
  dialog.style.animation = 'fadeIn 0.3s ease'

  // Message
  const messageEl = document.createElement('div')
  messageEl.innerHTML = message
  messageEl.style.marginBottom = '20px'

  // Button container
  const btnContainer = document.createElement('div')
  btnContainer.style.display = 'flex'
  btnContainer.style.justifyContent = 'flex-end'
  btnContainer.style.gap = '10px'

  // Cancel button
  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = cancelText
  cancelBtn.className = 'btn btn-secondary'
  cancelBtn.style.padding = '8px 16px'
  cancelBtn.style.border = 'none'
  cancelBtn.style.borderRadius = '4px'
  cancelBtn.style.cursor = 'pointer'
  cancelBtn.onclick = () => {
    document.body.removeChild(backdrop)
    if (onCancel) onCancel()
  }

  // Confirm button
  const confirmBtn = document.createElement('button')
  confirmBtn.textContent = confirmText
  confirmBtn.className = 'btn btn-primary'
  confirmBtn.style.padding = '8px 16px'
  confirmBtn.style.border = 'none'
  confirmBtn.style.borderRadius = '4px'
  confirmBtn.style.cursor = 'pointer'
  confirmBtn.onclick = () => {
    document.body.removeChild(backdrop)
    if (onConfirm) onConfirm()
  }

  // Append buttons
  btnContainer.appendChild(cancelBtn)
  btnContainer.appendChild(confirmBtn)

  // Append elements to dialog
  dialog.appendChild(messageEl)
  dialog.appendChild(btnContainer)

  // Append dialog to backdrop
  backdrop.appendChild(dialog)

  // Add to body
  document.body.appendChild(backdrop)
}

/**
 * Show a notification dialog (single button)
 * @param {string} message - The message to display
 * @param {string} title - Optional title for the notification
 * @param {Function} onClose - Callback function when closed
 * @param {string} buttonText - Text for the button
 */
function showNotificationDialog(
  message,
  title = null,
  onClose = null,
  buttonText = 'OK'
) {
  // Create modal backdrop
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.style.position = 'fixed'
  backdrop.style.top = '0'
  backdrop.style.left = '0'
  backdrop.style.width = '100%'
  backdrop.style.height = '100%'
  backdrop.style.backgroundColor = 'rgba(0,0,0,0.5)'
  backdrop.style.zIndex = '1050'
  backdrop.style.display = 'flex'
  backdrop.style.justifyContent = 'center'
  backdrop.style.alignItems = 'center'

  // Create modal dialog
  const dialog = document.createElement('div')
  dialog.className = 'notification-dialog'
  dialog.style.backgroundColor = 'white'
  dialog.style.borderRadius = '8px'
  dialog.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
  dialog.style.padding = '20px'
  dialog.style.maxWidth = '400px'
  dialog.style.width = '90%'
  dialog.style.animation = 'fadeIn 0.3s ease'

  // Title if provided
  if (title) {
    const titleEl = document.createElement('h3')
    titleEl.textContent = title
    titleEl.style.marginTop = '0'
    titleEl.style.marginBottom = '15px'
    dialog.appendChild(titleEl)
  }

  // Message
  const messageEl = document.createElement('div')
  messageEl.innerHTML = message
  messageEl.style.marginBottom = '20px'

  // Button container
  const btnContainer = document.createElement('div')
  btnContainer.style.display = 'flex'
  btnContainer.style.justifyContent = 'center'

  // OK button
  const okBtn = document.createElement('button')
  okBtn.textContent = buttonText
  okBtn.className = 'btn btn-primary'
  okBtn.style.padding = '8px 16px'
  okBtn.style.minWidth = '100px'
  okBtn.style.border = 'none'
  okBtn.style.borderRadius = '4px'
  okBtn.style.cursor = 'pointer'
  okBtn.onclick = () => {
    document.body.removeChild(backdrop)
    if (onClose) onClose()
  }

  // Append button to container
  btnContainer.appendChild(okBtn)

  // Append elements to dialog
  dialog.appendChild(messageEl)
  dialog.appendChild(btnContainer)

  // Append dialog to backdrop
  backdrop.appendChild(dialog)

  // Add to body
  document.body.appendChild(backdrop)
}
