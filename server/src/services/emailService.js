'use strict';
const nodemailer = require('nodemailer');

// Function to get SMTP configuration based on environment
const getSmtpConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    host: isProduction ? process.env.PROD_SMTP_HOST : process.env.DEV_SMTP_HOST,
    port: isProduction ? parseInt(process.env.PROD_SMTP_PORT) : parseInt(process.env.DEV_SMTP_PORT),
    secure: isProduction
      ? process.env.PROD_SMTP_SECURE === 'true'
      : process.env.DEV_SMTP_SECURE === 'true',
    auth: {
      user: isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME,
      pass: isProduction ? process.env.PROD_SMTP_PASSWORD : process.env.DEV_SMTP_PASSWORD,
    },
  };
};

// Create a transporter using SMTP
const createTransporter = () => {
  const smtpConfig = getSmtpConfig();
  console.log('Using SMTP configuration:', smtpConfig); // Log the SMTP configuration
  return nodemailer.createTransport(smtpConfig);
};

// Generate the email template
const generateEmailTemplate = (verificationCode) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        h1 {
          color: #333;
          text-align: center;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #555;
        }
        strong {
          color: #007bff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Chit-Chat Hub</h1>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>Please use this code to verify your email address.</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      </div>
    </body>
    </html>
  `;
};

// Function to send email
const sendMail = async (email, verificationCode) => {
  try {
    // Create transporter dynamically based on environment
    const transporter = createTransporter();

    const isProduction = process.env.NODE_ENV === 'production';
    const fromEmail = isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME;

    await transporter.sendMail({
      from: `"Chit-Chat Hub" <${fromEmail}>`, // sender address
      to: email, // list of receivers
      subject: `Email Verification Code (${process.env.NODE_ENV || 'development'})`,
      html: generateEmailTemplate(verificationCode), // HTML body
    });

    console.log(
      `Verification code email sent successfully (${process.env.NODE_ENV || 'development'}).`,
    );
  } catch (error) {
    console.error('Error sending verification code email:', error);
    throw error;
  }
};

module.exports = sendMail;
