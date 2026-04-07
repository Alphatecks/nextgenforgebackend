-- Payments table for Paystack transaction tracking
-- Run this in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  reference VARCHAR(120) UNIQUE NOT NULL,
  email VARCHAR(255),
  amount BIGINT NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'NGN',
  channel VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  authorization_url TEXT,
  access_code VARCHAR(255),
  virtual_account_name VARCHAR(255),
  virtual_account_number VARCHAR(50),
  bank_name VARCHAR(255),
  questionnaire_id VARCHAR(255),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  paystack_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments (reference);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments (email);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
