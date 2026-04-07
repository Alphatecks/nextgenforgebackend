const { randomUUID } = require("node:crypto");
const { query } = require("../db");

async function saveQuestionnaire(payload) {
  const id = randomUUID();
  const sql = `
    INSERT INTO questionnaires (
      id,
      email,
      full_name,
      whatsapp_number,
      expectations,
      why_selected,
      referred_by,
      proficiency_level,
      active_enrollment,
      trained_on_agentic_platform,
      daily_commit_hours,
      payment_option,
      source
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    RETURNING
      id,
      email,
      full_name,
      whatsapp_number,
      expectations,
      why_selected,
      referred_by,
      proficiency_level,
      active_enrollment,
      trained_on_agentic_platform,
      daily_commit_hours,
      payment_option,
      source,
      submitted_at
  `;

  const values = [
    id,
    payload.email,
    payload.fullName,
    payload.whatsappNumber,
    payload.expectations,
    payload.whySelected,
    payload.referredBy || null,
    payload.proficiencyLevel,
    payload.activeEnrollment,
    payload.trainedOnAgenticPlatform,
    payload.dailyCommitHours,
    payload.paymentOption,
    payload.source || null,
  ];

  const { rows } = await query(sql, values);
  return mapRowToQuestionnaire(rows[0]);
}

async function readQuestionnaires() {
  const { rows } = await query(
    `
      SELECT
        id,
        email,
        full_name,
        whatsapp_number,
        expectations,
        why_selected,
        referred_by,
        proficiency_level,
        active_enrollment,
        trained_on_agentic_platform,
        daily_commit_hours,
        payment_option,
        source,
        submitted_at
      FROM questionnaires
      ORDER BY submitted_at DESC
    `,
  );

  return rows.map(mapRowToQuestionnaire);
}

function mapRowToQuestionnaire(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    whatsappNumber: row.whatsapp_number,
    expectations: row.expectations,
    whySelected: row.why_selected,
    referredBy: row.referred_by || "",
    proficiencyLevel: row.proficiency_level,
    activeEnrollment: row.active_enrollment,
    trainedOnAgenticPlatform: row.trained_on_agentic_platform,
    dailyCommitHours: row.daily_commit_hours,
    paymentOption: row.payment_option,
    source: row.source || "",
    submittedAt:
      row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
  };
}

module.exports = { readQuestionnaires, saveQuestionnaire };
