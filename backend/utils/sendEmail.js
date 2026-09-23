const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send generic email (your original function)
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"HazardWatcher" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log('✅ Email sent to:', to);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
};

// NEW: Send OTP email with HTML template
const sendOTPEmail = async (to, username, otp) => {
  try {
    await transporter.sendMail({
      from: `"HazardWatcher" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your HazardWatcher Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #333; text-align: center;">Welcome to HazardWatcher!</h2>
          <p style="color: #666; font-size: 16px;">Hello <strong>${username}</strong>,</p>
          <p style="color: #666; font-size: 16px;">Thank you for registering! Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #4CAF50; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message from HazardWatcher.</p>
        </div>
      `
    });
    console.log('✅ OTP email sent to:', to);
  } catch (error) {
    console.error('❌ OTP email sending failed:', error);
    throw error;
  }
};

module.exports = { sendEmail, sendOTPEmail };