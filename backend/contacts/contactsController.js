import mailService from './contactsUtils.js'

/**
 * Simple contact controller
 */
const contactsController = {
  /**
   * Process contact form submission
   */
  submitContactForm: async (req, res) => {
    try {
      const { name, email, phone, message } = req.body
      console.log('Processing contact form submission from:', email)

      // Basic validation
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required',
        })
      }

      // Send email
      const emailResult = await mailService.sendContactEmail({
        name,
        email,
        phone,
        message,
      })

      // Determine response based on result
      const response = {
        success: true,
        message: 'Your message has been sent successfully!',
      }

      // Add test email info if applicable
      if (emailResult.isTestEmail) {
        response.testMode = true
        response.message = 'Your message was processed in test mode.'

        if (emailResult.previewUrl) {
          response.previewUrl = emailResult.previewUrl
        }
      }

      return res.status(200).json(response)
    } catch (error) {
      console.error('Contact form error:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to send your message. Please try again later.',
      })
    }
  },
}

export default contactsController
