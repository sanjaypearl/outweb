import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import { transporter } from "../config/nodemailer.js";

// For __dirname in ES module
const __filename = fileURLToPath(import.meta.url);

console.log(__filename, "file name ");
const __dirname = path.dirname(__filename);

console.log(__dirname, "file name ");

/**
 * Send dynamic email with chosen EJS template
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of EJS template (without .ejs)
 * @param {object} data - Data to inject into template
 */
export const sendEmail = async (to, subject, templateName, data = {}) => {
  try {
    // Path to template
    const templatePath = path.join(
      __dirname,
      "templates",
      `${templateName}.ejs`
    );

    // Render template with provided data
    const html = await ejs.renderFile(templatePath, data);

    // Mail options
    const mailOptions = {
      from: process.env.EMAIL_ID,
      to,
      subject,
      html,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
