const express = require("express");
const {
  getPaymentByReference,
  initializeCard,
  initializeTransfer,
  receiveWebhook,
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/initialize-card", initializeCard);
router.post("/initialize-transfer", initializeTransfer);
router.post("/webhook", receiveWebhook);
router.get("/:reference", getPaymentByReference);

module.exports = router;
