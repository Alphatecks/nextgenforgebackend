const { questionnaireSchema } = require("../schemas/questionnaireSchema");
const {
  hasQuestionnaireForEmail,
  readQuestionnaires,
  saveQuestionnaire,
} = require("../services/questionnaireService");
const { HttpError } = require("../utils/httpError");

function pickFirstValue(source, keys) {
  for (const key of keys) {
    if (source[key] !== undefined) {
      return source[key];
    }
  }
  return undefined;
}

function toOptionalString(value) {
  if (value == null) {
    return undefined;
  }
  return typeof value === "string" ? value : String(value);
}

function normalizeQuestionnairePayload(body) {
  const source = body && typeof body === "object" ? body : {};

  return {
    email: toOptionalString(pickFirstValue(source, ["email", "Email"])),
    fullName: toOptionalString(pickFirstValue(source, ["fullName", "full_name", "fullname", "name"])),
    whatsappNumber: toOptionalString(
      pickFirstValue(source, ["whatsappNumber", "whatsapp_number", "whatsapp", "phone", "phoneNumber"]),
    ),
    expectations: toOptionalString(pickFirstValue(source, ["expectations", "expectation"])),
    whySelected: toOptionalString(
      pickFirstValue(source, ["whySelected", "why_selected", "why_should_you_be_selected"]),
    ),
    referredBy: toOptionalString(pickFirstValue(source, ["referredBy", "referred_by", "referrer"])),
    proficiencyLevel: toOptionalString(
      pickFirstValue(source, ["proficiencyLevel", "proficiency_level", "level"]),
    ),
    activeEnrollment: pickFirstValue(source, ["activeEnrollment", "active_enrollment", "isEnrolled"]),
    trainedOnAgenticPlatform: pickFirstValue(source, [
      "trainedOnAgenticPlatform",
      "trained_on_agentic_platform",
      "trainedOnAgentic",
    ]),
    dailyCommitHours: toOptionalString(
      pickFirstValue(source, ["dailyCommitHours", "daily_commit_hours", "dailyCommitment"]),
    ),
    paymentOption: toOptionalString(pickFirstValue(source, ["paymentOption", "payment_option", "paymentPlan"])),
    source: toOptionalString(pickFirstValue(source, ["source", "utmSource", "utm_source"])),
  };
}

async function submitQuestionnaire(req, res, next) {
  try {
    const parsed = questionnaireSchema.safeParse(normalizeQuestionnairePayload(req.body));

    if (!parsed.success) {
      return res.status(400).json({
        message: parsed.error.issues[0]?.message || "Invalid data",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const saved = await saveQuestionnaire(parsed.data);

    return res.status(201).json({
      message: "Questionnaire submitted successfully",
      data: saved,
    });
  } catch (error) {
    return next(error);
  }
}

async function listQuestionnaires(_req, res, next) {
  try {
    const data = await readQuestionnaires();
    return res.status(200).json({ count: data.length, data });
  } catch (error) {
    return next(error);
  }
}

async function checkQuestionnaireEmail(req, res, next) {
  try {
    const email = String(req.query.email || "").trim();
    if (!email) {
      return next(new HttpError(400, "Email query parameter is required"));
    }

    const exists = await hasQuestionnaireForEmail(email);
    return res.status(200).json({ email, exists });
  } catch (error) {
    return next(error);
  }
}

module.exports = { checkQuestionnaireEmail, submitQuestionnaire, listQuestionnaires };
