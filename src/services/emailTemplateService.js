const { readFile } = require("node:fs/promises");
const path = require("node:path");

const TEMPLATE_DIR = path.join(__dirname, "..", "email-templates", "congratulations-approval");
const TEMPLATE_PATH = path.join(TEMPLATE_DIR, "index.html");
const STYLES_PATH = path.join(TEMPLATE_DIR, "styles.css");
const LOGO_PATH = path.join(__dirname, "..", "email-templates", "assets", "logo.png");

const DEFAULT_PORTAL_URL = "https://agenticaibuilders.slack.com/";

let cachedTemplate = null;
let cachedStyles = null;
let cachedLogoDataUrl = null;

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

async function loadLogoDataUrl() {
  if (cachedLogoDataUrl == null) {
    const logoBuffer = await readFile(LOGO_PATH);
    cachedLogoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }
  return cachedLogoDataUrl;
}

async function renderCongratulationsApprovalEmail({ recipientName, portalUrl }) {
  const [template, styles, logoSrc] = await Promise.all([
    loadTemplate(),
    loadStyles(),
    loadLogoDataUrl(),
  ]);
  const safeName = escapeHtml(recipientName || "there");
  const safePortalUrl = escapeHtml(portalUrl || process.env.EMAIL_ONBOARDING_URL || DEFAULT_PORTAL_URL);

  return template
    .replace(
      /<link rel="stylesheet" href="\.\/*styles\.css" \/>/,
      `<style>\n${styles}\n</style>`,
    )
    .replace(/\{\{recipientName\}\}/g, safeName)
    .replace(/\{\{logoSrc\}\}/g, logoSrc)
    .replace(/\{\{portalUrl\}\}/g, safePortalUrl);
}

module.exports = { renderCongratulationsApprovalEmail };
