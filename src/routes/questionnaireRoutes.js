const express = require("express");
const {
  submitQuestionnaire,
  listQuestionnaires,
} = require("../controllers/questionnaireController");

const router = express.Router();

router.post("/", submitQuestionnaire);
router.get("/", listQuestionnaires);

module.exports = router;
