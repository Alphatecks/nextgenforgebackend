const { randomUUID } = require("node:crypto");
const {
  createDynamicVirtualAccount,
  createOrUpdateCustomer,
  initializePaystackTransaction,
  verifyPaystackTransaction,
} = require("./paystackService");
const {
  findPendingTransferPaymentMatch,
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
  if (
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "paid" ||
    normalized.includes("success") ||
    normalized.includes("paid")
  ) {
    return "success";
  }
  if (
    normalized === "pending" ||
    normalized === "processing" ||
    normalized.includes("pending") ||
    normalized.includes("processing")
  ) {
    return "pending";
  }
  if (
    normalized === "failed" ||
    normalized === "abandoned" ||
    normalized === "reversed" ||
    normalized === "cancelled" ||
    normalized.includes("failed") ||
    normalized.includes("abandon") ||
    normalized.includes("reverse") ||
    normalized.includes("cancel") ||
    normalized.includes("declin") ||
    normalized.includes("error")
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

function resolvePaidAt(existingPaidAt, status) {
  if (status !== "success") {
    return null;
  }
  return existingPaidAt || new Date().toISOString();
}

function extractTransferMatchingFields(data) {
  return {
    accountNumber:
      data?.authorization?.receiver_bank_account_number ||
      data?.authorization?.receiver_account_number ||
      data?.dedicated_account?.account_number ||
      data?.customer?.dedicated_account?.account_number ||
      data?.metadata?.virtualAccountNumber ||
      data?.metadata?.virtual_account_number ||
      null,
    email: data?.customer?.email || data?.customer_email || null,
    amount: data?.amount ?? null,
  };
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
    paidAt: resolvePaidAt(existing?.paidAt, nextStatus),
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
        paidAt: resolvePaidAt(null, nextStatus),
        paystackResponse: paystackVerification,
      });

  return {
    payment: updated,
    verification: paystackVerification,
  };
}

async function processWebhookEvent(event) {
  const data = event?.data || {};
  const reference = data.reference || null;
  let existing = reference ? await getPaymentByReference(reference) : null;

  // For transfer payments, Paystack event reference may differ from local initialization reference.
  // Match pending transfer by virtual account/email/amount as fallback.
  if (!existing) {
    const fields = extractTransferMatchingFields(data);
    existing = await findPendingTransferPaymentMatch(fields);
  }

  const incomingStatus = resolveStatus(data.status || event.event);
  const status = mergeStatus(existing?.status, incomingStatus);
  const targetReference = existing?.reference || reference;

  if (!targetReference) {
    return {
      updated: false,
      reason: "No usable payment reference found on webhook event",
      event: event?.event || null,
    };
  }

  const updates = {
    status,
    paidAt: resolvePaidAt(existing?.paidAt, status),
    paystackResponse: {
      ...(existing?.paystackResponse || {}),
      webhookEvent: event?.event || null,
      webhookReference: reference,
      webhookData: data,
    },
  };

  if (!existing) {
    await upsertPayment({
      reference: targetReference,
      email: data.customer?.email || null,
      amount: data.amount || 0,
      currency: data.currency || "NGN",
      channel: data.channel || "unknown",
      status,
      paidAt: resolvePaidAt(null, status),
      paystackResponse: updates.paystackResponse,
    });
    return { updated: true, created: true, reference: targetReference, status };
  }

  await updatePaymentByReference(targetReference, updates);
  return { updated: true, created: false, reference: targetReference, status };
}

module.exports = {
  getPaymentStatus,
  initializeCardPayment,
  initializeTransferPayment,
  processWebhookEvent,
};
