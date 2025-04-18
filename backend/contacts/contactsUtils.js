import nodemailer from 'nodemailer'
import dotenv from 'dotenv' // Keep the import
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure correct path to .env when running from any directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Mail Service for handling email sending functionality
 */
class MailService {
  constructor() {
    // Constructor no longer creates transporter immediately
    this.transporter = null
    this.testAccount = null
    this.isInitializing = false // Flag to prevent race conditions
    console.log(
      'MailService instance created. Transporter will be initialized on first use.'
    )
  }

  /**
   * Initialize the transporter based on environment variables.
   * This will be called internally when the transporter is needed.
   */
  async initializeTransporter() {
    // Prevent multiple initializations if called concurrently
    if (this.isInitializing) {
      console.log(
        'MailService transporter initialization already in progress...'
      )
      // Wait a bit for initialization to complete - simple polling
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (!this.transporter) {
        // Check again after waiting
        console.error('MailService transporter still not ready after waiting.')
        throw new Error('Mail transporter initialization failed.')
      }
      return // Already initialized or being initialized
    }
    if (this.transporter) {
      return // Already initialized
    }

    this.isInitializing = true
    console.log('Initializing MailService transporter...')
    console.log(
      `- Checking MAIL_USER: ${process.env.MAIL_USER ? 'Set' : 'Not set'}`
    )
    console.log(
      `- Checking MAIL_PASSWORD: ${
        process.env.MAIL_PASSWORD ? 'Set' : 'Not set'
      }`
    )

    const useTestAccount = !process.env.MAIL_USER || !process.env.MAIL_PASSWORD

    try {
      if (useTestAccount) {
        console.log(
          'Email credentials missing or incomplete - creating Ethereal test account...'
        )
        await this.createTestAccount()
      } else {
        console.log('Using provided email credentials.')
        await this.createGmailTransporter() // Make it async to handle verify
      }
    } catch (error) {
      console.error('Error during transporter initialization:', error)
      // Fallback or rethrow as needed
      if (!this.transporter) {
        // If transporter wasn't set due to error
        console.log(
          'Falling back to log-only transporter due to initialization error.'
        )
        this.createLogOnlyTransporter()
      }
    } finally {
      this.isInitializing = false
    }
  }

  /**
   * Get the transporter, initializing it if necessary.
   */
  async getTransporter() {
    if (!this.transporter && !this.isInitializing) {
      await this.initializeTransporter()
    } else if (this.isInitializing) {
      // If initialization is happening, wait for it
      await this.initializeTransporter()
    }
    if (!this.transporter) {
      // If still no transporter after attempting init, throw error
      throw new Error('Mail transporter could not be initialized.')
    }
    return this.transporter
  }

  /**
   * Create Gmail transporter (make it async to await verify)
   */
  async createGmailTransporter() {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      console.error(
        'Cannot create Gmail transporter: MAIL_USER or MAIL_PASSWORD not set.'
      )
      throw new Error('Missing Gmail credentials') // Throw error instead of falling back here
    }

    console.log('Setting up Gmail transport...')
    const mailPort = parseInt(process.env.MAIL_PORT || '465', 10)
    const mailSecure = process.env.MAIL_SECURE === 'true'

    // Clean up console logging - only show essential info
    console.log(
      `Using mail config: ${process.env.MAIL_USER} via ${process.env.MAIL_HOST}:${mailPort}`
    )

    // Configure transporter with debug disabled for cleaner logs
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // Use predefined 'gmail' service
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      // Disable debug output
      debug: false,
      logger: false,
    })

    try {
      console.log('Verifying Gmail SMTP connection...')
      await this.transporter.verify()
      console.log('✅ Gmail SMTP server ready')
    } catch (error) {
      console.error(
        '❌ Gmail SMTP connection verification error:',
        error.message
      )

      // Additional helpful diagnostics but more concise
      if (error.code === 'EAUTH') {
        console.error(
          'Authentication failed - check Gmail credentials and app password'
        )
      } else if (error.code === 'ESOCKET') {
        console.error('Socket error - check connection and port settings')
      } else if (error.code === 'ECONNECTION') {
        console.error('Connection error - verify host settings and network')
      }

      this.transporter = null // Reset transporter on verification failure
      throw error // Re-throw error to be caught by initializeTransporter
    }
  }

  /**
   * Create test account
   */
  async createTestAccount() {
    try {
      console.log('Creating Ethereal test account...')
      const testAccount = await nodemailer.createTestAccount()
      console.log('Ethereal Test account created:', testAccount.user)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      })
      this.testAccount = testAccount
      console.log('Ethereal test email setup complete.')
    } catch (error) {
      console.error('Error creating Ethereal test account:', error)
      this.transporter = null // Reset transporter
      throw error // Re-throw error
    }
  }

  /**
   * Create a transporter that only logs emails
   */
  createLogOnlyTransporter() {
    console.log('Creating log-only email transport')
    this.transporter = {
      sendMail: (mailOptions) => {
        return new Promise((resolve) => {
          console.log('\n--- EMAIL WOULD BE SENT (LOG-ONLY) ---')
          console.log('From:', mailOptions.from)
          console.log('To:', mailOptions.to)
          console.log('Subject:', mailOptions.subject)
          console.log(
            'Content:',
            mailOptions.text
              ? mailOptions.text.substring(0, 200) + '...'
              : '(No text content)'
          )
          console.log('--- END OF EMAIL ---\n')

          resolve({
            messageId: 'log-' + Date.now(),
            isLog: true,
          })
        })
      },
    }
  }

  /**
   * Send contact form email
   */
  async sendContactEmail(contactData) {
    const transporter = await this.getTransporter() // Get transporter, initializes if needed
    const { name, email, phone, message } = contactData
    let recipient = process.env.MAIL_RECIPIENT || 'franeduardo306@gmail.com'
    let senderEmail =
      process.env.MAIL_SENDER ||
      process.env.MAIL_USER ||
      'fallback_sender@example.com'
    let sender = `"DentalCare Website" <${senderEmail}>`

    if (this.testAccount) {
      recipient = this.testAccount.user
      sender = `"DentalCare Test" <${this.testAccount.user}>`
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Message</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #2a7db7;
            color: white;
            padding: 20px;
            text-align: center;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            margin: -20px -20px 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 20px 0;
          }
          .content-item {
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 15px;
          }
          .content-item:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: bold;
            color: #2a7db7;
            display: block;
            margin-bottom: 5px;
          }
          .value {
            margin: 0;
          }
          .message-content {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #2a7db7;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="content-item">
              <span class="label">Name:</span>
              <p class="value">${name}</p>
            </div>
            <div class="content-item">
              <span class="label">Email:</span>
              <p class="value"><a href="mailto:${email}">${email}</a></p>
            </div>
            <div class="content-item">
              <span class="label">Phone:</span>
              <p class="value">${phone || 'Not provided'}</p>
            </div>
            <div class="content-item">
              <span class="label">Message:</span>
              <div class="message-content">
                <p class="value">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from the DentalCare website contact form on ${new Date().toLocaleString()}</p>
            <p>If you wish to reply, please respond directly to the sender's email address.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: sender,
      to: recipient,
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone || 'Not provided'}
Message: ${message}

This email was sent from the DentalCare website contact form.
      `,
      html: htmlContent,
    }

    try {
      console.log(`Sending contact email to: ${recipient} from: ${senderEmail}`)
      const info = await transporter.sendMail(mailOptions) // Use the obtained transporter

      let previewUrl = null
      if (this.testAccount && info.messageId) {
        previewUrl = nodemailer.getTestMessageUrl(info)
        console.log('Ethereal test email sent! Preview URL:', previewUrl)
      } else if (info.isLog) {
        console.log('Log-only email "sent"')
      } else {
        console.log('Email sent successfully:', info.messageId)
      }
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl,
        isTestEmail: !!this.testAccount || !!info.isLog,
      }
    } catch (error) {
      console.error('Contact Email sending error:', error)
      throw error
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(recipientEmail, token, name = 'User') {
    const transporter = await this.getTransporter() // Get transporter, initializes if needed

    // Token masking for security in logs
    const maskedToken =
      token.substring(0, 8) + '...' + token.substring(token.length - 4)

    // Fix the resetLink URL to point to your actual server URL (not localhost:5500)
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000'
    const resetLink = `${serverUrl}/reset-password.html?token=${token}`

    let senderEmail =
      process.env.MAIL_SENDER ||
      process.env.MAIL_USER ||
      'fallback_sender@example.com'
    let sender = `"BastaDental Support" <${senderEmail}>`

    if (this.testAccount) {
      sender = `"BastaDental Test Support" <${this.testAccount.user}>`
      console.log(`Using Ethereal sender: ${sender}`)
    } else {
      console.log(`Using configured sender: ${sender}`)
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
          .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #2a7db7; color: white; padding: 15px 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; margin: -20px -20px 20px; }
          .header h1 { margin: 0; font-size: 22px; }
          .content { padding: 10px 0; }
          p { margin-bottom: 15px; }
          .button { display: inline-block; background-color: #2a7db7; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center; }
          .button:hover { background-color: #216ca3; }
          .link-container { text-align: center; margin: 25px 0; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello ${name},</p>
            <p>We received a request to reset the password for your BastaDental account associated with this email address.</p>
            <p>If you made this request, please click the button below to set a new password. This link will expire in 1 hour.</p>
            <div class="link-container">
              <a href="${resetLink}" class="button">Reset Your Password</a>
            </div>
            <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Alternatively, you can copy and paste the following link into your browser:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BastaDental. All rights reserved.</p>
            <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: sender,
      to: recipientEmail,
      subject: 'Reset Your BastaDental Password',
      text: `Hello ${name},\n\nYou requested a password reset. Click the link below or copy and paste it into your browser. This link expires in 1 hour.\n\n${resetLink}\n\nIf you didn't request this, please ignore this email.\n\nThanks,\nThe BastaDental Team`,
      html: htmlContent,
    }

    try {
      console.log(`Sending password reset email to: ${recipientEmail}`)
      const info = await transporter.sendMail(mailOptions) // Use the obtained transporter

      let previewUrl = null
      if (this.testAccount && info.messageId) {
        previewUrl = nodemailer.getTestMessageUrl(info)
        console.log('Ethereal test email sent! Preview URL:', previewUrl)
      } else if (info.isLog) {
        console.log('Log-only password reset email "sent"')
      } else {
        console.log(
          `✅ Password reset email sent successfully (message ID: ${info.messageId.substring(
            0,
            12
          )}...)`
        )
      }
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl,
        isTestEmail: !!this.testAccount || !!info.isLog,
      }
    } catch (error) {
      console.error('❌ Password reset email sending error:', error.message)
      throw new Error(`Failed to send password reset email: ${error.message}`)
    }
  }
}

// Create a singleton instance (constructor does less work now)
const mailService = new MailService()

export default mailService
