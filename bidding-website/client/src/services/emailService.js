const nodemailer = require('nodemailer');
require('dotenv').config();

// Email templates
const emailTemplates = {
  welcome: (username) => ({
    subject: 'Welcome to BidStation! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to BidStation!</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}! 👋</h2>
          <p>Thank you for registering with BidStation - your ultimate sports player auction platform!</p>
          
          <p>Your account has been successfully created. You can now:</p>
          <ul>
            <li>Create exciting sports player auctions</li>
            <li>Participate in live bidding</li>
            <li>Manage your teams and players</li>
            <li>Track your auction history</li>
          </ul>
          
          <a href="${process.env.CLIENT_URL}/login" class="button">Start Bidding Now</a>
          
          <p><strong>Need help?</strong> Check out our platform features and start creating your first auction!</p>
          
          <p>Happy bidding! 🎊</p>
        </div>
        <div class="footer">
          <p>© 2026 BidStation. All rights reserved.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to BidStation!

Hello ${username}!

Thank you for registering with BidStation - your ultimate sports player auction platform!

Your account has been successfully created. You can now:
- Create exciting sports player auctions
- Participate in live bidding
- Manage your teams and players
- Track your auction history

Visit ${process.env.CLIENT_URL}/login to get started!

Happy bidding!

BidStation Team
    `
  }),

  verification: (username, verificationToken) => ({
    subject: 'Verify Your BidStation Account ✓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .code {
            background: #fff;
            padding: 15px;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            letter-spacing: 5px;
            border: 2px dashed #ef4444;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Thank you for registering with BidStation. To complete your registration, please verify your email address.</p>
          
          <p>Click the button below to verify your account:</p>
          <a href="${process.env.CLIENT_URL}/verify-email?token=${verificationToken}" class="button">Verify Email Address</a>
          
          <p>Or use this verification code:</p>
          <div class="code">${verificationToken.substring(0, 6).toUpperCase()}</div>
          
          <p><strong>This link will expire in 24 hours.</strong></p>
          
          <p>If you didn't create an account with BidStation, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 BidStation. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Verify Your BidStation Account

Hello ${username}!

Thank you for registering with BidStation. To complete your registration, please verify your email address.

Verification Link:
${process.env.CLIENT_URL}/verify-email?token=${verificationToken}

Verification Code: ${verificationToken.substring(0, 6).toUpperCase()}

This link will expire in 24 hours.

If you didn't create an account with BidStation, you can safely ignore this email.

BidStation Team
    `
  }),

  resetPassword: (username, resetToken) => ({
    subject: 'Reset Your BidStation Password 🔒',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>We received a request to reset your password for your BidStation account.</p>
          
          <p>Click the button below to reset your password:</p>
          <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" class="button">Reset Password</a>
          
          <div class="warning">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request a password reset, please ignore this email</li>
              <li>Your password won't change unless you click the link above</li>
            </ul>
          </div>
          
          <p>For security reasons, we recommend:</p>
          <ul>
            <li>Using a strong, unique password</li>
            <li>Not sharing your password with anyone</li>
            <li>Changing your password regularly</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2026 BidStation. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Reset Your BidStation Password

Hello ${username}!

We received a request to reset your password for your BidStation account.

Reset Password Link:
${process.env.CLIENT_URL}/reset-password?token=${resetToken}

IMPORTANT:
- This link will expire in 1 hour
- If you didn't request a password reset, please ignore this email
- Your password won't change unless you click the link above

For security, we recommend:
- Using a strong, unique password
- Not sharing your password with anyone
- Changing your password regularly

BidStation Team
    `
  }),

  passwordChanged: (username) => ({
    subject: 'Your BidStation Password Has Been Changed ✓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #22c55e, #10b981);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #ef4444, #f59e0b);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .alert {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✓ Password Changed</h1>
        </div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>This email confirms that your BidStation password was successfully changed.</p>
          
          <p><strong>Changed on:</strong> ${new Date().toLocaleString()}</p>
          
          <div class="alert">
            <strong>⚠️ Didn't make this change?</strong>
            <p>If you didn't change your password, your account may be compromised. Please reset your password immediately and contact our support team.</p>
            <a href="${process.env.CLIENT_URL}/reset-password" class="button">Reset Password Now</a>
          </div>
          
          <p>For your security, we recommend:</p>
          <ul>
            <li>Never share your password with anyone</li>
            <li>Use a unique password for BidStation</li>
            <li>Enable two-factor authentication (coming soon)</li>
          </ul>
        </div>
        <div class="footer">
          <p>© 2026 BidStation. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Password Changed Successfully

Hello ${username}!

This email confirms that your BidStation password was successfully changed.

Changed on: ${new Date().toLocaleString()}

DIDN'T MAKE THIS CHANGE?
If you didn't change your password, your account may be compromised. Please reset your password immediately.

Reset Password: ${process.env.CLIENT_URL}/reset-password

For your security:
- Never share your password with anyone
- Use a unique password for BidStation
- Enable two-factor authentication (coming soon)

BidStation Team
    `
  })
};

// Create email transporter
const createTransporter = () => {
  // Gmail configuration
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // App-specific password
      }
    });
  }
  
  // SMTP configuration (for other providers)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Email service functions
const emailService = {
  // Send welcome email
  async sendWelcomeEmail(email, username) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.welcome(username);
      
      console.log(`📧 Sending welcome email to ${email}...`);
      
      const info = await transporter.sendMail({
        from: `"BidStation" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('✅ Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send email verification
  async sendVerificationEmail(email, username, verificationToken) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.verification(username, verificationToken);
      
      console.log(`📧 Sending verification email to ${email}...`);
      
      const info = await transporter.sendMail({
        from: `"BidStation" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('✅ Verification email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email, username, resetToken) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.resetPassword(username, resetToken);
      
      console.log(`📧 Sending password reset email to ${email}...`);
      
      const info = await transporter.sendMail({
        from: `"BidStation" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('✅ Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  },

  // Send password changed confirmation
  async sendPasswordChangedEmail(email, username) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.passwordChanged(username);
      
      console.log(`📧 Sending password changed email to ${email}...`);
      
      const info = await transporter.sendMail({
        from: `"BidStation" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
      
      console.log('✅ Password changed email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending password changed email:', error);
      return { success: false, error: error.message };
    }
  },

  // Test email configuration
  async testEmailConfig() {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log('✅ Email configuration is valid');
      return { success: true };
    } catch (error) {
      console.error('❌ Email configuration error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
