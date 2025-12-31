const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

// Email templates
const templates = {
    verification: (name, link) => ({
        subject: 'Verify your Fooddala account',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF5722, #FF8A65); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🍕 Fooddala</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for signing up with Fooddala. Please verify your email address to start ordering delicious food!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: #FF5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            This link expires in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Fooddala. All rights reserved.</p>
        </div>
      </div>
    `,
    }),

    resetPassword: (name, link) => ({
        subject: 'Reset your Fooddala password',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF5722, #FF8A65); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🍕 Fooddala</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            Hi ${name}, we received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background: #FF5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">
            This link expires in 1 hour. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Fooddala. All rights reserved.</p>
        </div>
      </div>
    `,
    }),

    orderConfirmation: (name, orderNumber, items, total) => ({
        subject: `Order Confirmed - ${orderNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50, #81C784); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">✅ Order Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hi ${name},</h2>
          <p style="color: #666;">Your order <strong>#${orderNumber}</strong> has been confirmed!</p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
            ${items.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <span>${item.name} x ${item.quantity}</span>
                <span>₹${item.subtotal}</span>
              </div>
            `).join('')}
            <div style="display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold; font-size: 18px;">
              <span>Total</span>
              <span style="color: #FF5722;">₹${total}</span>
            </div>
          </div>
          <p style="color: #666;">We'll notify you when your order is on the way!</p>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Fooddala. All rights reserved.</p>
        </div>
      </div>
    `,
    }),

    orderStatusUpdate: (name, orderNumber, status, message) => ({
        subject: `Order Update - ${orderNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF5722, #FF8A65); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🍕 Fooddala</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Order Update</h2>
          <p style="color: #666;">Hi ${name}, your order <strong>#${orderNumber}</strong> status has been updated:</p>
          <div style="background: #FF5722; color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; text-transform: uppercase;">${status}</h3>
            <p style="margin: 10px 0 0 0;">${message}</p>
          </div>
        </div>
        <div style="background: #333; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">© 2024 Fooddala. All rights reserved.</p>
        </div>
      </div>
    `,
    }),
};

// Send email function
const sendEmail = async (to, templateName, data) => {
    try {
        const transporter = createTransporter();
        const template = templates[templateName](...Object.values(data));

        const mailOptions = {
            from: `"Fooddala" <${process.env.EMAIL_USER}>`,
            to,
            subject: template.subject,
            html: template.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
};

// Specific email functions
const sendVerificationEmail = (email, name, token) => {
    const link = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    return sendEmail(email, 'verification', { name, link });
};

const sendPasswordResetEmail = (email, name, token) => {
    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    return sendEmail(email, 'resetPassword', { name, link });
};

const sendOrderConfirmationEmail = (email, name, orderNumber, items, total) => {
    return sendEmail(email, 'orderConfirmation', { name, orderNumber, items, total });
};

const sendOrderStatusEmail = (email, name, orderNumber, status, message) => {
    return sendEmail(email, 'orderStatusUpdate', { name, orderNumber, status, message });
};

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
};
