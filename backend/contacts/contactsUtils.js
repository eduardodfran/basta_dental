import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure correct path to .env when running from any directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables with absolute path - fix path to be in backend folder directly
const envPath = path.resolve(__dirname, '../.env')
console.log('Loading .env file from:', envPath)
dotenv.config({ path: envPath })

/**
 * Mail Service for handling email sending functionality
 */
class MailService {
  constructor() {
    // Print available environment variables (without sensitive data)
    console.log('Environment variables loaded:')
    console.log('- PORT:', process.env.PORT)
    console.log('- MAIL_USER:', process.env.MAIL_USER ? 'Set' : 'Not set')
    console.log(
      '- MAIL_PASSWORD:',
      process.env.MAIL_PASSWORD ? 'Set' : 'Not set'
    )
    console.log('- MAIL_SENDER:', process.env.MAIL_SENDER ? 'Set' : 'Not set')
    console.log(
      '- MAIL_RECIPIENT:',
      process.env.MAIL_RECIPIENT ? 'Set' : 'Not set'
    )

    this.useTestAccount = !process.env.MAIL_USER || !process.env.MAIL_PASSWORD

    if (this.useTestAccount) {
      console.log('Email credentials missing - will create test account')
      this.createTestAccount()
    } else {
      this.createGmailTransporter()
    }
  }

  /**
   * Create Gmail transporter
   */
  createGmailTransporter() {
    console.log(
      'Setting up Gmail transport with account:',
      process.env.MAIL_USER
    )

    // Use more specific Gmail SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 465,
      secure: process.env.MAIL_SECURE === 'true' ? true : false, // true for port 465
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Accept all certificates temporarily for troubleshooting
      },
    })

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Gmail SMTP connection error:', error)
        console.log('Error details:', JSON.stringify(error, null, 2))
        console.log('Falling back to test account...')
        this.createTestAccount()
      } else {
        console.log('Gmail SMTP server is ready to send messages')
      }
    })
  }

  /**
   * Create test account
   */
  async createTestAccount() {
    try {
      console.log('Creating Ethereal test account...')
      const testAccount = await nodemailer.createTestAccount()

      console.log('Test account created:', testAccount.user)

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
      console.log('Test email setup complete')
    } catch (error) {
      console.error('Error creating test account:', error)
      this.createLogOnlyTransporter()
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
          console.log('\n--- EMAIL WOULD BE SENT ---')
          console.log('From:', mailOptions.from)
          console.log('To:', mailOptions.to)
          console.log('Subject:', mailOptions.subject)
          console.log('Content:', mailOptions.text)
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
    const { name, email, phone, message } = contactData

    // Get recipient from .env (dental office email) or use default
    let recipient = process.env.MAIL_RECIPIENT || 'franeduardo306@gmail.com'

    // Get sender from .env (sender email) or use default
    let senderEmail = process.env.MAIL_SENDER || 'franeduardo305@gmail.com'
    let sender = `"DentalCare Website" <${senderEmail}>`

    // For test accounts, use ethereal
    if (this.testAccount) {
      recipient = this.testAccount.user
      sender = `"DentalCare Test" <${this.testAccount.user}>`
    }

    // Create well-styled HTML email
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
      console.log(`Sending email to: ${recipient} from: ${senderEmail}`)
      const info = await this.transporter.sendMail(mailOptions)

      // Handle test account preview URL
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
      console.error('Email sending error:', error)
      throw error
    }
  }
}

// Create a singleton instance
const mailService = new MailService()

export default mailService
