const cors = require("cors");
const express = require("express");
const paymentRoutes = require("./routes/paymentRoutes");
const questionnaireRoutes = require("./routes/questionnaireRoutes");

const app = express();

app.use(cors());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/questionnaires", questionnaireRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Something went wrong";

  res.status(statusCode).json({ message });
});

module.exports = app;
