const { questionnaireSchema } = require("../schemas/questionnaireSchema");
const {
  readQuestionnaires,
  saveQuestionnaire,
} = require("../services/questionnaireService");
const { HttpError } = require("../utils/httpError");

async function submitQuestionnaire(req, res, next) {
  try {
    const parsed = questionnaireSchema.safeParse(req.body);

    if (!parsed.success) {
      return next(new HttpError(400, parsed.error.issues[0]?.message || "Invalid data"));
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

module.exports = { submitQuestionnaire, listQuestionnaires };
