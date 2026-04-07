const crypto = require("node:crypto");

const PAYSTACK_API_BASE_URL = "https://api.paystack.co";

function getPaystackSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is required.");
  }
  return secretKey;
}

function getWebhookSecret() {
  return process.env.PAYSTACK_WEBHOOK_SECRET || getPaystackSecretKey();
}

async function paystackRequest(path, options = {}) {
  const secretKey = getPaystackSecretKey();
  const response = await fetch(`${PAYSTACK_API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.status === false) {
    const message = payload.message || `Paystack request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

function verifyPaystackSignature(rawBody, signature) {
  if (!signature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha512", getWebhookSecret())
    .update(rawBody)
    .digest("hex");

  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);
  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digestBuffer, signatureBuffer);
}

async function initializePaystackTransaction(payload) {
  return paystackRequest("/transaction/initialize", {
    method: "POST",
    body: payload,
  });
}

async function createOrUpdateCustomer({ email, firstName, lastName, phone, metadata }) {
  return paystackRequest("/customer", {
    method: "POST",
    body: {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
      metadata: metadata || {},
    },
  });
}

async function createDynamicVirtualAccount({ customerCode, preferredBank }) {
  return paystackRequest("/dedicated_account", {
    method: "POST",
    body: {
      customer: customerCode,
      preferred_bank: preferredBank || "wema-bank",
    },
  });
}

async function verifyPaystackTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`);
}

module.exports = {
  createDynamicVirtualAccount,
  createOrUpdateCustomer,
  initializePaystackTransaction,
  verifyPaystackSignature,
  verifyPaystackTransaction,
};
