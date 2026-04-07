const { randomUUID } = require("node:crypto");
const {
  createDynamicVirtualAccount,
  createOrUpdateCustomer,
  initializePaystackTransaction,
  verifyPaystackTransaction,
} = require("./paystackService");
const {
  getPaymentByReference,
  updatePaymentByReference,
  upsertPayment,
} = require("./paymentsRepository");

function makeReference(prefix) {
  const compact = randomUUID().replace(/-/g, "").slice(0, 18);
  return `${prefix}_${Date.now()}_${compact}`;
}

function amountToMinorUnit(amount) {
  return Math.round(Number(amount) * 100);
}

function resolveStatus(paystackStatus) {
  const normalized = String(paystackStatus || "").toLowerCase();
  if (normalized === "success" || normalized.includes("success")) {
    return "success";
  }
  if (
    normalized === "failed" ||
    normalized === "abandoned" ||
    normalized === "reversed" ||
    normalized.includes("failed")
  ) {
    return "failed";
  }
  return "pending";
}

function mergeStatus(currentStatus, incomingStatus) {
  if (currentStatus === "success") {
    return "success";
  }
  if (incomingStatus === "success") {
    return "success";
  }
  if (currentStatus === "failed" && incomingStatus === "pending") {
    return "failed";
  }
  return incomingStatus;
}

async function initializeCardPayment(payload) {
  const reference = payload.reference || makeReference("nfg_card");
  const amountMinorUnit = amountToMinorUnit(payload.amount);
  const callbackUrl = payload.callbackUrl || process.env.APP_BASE_URL;

  const paystackData = await initializePaystackTransaction({
    email: payload.email,
    amount: amountMinorUnit,
    currency: payload.currency,
    reference,
    callback_url: callbackUrl,
    channels: ["card"],
    metadata: {
      questionnaireId: payload.questionnaireId || null,
      ...(payload.metadata || {}),
    },
  });

  const payment = await upsertPayment({
    reference,
    email: payload.email,
    amount: amountMinorUnit,
    currency: payload.currency,
    channel: "card",
    status: "pending",
    authorizationUrl: paystackData.authorization_url,
    accessCode: paystackData.access_code,
    questionnaireId: payload.questionnaireId || null,
    metadata: payload.metadata || {},
    paystackResponse: paystackData,
  });

  return {
    ...payment,
    authorizationUrl: paystackData.authorization_url,
    accessCode: paystackData.access_code,
  };
}

async function initializeTransferPayment(payload) {
  const reference = payload.reference || makeReference("nfg_transfer");
  const amountMinorUnit = amountToMinorUnit(payload.amount);

  const customer = await createOrUpdateCustomer({
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone,
    metadata: {
      questionnaireId: payload.questionnaireId || null,
      reference,
      ...(payload.metadata || {}),
    },
  });

  const dedicatedAccount = await createDynamicVirtualAccount({
    customerCode: customer.customer_code,
    preferredBank: payload.preferredBank,
  });

  const payment = await upsertPayment({
    reference,
    email: payload.email,
    amount: amountMinorUnit,
    currency: payload.currency,
    channel: "transfer",
    status: "pending",
    virtualAccountName: dedicatedAccount.account_name,
    virtualAccountNumber: dedicatedAccount.account_number,
    bankName: dedicatedAccount.bank?.name || dedicatedAccount.bank_name || null,
    questionnaireId: payload.questionnaireId || null,
    metadata: payload.metadata || {},
    paystackResponse: {
      customer,
      dedicatedAccount,
    },
  });

  return payment;
}

async function getPaymentStatus(reference) {
  const existing = await getPaymentByReference(reference);
  let paystackVerification = null;
  try {
    paystackVerification = await verifyPaystackTransaction(reference);
  } catch (error) {
    if (existing) {
      return {
        payment: existing,
        verification: null,
        verificationError: error.message,
      };
    }
    throw error;
  }
  const incomingStatus = resolveStatus(paystackVerification.status);
  const nextStatus = mergeStatus(existing?.status, incomingStatus);

  const updates = {
    status: nextStatus,
    paidAt: nextStatus === "success" ? new Date().toISOString() : null,
    paystackResponse: paystackVerification,
  };

  const updated = existing
    ? await updatePaymentByReference(reference, updates)
    : await upsertPayment({
        reference,
        email: paystackVerification.customer?.email || null,
        amount: paystackVerification.amount || 0,
        currency: paystackVerification.currency || "NGN",
        channel: paystackVerification.channel || "unknown",
        status: nextStatus,
        paidAt: nextStatus === "success" ? new Date().toISOString() : null,
        paystackResponse: paystackVerification,
      });

  return {
    payment: updated,
    verification: paystackVerification,
  };
}

async function processWebhookEvent(event) {
  const data = event?.data || {};
  const reference = data.reference;
  if (!reference) {
    return { updated: false, reason: "No reference on webhook event" };
  }

  const incomingStatus = resolveStatus(data.status || event.event);
  const existing = await getPaymentByReference(reference);
  const status = mergeStatus(existing?.status, incomingStatus);

  const updates = {
    status,
    paidAt: status === "success" ? new Date().toISOString() : null,
    paystackResponse: data,
  };

  if (!existing) {
    await upsertPayment({
      reference,
      email: data.customer?.email || null,
      amount: data.amount || 0,
      currency: data.currency || "NGN",
      channel: data.channel || "unknown",
      status,
      paidAt: status === "success" ? new Date().toISOString() : null,
      paystackResponse: data,
    });
    return { updated: true, created: true, reference, status };
  }

  await updatePaymentByReference(reference, updates);
  return { updated: true, created: false, reference, status };
}

module.exports = {
  getPaymentStatus,
  initializeCardPayment,
  initializeTransferPayment,
  processWebhookEvent,
};
