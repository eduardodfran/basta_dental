# Email Setup Guide for BastaDental

## Setting up Gmail for SMTP Access

To use Gmail as the email sender for your application, follow these steps:

### 1. Enable 2-Step Verification

1. Go to your Google Account at https://myaccount.google.com/
2. Select "Security" from the left menu
3. Under "Signing in to Google," select "2-Step Verification" and turn it ON
4. Follow the steps to enable 2-Step Verification

### 2. Generate an App Password

1. Go to your Google Account at https://myaccount.google.com/
2. Select "Security" from the left menu
3. Under "Signing in to Google," select "2-Step Verification"
4. At the bottom, select "App passwords"
5. Click "Select app" and choose "Other (Custom name)"
6. Enter "BastaDental" or another recognizable name
7. Click "Generate"
8. Google will display a 16-character password (with spaces)
9. Copy this password - you'll need it for the next step

### 3. Update Your `.env` File

1. Open your `.env` file
2. Update the email configuration section:
   ```
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=465
   MAIL_SECURE=true
   MAIL_USER=your-email@gmail.com
   MAIL_PASSWORD=your-app-password-here
   MAIL_SENDER=your-email@gmail.com
   MAIL_RECIPIENT=recipient-email@gmail.com
   ```
3. Replace "your-email@gmail.com" with your actual Gmail address
4. Replace "your-app-password-here" with the app password generated in step 2
5. Save the file

### 4. Restart Your Application

1. Stop your application if it's running
2. Start it again with `npm start` or `node server.js`

### Common Issues

#### Authentication Failed

If you see "Username and Password not accepted" errors:

- Make sure 2-Step Verification is enabled
- Generate a fresh App Password
- Use the App Password exactly as Google provides it (spaces are fine)
- Regular Gmail passwords won't work if 2-Step Verification is enabled

#### Gmail Security Blocks

If emails are not sending despite correct credentials:

1. Check your Gmail account for security alerts
2. Visit https://myaccount.google.com/security-checkup
3. Look for "Less secure app access" or security alerts
4. Google may have blocked the connection as suspicious

#### Email Not Received

If the server shows success but no email arrives:

1. Check spam/junk folders
2. Verify the recipient email address is correct
3. Try sending to a different email provider (e.g., Outlook, Yahoo)

## Switching to Ethereal Test Email

If you want to use Ethereal for testing instead of real emails:

1. Open your `.env` file
2. Comment out or remove the Gmail configuration
3. Restart your application
4. The system will automatically create an Ethereal test account
5. Check the server logs for the preview URL to view the test email

## Using Fallback Log-Only Mode

If both Gmail and Ethereal fail, the system will fall back to log-only mode where emails are logged to the console but not actually sent.
