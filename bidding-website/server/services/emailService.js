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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Welcome to BidStation!</h1></div>
        <div class="content">
          <h2>Hello ${username}! 👋</h2>
          <p>Thank you for registering with BidStation - your ultimate sports player auction platform!</p>
          <p>Your account has been successfully created. You can now create and participate in exciting sports auctions!</p>
          <a href="${process.env.CLIENT_URL}/login" class="button">Start Bidding Now</a>
          <p>Happy bidding! 🎊</p>
        </div>
        <div class="footer"><p>© 2026 BidStation. If you didn't create this account, please ignore this email.</p></div>
      </body>
      </html>
    `,
    text: `Welcome to BidStation!\n\nHello ${username}!\n\nThank you for registering with BidStation!\n\nVisit ${process.env.CLIENT_URL}/login to get started!\n\nHappy bidding!\n\nBidStation Team`
  }),

  verification: (username, verificationToken) => ({
    subject: 'Verify Your BidStation Account ✓',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Verify Your Email</h1></div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>Thank you for registering with BidStation. To complete your registration, please verify your email address.</p>
          <a href="${process.env.CLIENT_URL}/verify-email?token=${verificationToken}" class="button">Verify Email Address</a>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <p>If you didn't create an account with BidStation, you can safely ignore this email.</p>
        </div>
        <div class="footer"><p>© 2026 BidStation. This is an automated message, please do not reply.</p></div>
      </body>
      </html>
    `,
    text: `Verify Your BidStation Account\n\nHello ${username}!\n\nVerification Link: ${process.env.CLIENT_URL}/verify-email?token=${verificationToken}\n\nThis link will expire in 24 hours.\n\nBidStation Team`
  }),

  resetPassword: (username, resetToken) => ({
    subject: 'Reset Your BidStation Password 🔒',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ef4444, #f59e0b); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header"><h1>Reset Your Password</h1></div>
        <div class="content">
          <h2>Hello ${username}!</h2>
          <p>We received a request to reset your password for your BidStation account.</p>
          <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" class="button">Reset Password</a>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class="footer"><p>© 2026 BidStation. This is an automated message, please do not reply.</p></div>
      </body>
      </html>
    `,
    text: `Reset Your BidStation Password\n\nHello ${username}!\n\nReset Password Link: ${process.env.CLIENT_URL}/reset-password?token=${resetToken}\n\nThis link will expire in 1 hour.\n\nBidStation Team`
  })
};

// Create email transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Email service functions
const emailService = {
  async sendWelcomeEmail(email, username) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.welcome(username);
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
      console.error('❌ Error sending welcome email:', error.message);
      return { success: false, error: error.message };
    }
  },

  async sendVerificationEmail(email, username, verificationToken) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.verification(username, verificationToken);
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
      console.error('❌ Error sending verification email:', error.message);
      return { success: false, error: error.message };
    }
  },

  async sendPasswordResetEmail(email, username, resetToken) {
    try {
      const transporter = createTransporter();
      const template = emailTemplates.resetPassword(username, resetToken);
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
      console.error('❌ Error sending password reset email:', error.message);
      return { success: false, error: error.message };
    }
  }
};

module.exports = emailService;
