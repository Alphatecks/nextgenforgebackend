const { readFile } = require("node:fs/promises");
const path = require("node:path");

const TEMPLATE_DIR = path.join(__dirname, "..", "email-templates", "congratulations-approval");
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, "index.html");
const STYLES_PATH = path.join(TEMPLATE_DIR, "styles.css");

const DEFAULT_PORTAL_URL = "https://agenticaibuilders.slack.com/";

let cachedTemplate = null;
let cachedStyles = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadTemplate() {
  if (cachedTemplate == null) {
    cachedTemplate = await readFile(TEMPLATE_PATH, "utf-8");
  }
  return cachedTemplate;
}

async function loadStyles() {
  if (cachedStyles == null) {
    cachedStyles = await readFile(STYLES_PATH, "utf-8");
  }
  return cachedStyles;
}

async function renderCongratulationsApprovalEmail({ recipientName, portalUrl }) {
  const [template, styles] = await Promise.all([loadTemplate(), loadStyles()]);
  const safeName = escapeHtml(recipientName || "there");
  const safePortalUrl = escapeHtml(portalUrl || process.env.EMAIL_ONBOARDING_URL || DEFAULT_PORTAL_URL);

  return template
    .replace(
      /<link rel="stylesheet" href="\.\/*styles\.css" \/>/,
      `<style>\n${styles}\n</style>`,
    )
    .replace(/\{\{recipientName\}\}/g, safeName)
    .replace(/\{\{portalUrl\}\}/g, safePortalUrl);
}

module.exports = { renderCongratulationsApprovalEmail };
