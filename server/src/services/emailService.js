// 'use strict';
// const nodemailer = require('nodemailer');

// // Function to get SMTP configuration based on environment
// const getSmtpConfig = () => {
//   const isProduction = process.env.NODE_ENV === 'production';

//   return {
//     host: isProduction ? process.env.PROD_SMTP_HOST : process.env.DEV_SMTP_HOST,
//     port: isProduction ? parseInt(process.env.PROD_SMTP_PORT) : parseInt(process.env.DEV_SMTP_PORT),
//     secure: isProduction
//       ? process.env.PROD_SMTP_SECURE === 'true'
//       : process.env.DEV_SMTP_SECURE === 'true',
//     auth: {
//       user: isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME,
//       pass: isProduction ? process.env.PROD_SMTP_PASSWORD : process.env.DEV_SMTP_PASSWORD,
//     },
//   };
// };

// // Create a transporter using SMTP
// const createTransporter = () => {
//   const smtpConfig = getSmtpConfig();
//   console.log('Using SMTP configuration:', smtpConfig); // Log the SMTP configuration
//   return nodemailer.createTransport(smtpConfig);
// };

// // Generate the email template for verification link
// const generateVerificationLinkTemplate = (verificationLink) => {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Email Verification</title>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           background-color: #f4f4f4;
//           margin: 0;
//           padding: 0;
//           line-height: 1.6;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #ffffff;
//           padding: 20px;
//           border-radius: 8px;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }
//         .header {
//           text-align: center;
//           color: #333;
//         }
//         .verification-link {
//           display: block;
//           width: 100%;
//           text-align: center;
//           margin: 20px 0;
//         }
//         .verification-link a {
//           display: inline-block;
//           background-color: #007bff;
//           color: white;
//           padding: 10px 20px;
//           text-decoration: none;
//           border-radius: 5px;
//         }
//         .footer {
//           text-align: center;
//           color: #777;
//           font-size: 12px;
//           margin-top: 20px;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>Welcome to VaultChain</h1>
//           <p>Please verify your email address to start using VaultChain</p>
//         </div>

//         <div class="verification-link">
//           <a href="${verificationLink}">Verify Email</a>
//         </div>

//         <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
//         <p style="word-break: break-all;">${verificationLink}</p>

//         <p>This link will expire in 24 hours.</p>

//         <div class="footer">
//           <p>If you did not create an account, please ignore this email.</p>
//           <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;
// };

// // Generate the email template for verification code (as a fallback)
// const generateVerificationCodeTemplate = (verificationCode) => {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Email Verification</title>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           background-color: #f4f4f4;
//           margin: 0;
//           padding: 0;
//           line-height: 1.6;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #ffffff;
//           padding: 20px;
//           border-radius: 8px;
//           box-shadow: 0 0 10px rgba(0,0,0,0.1);
//         }
//         .verification-code {
//           text-align: center;
//           font-size: 24px;
//           color: #007bff;
//           margin: 20px 0;
//           letter-spacing: 5px;
//         }
//         .footer {
//           text-align: center;
//           color: #777;
//           font-size: 12px;
//           margin-top: 20px;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <h1>Welcome to VaultChain</h1>

//         <div class="verification-code">
//           ${verificationCode}
//         </div>

//         <div class="footer">
//           <p>If you did not create an account, please ignore this email.</p>
//           <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;
// };

// // // Updated sendMail function to handle both link and code
// // const sendMail = async (email, verificationData, type = 'link') => {
// //   try {
// //     // Create transporter dynamically based on environment
// //     const transporter = createTransporter();
// //     transporter.verify((error, success) => {
// //       if (error) {
// //         console.error('SMTP Connection Error:', error);
// //       } else {
// //         console.log('SMTP Connection Successful:', success);
// //       }
// //     });

// //     const isProduction = process.env.NODE_ENV === 'production';
// //     const fromEmail = isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME;

// //     let subject = '';
// //     let html = '';

// //     if (type === 'link') {
// //       subject = 'VaultChain Email Verification Link';
// //       html = generateVerificationLinkTemplate(verificationData);
// //     } else {
// //       subject = 'VaultChain Email Verification Code';
// //       html = generateVerificationCodeTemplate(verificationData);
// //     }

// //     await transporter.sendMail({
// //       from: `"VaultChain" <${fromEmail}>`,
// //       to: email,
// //       subject: `${subject} (${process.env.NODE_ENV || 'development'})`,
// //       html: html,
// //     });

// //     console.log(
// //       `Verification ${type} sent successfully (${process.env.NODE_ENV || 'development'}).`,
// //     );
// //   } catch (error) {
// //     console.error(`Error sending verification ${type}:`, error);
// //     throw error;
// //   }
// // };

// // module.exports = sendMail;

// // In your emailService.js or a new file like forgotPasswordTemplate.js

// const generateForgotPasswordTemplate = (resetLink) => {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Password Reset Request</title>
//       <style>
//         body {
//           font-family: Arial, sans-serif;
//           background-color: #f4f4f4;
//           margin: 0;
//           padding: 0;
//           line-height: 1.6;
//         }
//         .container {
//           max-width: 600px;
//           margin: 20px auto;
//           background-color: #ffffff;
//           padding: 30px;
//           border-radius: 10px;
//           box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//         }
//         .header {
//           text-align: center;
//           color: #333;
//           border-bottom: 2px solid #007bff;
//           padding-bottom: 15px;
//         }
//         .content {
//           margin: 20px 0;
//         }
//         .reset-link {
//           display: block;
//           width: 100%;
//           text-align: center;
//           margin: 20px 0;
//         }
//         .reset-link a {
//           display: inline-block;
//           background-color: #007bff;
//           color: white;
//           padding: 12px 24px;
//           text-decoration: none;
//           border-radius: 5px;
//           font-weight: bold;
//         }
//         .footer {
//           text-align: center;
//           color: #777;
//           font-size: 12px;
//           margin-top: 20px;
//           border-top: 1px solid #e0e0e0;
//           padding-top: 15px;
//         }
//         .warning {
//           color: #6c757d;
//           font-size: 14px;
//           text-align: center;
//         }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>Password Reset Request</h1>
//         </div>

//         <div class="content">
//           <p>Hello,</p>
//           <p>We received a request to reset the password for your VaultChain account. Click the button below to reset your password:</p>

//           <div class="reset-link">
//             <a href="${resetLink}">Reset Password</a>
//           </div>

//           <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
//         </div>

//         <div class="warning">
//           <p>⚠️ This link will expire in 1 hour.</p>
//         </div>

//         <div class="footer">
//           <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
//           <p>If you're having trouble, copy and paste this link into your browser:</p>
//           <p style="word-break: break-all;">${resetLink}</p>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;
// };

// // Modify your existing sendMail function to include a new type for forgot password
// const sendMail = async (email, data, type = 'link') => {
//   try {
//     const transporter = createTransporter();

//     const isProduction = process.env.NODE_ENV === 'production';
//     const fromEmail = isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME;

//     let subject = '';
//     let html = '';

//     switch (type) {
//       case 'link':
//         subject = 'Email Verification Link';
//         html = generateVerificationLinkTemplate(data);
//         break;
//       case 'code':
//         subject = 'Verification Code';
//         html = generateVerificationCodeTemplate(data);
//         break;
//       case 'forgotPassword':
//         subject = 'Password Reset Request';
//         html = generateForgotPasswordTemplate(data);
//         break;
//       default:
//         throw new Error('Invalid email type');
//     }

//     await transporter.sendMail({
//       from: `"VaultChain" <${fromEmail}>`,
//       to: email,
//       subject: `${subject} (${process.env.NODE_ENV || 'development'})`,
//       html: html,
//     });

//     console.log(`${type} email sent successfully (${process.env.NODE_ENV || 'development'}).`);
//   } catch (error) {
//     console.error(`Error sending ${type} email:`, error);
//     throw error;
//   }
// };
// module.exports = sendMail;

'use strict';

const nodemailer = require('nodemailer');

// Function to get SMTP configuration based on environment
const getSmtpConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    host: isProduction ? process.env.PROD_SMTP_HOST : process.env.DEV_SMTP_HOST,
    port: isProduction
      ? parseInt(process.env.PROD_SMTP_PORT, 10)
      : parseInt(process.env.DEV_SMTP_PORT, 10),
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
  console.log('Using SMTP configuration:', smtpConfig);
  return nodemailer.createTransport(smtpConfig);
};

// Generate the email template for verification link
const generateVerificationLinkTemplate = (verificationLink) => `
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
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        color: #333;
      }
      .verification-link {
        display: block;
        width: 100%;
        text-align: center;
        margin: 20px 0;
      }
      .verification-link a {
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        text-decoration: none;
        border-radius: 5px;
      }
      .footer {
        text-align: center;
        color: #777;
        font-size: 12px;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to VaultChain</h1>
        <p>Please verify your email address to start using VaultChain</p>
      </div>
      
      <div class="verification-link">
        <a href="${verificationLink}">Verify Email</a>
      </div>
      
      <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
      <p style="word-break: break-all;">${verificationLink}</p>
      
      <p>This link will expire in 24 hours.</p>
      
      <div class="footer">
        <p>If you did not create an account, please ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

// Generate the email template for verification code
const generateVerificationCodeTemplate = (verificationCode) => `
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
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      .verification-code {
        text-align: center;
        font-size: 24px;
        color: #007bff;
        margin: 20px 0;
        letter-spacing: 5px;
      }
      .footer {
        text-align: center;
        color: #777;
        font-size: 12px;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Welcome to VaultChain</h1>
      
      <div class="verification-code">
        ${verificationCode}
      </div>
      
      <div class="footer">
        <p>If you did not create an account, please ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

// Generate the email template for forgot password
const generateForgotPasswordTemplate = (resetLink) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        color: #333;
        border-bottom: 2px solid #007bff;
        padding-bottom: 15px;
      }
      .content {
        margin: 20px 0;
      }
      .reset-link {
        display: block;
        width: 100%;
        text-align: center;
        margin: 20px 0;
      }
      .reset-link a {
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        color: #777;
        font-size: 12px;
        margin-top: 20px;
        border-top: 1px solid #e0e0e0;
        padding-top: 15px;
      }
      .warning {
        color: #6c757d;
        font-size: 14px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset Request</h1>
      </div>
      
      <div class="content">
        <p>Hello,</p>
        <p>We received a request to reset the password for your VaultChain account. Click the button below to reset your password:</p>
        
        <div class="reset-link">
          <a href="${resetLink}">Reset Password</a>
        </div>
        
        <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      </div>
      
      <div class="warning">
        <p>⚠️ This link will expire in 1 hour.</p>
      </div>
      
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
        <p>If you're having trouble, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">${resetLink}</p>
      </div>
    </div>
  </body>
  </html>
`;

// Send email function
const sendMail = async (email, data, type = 'link') => {
  try {
    if (!email) {
      throw new Error('No recipients defined');
    }

    const transporter = createTransporter();

    const isProduction = process.env.NODE_ENV === 'production';
    const fromEmail = isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME;

    let subject = '';
    let html = '';

    switch (type) {
      case 'link':
        subject = 'Email Verification Link';
        html = generateVerificationLinkTemplate(data);
        break;
      case 'code':
        subject = 'Verification Code';
        html = generateVerificationCodeTemplate(data);
        break;
      case 'forgotPassword':
        subject = 'Password Reset Request';
        html = generateForgotPasswordTemplate(data);
        break;
      default:
        throw new Error('Invalid email type');
    }

    await transporter.sendMail({
      from: `"VaultChain" <${fromEmail}>`,
      to: email,
      subject: `${subject} (${process.env.NODE_ENV || 'development'})`,
      html: html,
    });

    console.log(`${type} email sent successfully (${process.env.NODE_ENV || 'development'}).`);
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    throw error;
  }
};

module.exports = sendMail;
