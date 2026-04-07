-- Questionnaire storage schema for PostgreSQL
-- Run this file against your database to create the table.

CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(100) NOT NULL,
  expectations TEXT NOT NULL,
  why_selected TEXT NOT NULL,
  referred_by TEXT,
  proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
  active_enrollment BOOLEAN NOT NULL,
  trained_on_agentic_platform VARCHAR(10) NOT NULL CHECK (trained_on_agentic_platform IN ('yes', 'no', 'maybe')),
  daily_commit_hours VARCHAR(10) NOT NULL CHECK (daily_commit_hours IN ('1hr', '2hrs', '2hr+')),
  payment_option VARCHAR(20) NOT NULL CHECK (payment_option IN ('full', 'installment', 'team_of_three')),
  source TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_email ON questionnaires (email);
CREATE INDEX IF NOT EXISTS idx_questionnaires_submitted_at ON questionnaires (submitted_at DESC);
