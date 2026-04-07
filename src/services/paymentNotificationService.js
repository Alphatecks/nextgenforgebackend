const {
  getLatestSuccessfulPaymentByEmail,
  updatePaymentByReference,
} = require("./paymentsRepository");
const { sendEmail } = require("./emailService");
const { renderCongratulationsApprovalEmail } = require("./emailTemplateService");

const DEFAULT_PORTAL_URL = "https://agenticaibuilders.slack.com/";

function buildPlainTextMessage({ recipientName, portalUrl }) {
  return [
    `Hi ${recipientName},`,
    "",
    "Your registration has been approved and your payment has been confirmed.",
    "Welcome to NextGenForge Fellowship.",
    "",
    `Complete onboarding here: ${portalUrl}`,
    "",
    "Welcome aboard,",
    "Alphatecks Technologies",
  ].join("\n");
}

async function sendPaymentSuccessEmailIfEligible({ email, recipientName }) {
  if (!email) {
    return { sent: false, reason: "missing-email" };
  }

  const payment = await getLatestSuccessfulPaymentByEmail(email);
  if (!payment) {
    return { sent: false, reason: "no-successful-payment" };
  }

  const alreadySentAt = payment?.paystackResponse?.approvalEmailSentAt || null;
  if (alreadySentAt) {
    return { sent: false, reason: "already-sent", reference: payment.reference };
  }

  const portalUrl = process.env.EMAIL_ONBOARDING_URL || DEFAULT_PORTAL_URL;
  const html = await renderCongratulationsApprovalEmail({
    recipientName,
    portalUrl,
  });
  const text = buildPlainTextMessage({ recipientName, portalUrl });

  const delivery = await sendEmail({
    to: email,
    subject: "Congratulations! Your NextGenForge Registration Is Approved",
    html,
    text,
  });

  if (!delivery.sent) {
    return {
      sent: false,
      reason: delivery.reason || "mail-not-sent",
      reference: payment.reference,
    };
  }

  await updatePaymentByReference(payment.reference, {
    paystackResponse: {
      ...(payment.paystackResponse || {}),
      approvalEmailSentAt: new Date().toISOString(),
    },
  });

  return { sent: true, reference: payment.reference, messageId: delivery.messageId };
}

module.exports = { sendPaymentSuccessEmailIfEligible };
