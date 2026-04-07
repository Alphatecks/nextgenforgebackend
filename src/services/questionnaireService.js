const { randomUUID } = require("node:crypto");
const { supabase } = require("../supabase");

async function saveQuestionnaire(payload) {
  const id = randomUUID();
  const { data, error } = await supabase
    .from("questionnaires")
    .insert({
      id,
      email: payload.email,
      full_name: payload.fullName,
      whatsapp_number: payload.whatsappNumber,
      expectations: payload.expectations,
      why_selected: payload.whySelected,
      referred_by: payload.referredBy || null,
      proficiency_level: payload.proficiencyLevel,
      active_enrollment: payload.activeEnrollment,
      trained_on_agentic_platform: payload.trainedOnAgenticPlatform,
      daily_commit_hours: payload.dailyCommitHours,
      payment_option: payload.paymentOption,
      source: payload.source || null,
    })
    .select(
      `
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
    `,
    )
    .single();

  if (error) {
    throw new Error(`Failed to save questionnaire: ${error.message}`);
  }

  return mapRowToQuestionnaire(data);
}

async function readQuestionnaires() {
  const { data, error } = await supabase
    .from("questionnaires")
    .select(
      `
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
    `,
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to read questionnaires: ${error.message}`);
  }

  return (data || []).map(mapRowToQuestionnaire);
}

async function hasQuestionnaireForEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const { count, error } = await supabase
    .from("questionnaires")
    .select("id", { count: "exact", head: true })
    .ilike("email", normalizedEmail);

  if (error) {
    throw new Error(`Failed to check questionnaire email: ${error.message}`);
  }

  return (count || 0) > 0;
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

module.exports = { hasQuestionnaireForEmail, readQuestionnaires, saveQuestionnaire };
