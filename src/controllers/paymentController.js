const {
  initializeCardPaymentSchema,
  initializeTransferPaymentSchema,
  referenceParamsSchema,
} = require("../schemas/paymentSchema");
const { HttpError } = require("../utils/httpError");
const {
  getPaymentStatus,
  initializeCardPayment,
  initializeTransferPayment,
  processWebhookEvent,
} = require("../services/paymentService");
const { verifyPaystackSignature } = require("../services/paystackService");

function validationErrorResponse(parsed) {
  return {
    message: parsed.error.issues[0]?.message || "Invalid request payload",
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

async function initializeCard(req, res, next) {
  try {
    const parsed = initializeCardPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationErrorResponse(parsed));
    }

    const payment = await initializeCardPayment(parsed.data);
    return res.status(201).json({
      message: "Card payment initialized successfully",
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

async function initializeTransfer(req, res, next) {
  try {
    const parsed = initializeTransferPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(validationErrorResponse(parsed));
    }

    const payment = await initializeTransferPayment(parsed.data);
    return res.status(201).json({
      message: "Transfer payment initialized successfully",
      data: payment,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPaymentByReference(req, res, next) {
  try {
    const parsed = referenceParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json(validationErrorResponse(parsed));
    }

    const paymentStatus = await getPaymentStatus(parsed.data.reference);
    const resolvedStatus = paymentStatus?.payment?.status || "pending";
    const paid = resolvedStatus === "success";
    return res.status(200).json({
      message: "Payment status fetched successfully",
      status: resolvedStatus,
      paid,
      data: paymentStatus,
    });
  } catch (error) {
    return next(error);
  }
}

async function receiveWebhook(req, res, next) {
  try {
    const signature = req.get("x-paystack-signature");
    const rawBodyBuffer = req.body;
    const rawBody = Buffer.isBuffer(rawBodyBuffer)
      ? rawBodyBuffer.toString("utf-8")
      : JSON.stringify(req.body || {});

    const isValidSignature = verifyPaystackSignature(rawBody, signature);
    if (!isValidSignature) {
      throw new HttpError(401, "Invalid Paystack signature");
    }

    const event = JSON.parse(rawBody);
    const outcome = await processWebhookEvent(event);
    return res.status(200).json({ message: "Webhook processed", data: outcome });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getPaymentByReference, initializeCard, initializeTransfer, receiveWebhook };
