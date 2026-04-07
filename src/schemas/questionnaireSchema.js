const { z } = require("zod");

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

const questionnaireSchema = z.object({
  email: z.string().trim().email("Provide a valid email"),
  fullName: requiredText("Full name"),
  whatsappNumber: requiredText("Whatsapp number"),
  expectations: requiredText("Expectations"),
  whySelected: requiredText("Why should you be selected"),
  referredBy: optionalText,
  proficiencyLevel: z.enum(["beginner", "intermediate", "expert"], {
    error: "Select a valid proficiency level",
  }),
  activeEnrollment: z.boolean(),
  trainedOnAgenticPlatform: z.enum(["yes", "no", "maybe"], {
    error: "Select a valid training status",
  }),
  dailyCommitHours: z.enum(["1hr", "2hrs", "2hr+"], {
    error: "Select a valid daily commitment",
  }),
  paymentOption: z.enum(["full", "installment", "team_of_three"], {
    error: "Select a valid payment option",
  }),
  source: optionalText,
});

module.exports = { questionnaireSchema };
