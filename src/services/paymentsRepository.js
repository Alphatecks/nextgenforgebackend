const { supabase } = require("../supabase");

function normalizePaymentRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    reference: row.reference,
    email: row.email,
    amount: row.amount,
    currency: row.currency,
    channel: row.channel,
    status: row.status,
    authorizationUrl: row.authorization_url,
    accessCode: row.access_code,
    virtualAccountName: row.virtual_account_name,
    virtualAccountNumber: row.virtual_account_number,
    bankName: row.bank_name,
    questionnaireId: row.questionnaire_id,
    metadata: row.metadata || {},
    paystackResponse: row.paystack_response || {},
    paidAt: row.paid_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRecord(payment) {
  const record = {
    reference: payment.reference,
    email: payment.email,
    amount: payment.amount,
    currency: payment.currency,
    channel: payment.channel,
    status: payment.status,
    authorization_url:
      payment.authorizationUrl !== undefined ? payment.authorizationUrl : undefined,
    access_code: payment.accessCode !== undefined ? payment.accessCode : undefined,
    virtual_account_name:
      payment.virtualAccountName !== undefined ? payment.virtualAccountName : undefined,
    virtual_account_number:
      payment.virtualAccountNumber !== undefined ? payment.virtualAccountNumber : undefined,
    bank_name: payment.bankName !== undefined ? payment.bankName : undefined,
    questionnaire_id: payment.questionnaireId !== undefined ? payment.questionnaireId : undefined,
    metadata: payment.metadata !== undefined ? payment.metadata : undefined,
    paystack_response: payment.paystackResponse !== undefined ? payment.paystackResponse : undefined,
    paid_at: payment.paidAt !== undefined ? payment.paidAt : undefined,
    updated_at: new Date().toISOString(),
  };
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
}

async function upsertPayment(payment) {
  const record = toDbRecord(payment);
  const { data, error } = await supabase
    .from("payments")
    .upsert(record, { onConflict: "reference" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert payment: ${error.message}`);
  }

  return normalizePaymentRow(data);
}

async function getPaymentByReference(reference) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }

  return normalizePaymentRow(data);
}

async function updatePaymentByReference(reference, updates) {
  const { data, error } = await supabase
    .from("payments")
    .update(toDbRecord(updates))
    .eq("reference", reference)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update payment: ${error.message}`);
  }

  return normalizePaymentRow(data);
}

async function findPendingTransferPaymentMatch({ accountNumber, email, amount }) {
  let query = supabase
    .from("payments")
    .select("*")
    .eq("channel", "transfer")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  if (accountNumber) {
    query = query.eq("virtual_account_number", accountNumber);
  }
  if (email) {
    query = query.eq("email", email);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to find pending transfer payment: ${error.message}`);
  }

  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) {
    return null;
  }

  if (amount == null) {
    return normalizePaymentRow(rows[0]);
  }

  const exactAmountMatch = rows.find((row) => Number(row.amount) === Number(amount));
  return normalizePaymentRow(exactAmountMatch || rows[0]);
}

async function getLatestSuccessfulPaymentByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "success")
    .ilike("email", normalizedEmail)
    .order("paid_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch successful payment by email: ${error.message}`);
  }

  return normalizePaymentRow(data);
}

module.exports = {
  findPendingTransferPaymentMatch,
  getPaymentByReference,
  getLatestSuccessfulPaymentByEmail,
  updatePaymentByReference,
  upsertPayment,
};
