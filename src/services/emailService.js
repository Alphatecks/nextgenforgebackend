function getMailConfig() {
  return {
    resendApiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.EMAIL_FROM || "",
    fromName: process.env.EMAIL_FROM_NAME || "NextGenForge",
  };
}

function hasRequiredMailConfig(config) {
  return Boolean(config.resendApiKey && config.fromEmail);
}

async function sendEmail({ to, subject, html, text }) {
  const config = getMailConfig();
  if (!hasRequiredMailConfig(config)) {
    return {
      sent: false,
      reason: "Email settings are missing. Configure RESEND_API_KEY and EMAIL_FROM.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      sent: false,
      reason: payload?.message || payload?.error?.message || `Resend request failed with ${response.status}`,
    };
  }

  return { sent: true, messageId: payload?.id || null };
}

module.exports = { sendEmail };
