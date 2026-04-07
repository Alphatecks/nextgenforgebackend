const nodemailer = require("nodemailer");

function parseBoolean(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: parseBoolean(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromEmail: process.env.EMAIL_FROM || process.env.SMTP_USER || "",
    fromName: process.env.EMAIL_FROM_NAME || "NextGenForge",
  };
}

function hasRequiredMailConfig(config) {
  return Boolean(config.host && config.port && config.user && config.pass && config.fromEmail);
}

async function sendEmail({ to, subject, html, text }) {
  const config = getMailConfig();
  if (!hasRequiredMailConfig(config)) {
    return {
      sent: false,
      reason: "Email settings are missing. Configure SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/EMAIL_FROM.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const info = await transporter.sendMail({
    from: `${config.fromName} <${config.fromEmail}>`,
    to,
    subject,
    html,
    text,
  });

  return { sent: true, messageId: info.messageId };
}

module.exports = { sendEmail };
