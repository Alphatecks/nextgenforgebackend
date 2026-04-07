const { z } = require("zod");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value;
}

const requiredText = (fieldLabel) =>
  z
    .string()
    .trim()
    .min(1, `${fieldLabel} is required`)
    .max(5000, `${fieldLabel} is too long`);

const optionalText = z
  .string()
  .trim()
  .max(5000, "Text is too long")
  .optional()
  .or(z.literal(""));

const optionalTextFlexible = z.preprocess((value) => {
  if (value == null) {
    return "";
  }
  return normalizeString(value);
}, optionalText);

const flexibleBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
  }
  return value;
}, z.boolean({ error: "Active enrollment must be true or false" }));

const proficiencyLevelSchema = z.preprocess(
  (value) => normalizeString(value)?.toLowerCase(),
  z.enum(["beginner", "intermediate", "expert"], {
    error: "Select a valid proficiency level",
  }),
);

const trainedOnPlatformSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }
  return normalizeString(value)?.toLowerCase();
}, z.enum(["yes", "no", "maybe"], { error: "Select a valid training status" }));

const dailyCommitHoursSchema = z.preprocess((value) => {
  const normalized = normalizeString(value)?.toLowerCase();
  if (normalized === "2hr") {
    return "2hrs";
  }
  return normalized;
}, z.enum(["1hr", "2hrs", "2hr+"], { error: "Select a valid daily commitment" }));

const paymentOptionSchema = z.preprocess((value) => {
  const normalized = normalizeString(value)?.toLowerCase();
  if (normalized === "team of three") {
    return "team_of_three";
  }
  return normalized?.replace(/\s+/g, "_");
}, z.enum(["full", "installment", "team_of_three"], { error: "Select a valid payment option" }));

const questionnaireSchema = z.object({
  email: z.string().trim().email("Provide a valid email"),
  fullName: requiredText("Full name"),
  whatsappNumber: requiredText("Whatsapp number"),
  expectations: requiredText("Expectations"),
  whySelected: requiredText("Why should you be selected"),
  referredBy: optionalTextFlexible,
  proficiencyLevel: proficiencyLevelSchema,
  activeEnrollment: flexibleBoolean,
  trainedOnAgenticPlatform: trainedOnPlatformSchema,
  dailyCommitHours: dailyCommitHoursSchema,
  paymentOption: paymentOptionSchema,
  source: optionalTextFlexible,
});

module.exports = { questionnaireSchema };
