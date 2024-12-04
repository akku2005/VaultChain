'use strict';
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Enhanced SMTP Configuration Management
class EmailConfigManager {
  /**
   * Get SMTP configuration based on environment
   * @returns {Object} SMTP configuration
   */
  static getSmtpConfig() {
    const isProduction = process.env.NODE_ENV === 'production';

    // Comprehensive environment variable validation
    const requiredVars = isProduction
      ? ['PROD_SMTP_HOST', 'PROD_SMTP_PORT', 'PROD_SMTP_USERNAME', 'PROD_SMTP_PASSWORD']
      : ['DEV_SMTP_HOST', 'DEV_SMTP_PORT', 'DEV_SMTP_USERNAME', 'DEV_SMTP_PASSWORD'];

    // Check for missing environment variables
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    return {
      host: isProduction ? process.env.PROD_SMTP_HOST : process.env.DEV_SMTP_HOST,
      port: parseInt(isProduction ? process.env.PROD_SMTP_PORT : process.env.DEV_SMTP_PORT, 10),
      secure: isProduction
        ? process.env.PROD_SMTP_SECURE === 'true'
        : process.env.DEV_SMTP_SECURE === 'true',
      auth: {
        user: isProduction ? process.env.PROD_SMTP_USERNAME : process.env.DEV_SMTP_USERNAME,
        pass: isProduction ? process.env.PROD_SMTP_PASSWORD : process.env.DEV_SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Use with caution in production
      },
    };
  }

  /**
   * Create a nodemailer transporter
   * @returns {Object} Nodemailer transporter
   */
  static createTransporter() {
    try {
      const smtpConfig = this.getSmtpConfig();
      logger.info('SMTP Configuration:', JSON.stringify(smtpConfig, null, 2));

      const transporter = nodemailer.createTransport(smtpConfig);

      // Add connection verification
      transporter.verify((error) => {
        if (error) {
          logger.error('SMTP Connection Error:', error);
          throw new Error('SMTP Connection Failed');
        } else {
          logger.info('SMTP Connection Successful');
        }
      });

      return transporter;
    } catch (error) {
      logger.error('Transporter Creation Error:', error);
      throw error;
    }
  }
}

// Email Template Generator
class EmailTemplateGenerator {
  /**
   * Generate verification link email template
   * @param {string} verificationLink
   * @returns {string} HTML email template
   */
  static generateVerificationLinkTemplate(verificationLink) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Email Verification - VaultChain</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f4f4f4; 
          }
          .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>VaultChain Email Verification</h1>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationLink}" class="btn">Verify Email</a>
          <p>Link expires in 24 hours</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate verification code email template
   * @param {string} verificationCode
   * @returns {string} HTML email template
   */
  static generateVerificationCodeTemplate(verificationCode) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Verification Code - VaultChain</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #f4f4f4; 
          }
          .code {
            font-size: 24px;
            letter-spacing: 5px;
            text-align: center;
            color: #007bff;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>VaultChain Verification Code</h1>
          <p>Your verification code is:</p>
          <div class="code">${verificationCode}</div>
          <p>This code will expire in 15 minutes</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Email Service
class EmailService {
  /**
   * Send email with verification link or code
   * @param {string} email - Recipient email
   * @param {string} verificationData - Link or code
   * @param {string} type - 'link' or 'code'
   */
  static async sendMail(email, verificationData, type = 'link') {
    try {
      // Validate input
      if (!email) {
        throw new Error('Recipient email is required');
      }

      // Create transporter
      const transporter = EmailConfigManager.createTransporter();

      // Determine email content based on type
      const isProduction = process.env.NODE_ENV === 'production';
      const fromEmail = isProduction
        ? process.env.PROD_SMTP_USERNAME
        : process.env.DEV_SMTP_USERNAME;

      const mailOptions = {
        from: `"VaultChain" <${fromEmail}>`,
        to: email,
        subject:
          type === 'link'
            ? 'Verify Your Email - VaultChain'
            : 'Your Verification Code - VaultChain',
        html:
          type === 'link'
            ? EmailTemplateGenerator.generateVerificationLinkTemplate(verificationData)
            : EmailTemplateGenerator.generateVerificationCodeTemplate(verificationData),
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);

      logger.info(`Verification ${type} sent successfully`, {
        messageId: info.messageId,
        recipient: email,
      });

      return info;
    } catch (error) {
      logger.error(`Error sending verification ${type}:`, {
        message: error.message,
        stack: error.stack,
        email: email,
      });
      throw error;
    }
  }
}

module.exports = EmailService.sendMail;

// ('use strict');
// const nodemailer = require('nodemailer');
// const logger = require('../utils/logger');

// class EmailServiceError extends Error {
//   constructor(message, code = 'EMAIL_SERVICE_ERROR') {
//     super(message);
//     this.name = 'EmailServiceError';
//     this.code = code;
//   }
// }

// class EmailConfigManager {
//   /**
//    * Get SMTP configuration based on environment
//    * @returns {Object} SMTP configuration
//    */
//   static getConfig() {
//     const isProduction = process.env.NODE_ENV === 'production';

//     // Configuration mapping
//     const configs = {
//       development: {
//         host: process.env.DEV_SMTP_HOST || 'smtp.gmail.com',
//         port: parseInt(process.env.DEV_SMTP_PORT || '587', 10),
//         secure: process.env.DEV_SMTP_SECURE === 'true' || false,
//         auth: {
//           user: process.env.DEV_SMTP_USERNAME,
//           pass: process.env.DEV_SMTP_PASSWORD,
//         },
//       },
//       production: {
//         host: process.env.PROD_SMTP_HOST || 'smtp.gmail.com',
//         port: parseInt(process.env.PROD_SMTP_PORT || '587', 10),
//         secure: process.env.PROD_SMTP_SECURE === 'true' || false,
//         auth: {
//           user: process.env.PROD_SMTP_USERNAME,
//           pass: process.env.PROD_SMTP_PASSWORD,
//         },
//       },
//     };

//     const config = isProduction ? configs.production : configs.development;

//     // Validate required configuration
//     this.validateConfig(config);

//     return {
//       ...config,
//       tls: {
//         rejectUnauthorized: false,
//       },
//     };
//   }

//   /**
//    * Validate SMTP configuration
//    * @param {Object} config - SMTP configuration
//    * @throws {EmailServiceError} If configuration is invalid
//    */
//   static validateConfig(config) {
//     const requiredFields = ['host', 'port', 'auth.user', 'auth.pass'];

//     for (const field of requiredFields) {
//       const value = field.split('.').reduce((obj, key) => obj[key], config);

//       if (!value) {
//         throw new EmailServiceError(
//           `Missing required SMTP configuration: ${field}`,
//           'INVALID_CONFIG',
//         );
//       }
//     }
//   }
// }

// class EmailTemplateGenerator {
//   /**
//    * Generate a standardized email template
//    * @param {Object} params - Template parameters
//    * @returns {string} HTML email template
//    */
//   static generate(params) {
//     const {
//       title = 'VaultChain Notification',
//       heading = 'Notification',
//       message = 'You have a new notification',
//       actionUrl = null,
//       actionText = 'Take Action',
//     } = params;

//     return `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>${title}</title>
//         <style>
//           body {
//             font-family: 'Arial', sans-serif;
//             line-height: 1.6;
//             color: #333;
//             background-color: #f4f4f4;
//             margin: 0;
//             padding: 20px;
//           }
//           .email-container {
//             max-width: 600px;
//             margin: 0 auto;
//             background-color: #ffffff;
//             padding: 30px;
//             border-radius: 8px;
//             box-shadow: 0 4px 6px rgba(0,0,0,0.1);
//           }
//           .email-header {
//             text-align: center;
//             padding-bottom: 20px;
//             border-bottom: 1px solid #e0e0e0;
//           }
//           .email-body {
//             padding: 20px 0;
//           }
//           .email-footer {
//             text-align: center;
//             font-size: 12px;
//             color: #777;
//             padding-top: 20px;
//             border-top: 1px solid #e0e0e0;
//           }
//           .action-btn {
//             display: inline-block;
//             background-color: #007bff;
//             color: white;
//             padding: 10px 20px;
//             text-decoration: none;
//             border-radius: 5px;
//             margin-top: 20px;
//           }
//         </style>
//       </head>
//       <body>
//         <div class="email-container">
//           <div class="email-header">
//             <h1>${heading}</h1>
//           </div>
//           <div class="email-body">
//             <p>${message}</p>
//             ${
//               actionUrl
//                 ? `
//               <div style="text-align: center;">
//                 <a href="${actionUrl}" class="action-btn">${actionText}</a>
//               </div>
//             `
//                 : ''
//             }
//           </div>
//           <div class="email-footer">
//             <p>&copy; ${new Date().getFullYear()} VaultChain. All rights reserved.</p>
//           </div>
//         </div>
//       </body>
//       </html>
//     `;
//   }
// }

// class EmailService {
//   /**
//    * Create a nodemailer transporter
//    * @returns {Object} Nodemailer transporter
//    */
//   static createTransporter() {
//     try {
//       const config = EmailConfigManager.getConfig();
//       logger.info('SMTP Configuration:', JSON.stringify(config, null, 2));

//       return nodemailer.createTransport(config);
//     } catch (error) {
//       logger.error('Transporter Creation Error:', error);
//       throw new EmailServiceError('Failed to create email transporter', 'TRANSPORTER_ERROR');
//     }
//   }

//   /**
//    * Verify SMTP connection
//    * @param {Object} transporter - Nodemailer transporter
//    * @returns {Promise<boolean>} Connection verification result
//    */
//   static async verifyConnection(transporter) {
//     return new Promise((resolve, reject) => {
//       transporter.verify((error) => {
//         if (error) {
//           logger.error('SMTP Connection Verification Failed:', error);
//           reject(
//             new EmailServiceError(
//               'SMTP connection verification failed',
//               'CONNECTION_VERIFICATION_FAILED',
//             ),
//           );
//         } else {
//           logger.info('SMTP Connection Verified Successfully');
//           resolve(true);
//         }
//       });
//     });
//   }

//   /**
//    * Send email with comprehensive error handling
//    * @param {Object} options - Email sending options
//    * @returns {Promise<Object>} Email sending result
//    */
//   static async sendEmail(options) {
//     // Validate input
//     if (!options.to) {
//       throw new EmailServiceError('Recipient email is required', 'INVALID_RECIPIENT');
//     }

//     try {
//       // Create and verify transporter
//       const transporter = this.createTransporter();
//       await this.verifyConnection(transporter);

//       // Prepare email options
//       const emailOptions = {
//         from: `"VaultChain" <${process.env.DEV_SMTP_USERNAME || process.env.PROD_SMTP_USERNAME}>`,
//         to: options.to,
//         subject: options.subject || 'VaultChain Notification',
//         html: options.html || EmailTemplateGenerator.generate(options),
//       };

//       // Send email
//       const result = await transporter.sendMail(emailOptions);

//       logger.info('Email Sent Successfully', {
//         messageId: result.messageId,
//         recipient: options.to,
//       });

//       return result;
//     } catch (error) {
//       logger.error('Email Sending Error', {
//         message: error.message,
//         code: error.code,
//         stack: error.stack,
//       });

//       throw error;
//     }
//   }
// }

// /**
//  * Exported email sending function
//  * @param {Object} options - Email configuration
//  * @returns {Promise<Object>} Email sending result
//  */
// module.exports = async (options) => {
//   try {
//     return await EmailService.sendEmail(options);
//   } catch (error) {
//     logger.error('Email Service Error:', error);
//     throw new EmailServiceError('Failed to send email', 'EMAIL_SERVICE_ERROR');
//   }
// };
