const express = require("express");
const {
  checkQuestionnaireEmail,
  submitQuestionnaire,
  listQuestionnaires,
} = require("../controllers/questionnaireController");

const router = express.Router();

router.post("/", submitQuestionnaire);
router.get("/", listQuestionnaires);
router.get("/check-email", checkQuestionnaireEmail);

module.exports = router;
